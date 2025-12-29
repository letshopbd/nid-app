import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import fs from 'fs';
import path from 'path';

// Declare global types
declare global {
    var __BROWSER_WS__: string | undefined;
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
        const { action, nid, dob, captchaAnswer } = body;

        // --- STEP 1: FETCH CAPTCHA ---
        if (action === 'FETCH_CAPTCHA') {
            let browser;
            let page;

            try {
                browser = await getBrowser();

                // ALWAYS create a fresh page for each verification attempt
                page = await browser.newPage();

                // Navigate to portal
                await page.goto('https://everify.bdris.gov.bd/', {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                // Wait for captcha with multiple strategies
                let captchaBase64;
                let retries = 3;

                while (retries > 0) {
                    try {
                        // Wait for element to exist AND be visible
                        await page.waitForSelector('#CaptchaImage', {
                            visible: true,
                            timeout: 10000
                        });

                        // Additional wait for rendering
                        await new Promise(r => setTimeout(r, 1000));

                        // Verify element has dimensions
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
                        break; // Success

                    } catch (e) {
                        retries--;
                        if (retries === 0) throw e;
                        console.log(`Captcha load attempt failed, retrying... (${retries} left)`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                // Mark this page for later use
                await page.evaluate(() => {
                    (window as any)._VERIFICATION_PAGE = Date.now();
                });

                // DON'T disconnect - keep the connection alive for VERIFY step
                // browser.disconnect();

                return NextResponse.json({
                    success: true,
                    captchaImage: `data:image/png;base64,${captchaBase64}`,
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
            if (!captchaAnswer || !nid || !dob) {
                return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
            }

            let browser;
            let page;

            try {
                browser = await getBrowser();

                // Find the verification page with better fallback
                const pages = await browser.pages();
                console.log(`Total pages open: ${pages.length}`);

                // Strategy 1: Find by URL
                for (const p of pages) {
                    try {
                        const url = p.url();
                        console.log('Checking page URL:', url);
                        if (url.includes('everify.bdris.gov.bd') || url.includes('bdris.gov.bd')) {
                            page = p;
                            console.log('Found verification page by URL:', url);
                            break;
                        }
                    } catch (e) {
                        console.log('Error checking page:', e);
                    }
                }

                // Strategy 2: If not found by URL, use the most recent non-blank page
                if (!page) {
                    console.log('URL search failed, trying to find most recent page...');
                    for (let i = pages.length - 1; i >= 0; i--) {
                        try {
                            const url = pages[i].url();
                            // Skip blank pages and about:blank
                            if (url && url !== 'about:blank' && !url.startsWith('chrome://')) {
                                page = pages[i];
                                console.log('Using most recent page:', url);
                                break;
                            }
                        } catch (e) {
                            console.log('Error checking page', i, ':', e);
                        }
                    }
                }

                if (!page) {
                    console.error('No suitable page found. Total pages:', pages.length);
                    browser.disconnect();
                    return NextResponse.json({
                        error: 'Session expired. Please refresh and try again.'
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

                // Wait for complete data loading - IMPROVED
                console.log('Waiting for data to load completely...');

                // Strategy 1: Wait for network idle (longer timeout)
                try {
                    await page.waitForNetworkIdle({ timeout: 10000, idleTime: 1500 });
                    console.log('Network idle achieved');
                } catch (e) {
                    console.log('Network idle timeout, using fallback');
                }

                // Strategy 2: STRICT validation - ensure names are NOT "WE"
                console.log('Waiting for names to load (this may take 30-40 seconds)...');
                try {
                    await page.waitForFunction(
                        () => {
                            // Get all table cells
                            const allCells = Array.from(document.querySelectorAll('td'));

                            // Find the cells containing "REGISTERED PERSON NAME" and "FATHER'S NAME"
                            let personNameValue = '';
                            let fatherNameValue = '';

                            for (let i = 0; i < allCells.length; i++) {
                                const cell = allCells[i];
                                const cellText = cell.innerText.trim();

                                // Check if this is the "REGISTERED PERSON NAME" label
                                if (cellText.includes('REGISTERED PERSON NAME') ||
                                    cellText.includes('Registered Person Name')) {
                                    // The value should be in the next cell
                                    const nextCell = allCells[i + 1];
                                    if (nextCell) {
                                        personNameValue = nextCell.innerText.trim();
                                    }
                                }

                                // Check if this is the "FATHER'S NAME" label
                                if (cellText.includes("FATHER'S NAME") ||
                                    cellText.includes("Father's Name")) {
                                    // The value should be in the next cell
                                    const nextCell = allCells[i + 1];
                                    if (nextCell) {
                                        fatherNameValue = nextCell.innerText.trim();
                                    }
                                }
                            }

                            // STRICT CHECK: Both names must exist and NOT be "WE"
                            const personNameValid = personNameValue.length > 2 && personNameValue !== 'WE';
                            const fatherNameValid = fatherNameValue.length > 2 && fatherNameValue !== 'WE';

                            const isValid = personNameValid && fatherNameValid;

                            if (!isValid) {
                                console.log('Waiting for names... Person:', personNameValue, 'Father:', fatherNameValue);
                            } else {
                                console.log('Names loaded! Person:', personNameValue, 'Father:', fatherNameValue);
                            }

                            return isValid;
                        },
                        { timeout: 40000, polling: 1500 }
                    );
                    console.log('Data validation passed - real names confirmed');
                } catch (e) {
                    // CRITICAL: If names don't load, FAIL the verification
                    console.error('Data validation FAILED - names still showing WE after 40 seconds');
                    throw new Error('Data loading timeout. The government portal is responding slowly. Please try again in a few minutes.');
                }

                // Additional safety wait
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

                // DON'T close page - keep it for potential retries
                // Just disconnect the Node wrapper
                browser.disconnect();

                return NextResponse.json({
                    success: true,
                    pdfBase64: pdfBase64
                });

            } catch (e: any) {
                if (page) await page.close().catch(() => { });
                if (browser) browser.disconnect();
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
