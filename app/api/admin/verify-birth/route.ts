import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { SessionManager, type VerificationSession } from '@/lib/redis';

// Declare global types
declare global {
    var __BROWSER_WS__: string | undefined;
}

// Session storage now handled by Redis (see lib/redis.ts)

// Generate session token
function generateSessionToken(): string {
    return randomBytes(32).toString('hex');
}

// Session File Path
const SESSION_FILE = path.join(process.cwd(), '.browser-session');

function saveSession(wsEndpoint: string) {
    try {
        fs.writeFileSync(SESSION_FILE, wsEndpoint, 'utf-8');
    } catch (e) {
        console.error('Failed to save session:', e);
    }
}

function loadSession(): string | null {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            return fs.readFileSync(SESSION_FILE, 'utf-8').trim();
        }
    } catch (e) {
        console.error('Failed to load session:', e);
    }
    return null;
}

// Helper to launch browser
async function launchBrowser() {
    if (process.env.NODE_ENV === 'development') {
        const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        return await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            executablePath: localExecutablePath,
            headless: true,
            defaultViewport: null,
        });
    }
    return await puppeteer.launch({
        args: [...chromium.args, '--disable-dev-shm-usage', '--disable-gpu'],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'),
        headless: true,
    });
}

// Get Connected Browser
async function getBrowser() {
    let wsEndpoint = global.__BROWSER_WS__;

    if (!wsEndpoint) {
        wsEndpoint = loadSession() || undefined;
        if (wsEndpoint) console.log('Recovered session from file');
    }

    if (wsEndpoint) {
        try {
            const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
            if (browser.isConnected()) {
                await browser.version();
                global.__BROWSER_WS__ = wsEndpoint;
                return browser;
            }
        } catch (e) {
            console.log('Session invalid. Clearing...');
            global.__BROWSER_WS__ = undefined;
            try { fs.unlinkSync(SESSION_FILE); } catch (err) { }
        }
    }

    const browser = await launchBrowser();
    const newEndpoint = browser.wsEndpoint();
    global.__BROWSER_WS__ = newEndpoint;
    saveSession(newEndpoint);

    return browser;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, nid, dob, captchaAnswer, sessionToken } = body;

        // --- STEP 1: FETCH CAPTCHA ---
        if (action === 'FETCH_CAPTCHA') {
            let browser;
            let page;

            try {
                browser = await getBrowser();
                page = await browser.newPage();

                await page.goto('https://everify.bdris.gov.bd/', {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                // Wait for captcha with retries
                let captchaBase64;
                let retries = 3;

                while (retries > 0) {
                    try {
                        await page.waitForSelector('#CaptchaImage', {
                            visible: true,
                            timeout: 10000
                        });

                        await new Promise(r => setTimeout(r, 1000));

                        const hasSize = await page.evaluate(() => {
                            const img = document.querySelector('#CaptchaImage') as HTMLImageElement;
                            return img && img.offsetWidth > 0 && img.offsetHeight > 0;
                        });

                        if (!hasSize) {
                            throw new Error('Captcha element has no dimensions');
                        }

                        const captchaElement = await page.$('#CaptchaImage');
                        if (!captchaElement) throw new Error('Captcha element not found');

                        captchaBase64 = await captchaElement.screenshot({ encoding: 'base64' });
                        break;

                    } catch (e) {
                        retries--;
                        if (retries === 0) throw e;
                        console.log(`Captcha load attempt failed, retrying... (${retries} left)`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                // Generate session token and store session in Redis
                const token = generateSessionToken();
                const pageUrl = page.url();

                await SessionManager.set(token, {
                    wsEndpoint: browser.wsEndpoint(),
                    pageUrl: pageUrl,
                    timestamp: Date.now()
                });

                console.log('Created session in Redis:', token);

                // DON'T disconnect - keep browser alive
                // DON'T close page - we need it for VERIFY

                return NextResponse.json({
                    success: true,
                    captchaImage: `data:image/png;base64,${captchaBase64}`,
                    sessionToken: token
                });

            } catch (e: any) {
                if (page) await page.close().catch(() => { });
                if (browser) browser.disconnect();

                if (e.message.includes('Node has 0 width') || e.message.includes('no dimensions')) {
                    return NextResponse.json({
                        error: 'Captcha loading failed. Please try again.'
                    }, { status: 503 });
                }

                return NextResponse.json({
                    error: `Failed to load captcha: ${e.message}`
                }, { status: 500 });
            }
        }

        // --- STEP 2: VERIFY ---
        if (action === 'VERIFY') {
            if (!captchaAnswer || !nid || !dob || !sessionToken) {
                return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
            }

            // Look up session from Redis
            const session = await SessionManager.get(sessionToken);
            if (!session) {
                return NextResponse.json({
                    error: 'Session expired or invalid. Please refresh and try again.'
                }, { status: 400 });
            }

            // Check session age (5 minutes max)
            const sessionAge = Date.now() - session.timestamp;
            if (sessionAge > 5 * 60 * 1000) {
                await SessionManager.delete(sessionToken);
                return NextResponse.json({
                    error: 'Session expired. Please refresh and try again.'
                }, { status: 400 });
            }

            let browser;
            let page;

            try {
                // Connect to the stored browser
                browser = await puppeteer.connect({ browserWSEndpoint: session.wsEndpoint });

                if (!browser.isConnected()) {
                    await SessionManager.delete(sessionToken);
                    return NextResponse.json({
                        error: 'Browser connection lost. Please refresh and try again.'
                    }, { status: 400 });
                }

                // Find the page by URL
                const pages = await browser.pages();
                console.log(`Looking for page with URL: ${session.pageUrl}`);
                console.log(`Total pages: ${pages.length}`);

                for (const p of pages) {
                    try {
                        const url = p.url();
                        console.log('Checking page:', url);
                        if (url === session.pageUrl || url.includes('everify.bdris.gov.bd')) {
                            page = p;
                            console.log('Found matching page!');
                            break;
                        }
                    } catch (e) {
                        console.log('Error checking page:', e);
                    }
                }

                if (!page) {
                    await SessionManager.delete(sessionToken);
                    browser.disconnect();
                    return NextResponse.json({
                        error: 'Verification page not found. Please refresh and try again.'
                    }, { status: 400 });
                }

                // Fill form
                await page.evaluate((nidValue, dobValue, captchaValue) => {
                    const ubrn = document.querySelector('#ubrn') as HTMLInputElement;
                    const birthDate = document.querySelector('#BirthDate') as HTMLInputElement;
                    const captcha = document.querySelector('#CaptchaInputText') as HTMLInputElement;

                    if (ubrn) {
                        ubrn.value = nidValue;
                        ubrn.dispatchEvent(new Event('input', { bubbles: true }));
                        ubrn.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    if (birthDate) {
                        birthDate.value = dobValue;
                        birthDate.dispatchEvent(new Event('input', { bubbles: true }));
                        birthDate.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    if (captcha) {
                        captcha.value = captchaValue;
                        captcha.dispatchEvent(new Event('input', { bubbles: true }));
                        captcha.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, nid, dob, captchaAnswer);

                await new Promise(r => setTimeout(r, 1000));

                // Submit and wait for response
                const searchBtnSelector = 'input[type="submit"][value="Search"]';
                await page.waitForSelector(searchBtnSelector, { timeout: 5000 });

                await Promise.all([
                    page.click(searchBtnSelector),
                    page.waitForFunction(
                        () => {
                            const text = document.body.innerText.toLowerCase();
                            return text.includes('registered person name') ||
                                text.includes('wrong captcha') ||
                                text.includes('no record found') ||
                                text.includes('does not match');
                        },
                        { timeout: 60000, polling: 1000 }
                    )
                ]);

                const content = (await page.content()).toLowerCase();

                if (content.includes('wrong captcha')) {
                    throw new Error('Wrong Captcha Code. Please try again.');
                }
                if (content.includes('does not match') || content.includes('no record found')) {
                    throw new Error('No Record Found for this NID/DOB.');
                }
                if (!content.includes('registered person name')) {
                    throw new Error('Verification failed. Server response not recognized.');
                }

                // Wait for data to load - check for Bengali characters OR any substantial text
                console.log('Waiting for data to load...');
                try {
                    await page.waitForFunction(
                        () => {
                            const cells = Array.from(document.querySelectorAll('td'));
                            // Check for Bengali Unicode characters OR substantial English text
                            const hasBengali = cells.some(cell =>
                                /[\u0980-\u09FF]/.test(cell.innerText)
                            );
                            const hasSubstantialText = cells.some(cell => {
                                const text = cell.innerText.trim();
                                // Text longer than 5 chars and not "WE"
                                return text.length > 5 && text !== 'WE';
                            });
                            return hasBengali || hasSubstantialText;
                        },
                        { timeout: 15000, polling: 2000 }
                    );
                    console.log('Data loaded successfully!');
                } catch (e) {
                    console.warn('Data detection timeout - proceeding with current state');
                }

                // Additional wait for rendering
                await new Promise(r => setTimeout(r, 2000));

                // Generate PDF
                await page.emulateMediaType('screen');
                await page.setViewport({ width: 1000, height: 1500, deviceScaleFactor: 2 });

                await page.evaluate(() => {
                    document.body.style.backgroundColor = 'white';
                    const style = document.createElement('style');
                    style.innerHTML = `
                        body { background-color: white !important; margin: 0 !important; padding: 10px !important; }
                        .container, .main-content, #main { 
                            width: 100% !important; max-width: none !important; 
                            margin: 0 !important; padding: 0 !important;
                            box-shadow: none !important; border: none !important;
                        }
                        table { width: 100% !important; }
                    `;
                    document.head.appendChild(style);
                });

                const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png' });

                const { PDFDocument } = await import('pdf-lib');
                const pdfDoc = await PDFDocument.create();
                const pngImage = await pdfDoc.embedPng(screenshotBuffer);
                const pngDims = pngImage.scale(1);
                const pageA4 = pdfDoc.addPage([595.28, 841.89]);
                const margin = 20;
                const availableWidth = pageA4.getWidth() - (margin * 2);
                const scaleFactor = availableWidth / pngDims.width;

                pageA4.drawImage(pngImage, {
                    x: margin,
                    y: pageA4.getHeight() - (pngDims.height * scaleFactor) - margin,
                    width: pngDims.width * scaleFactor,
                    height: pngDims.height * scaleFactor,
                });

                const pdfBytes = await pdfDoc.save();
                const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

                // Cleanup: Remove session from Redis and close page
                await SessionManager.delete(sessionToken);
                await page.close();
                browser.disconnect();

                console.log('Verification successful, session cleaned up');

                return NextResponse.json({
                    success: true,
                    pdfBase64: pdfBase64
                });

            } catch (e: any) {
                if (page) await page.close().catch(() => { });
                if (browser) browser.disconnect();
                await SessionManager.delete(sessionToken);
                console.error('Verify Step Error:', e);
                return NextResponse.json({
                    error: e.message || 'Verification Failed'
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: error.message || 'Server Error'
        }, { status: 500 });
    }
}
