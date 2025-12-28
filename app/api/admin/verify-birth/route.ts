import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Declare global types
declare global {
    var __BROWSER_WS__: string | undefined; // Store WS Endpoint instead of object
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
    // Try to connect to existing session
    if (global.__BROWSER_WS__) {
        try {
            const browser = await puppeteer.connect({ browserWSEndpoint: global.__BROWSER_WS__ });
            if (browser.isConnected()) return browser;
        } catch (e) {
            console.log('Failed to connect to existing browser, launching new one.');
        }
    }

    // Launch new
    const browser = await launchBrowser();
    global.__BROWSER_WS__ = browser.wsEndpoint();

    // Create a dummy page to keep the process alive
    try { await browser.newPage(); } catch (e) { }

    return browser;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, nid, dob, captchaAnswer } = body;

        // --- STEP 1: FETCH CAPTCHA ---
        if (action === 'FETCH_CAPTCHA') {
            try {
                const browser = await getBrowser();

                // Open a NEW page for this session (leave dummy alone)
                const page = await browser.newPage();

                await page.goto('https://everify.bdris.gov.bd/', { waitUntil: 'domcontentloaded', timeout: 30000 });

                // Wait for captcha
                await page.waitForSelector('#CaptchaImage', { timeout: 15000 });
                const captchaElement = await page.$('#CaptchaImage');

                if (!captchaElement) throw new Error('Captcha element not found');
                const captchaBase64 = await captchaElement.screenshot({ encoding: 'base64' });

                // Mark this page so we can find it later
                await page.evaluate(() => { (window as any)._IS_TARGET_PAGE = 'YES'; });

                // Disconnect Node Wrapper to prevent accidental closure (keep Process alive)
                browser.disconnect();

                return NextResponse.json({
                    success: true,
                    captchaImage: `data:image/png;base64,${captchaBase64}`,
                });

            } catch (e: any) {
                return NextResponse.json({ error: `Failed to load captcha: ${e.message}` }, { status: 500 });
            }
        }

        // --- STEP 2: VERIFY ---
        if (action === 'VERIFY') {
            if (!captchaAnswer || !nid || !dob) {
                return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
            }

            if (!global.__BROWSER_WS__) {
                return NextResponse.json({ error: 'Session Expired: Browser unavailable. Refresh.' }, { status: 400 });
            }

            let browser;
            try {
                browser = await puppeteer.connect({ browserWSEndpoint: global.__BROWSER_WS__ });
            } catch (e) {
                return NextResponse.json({ error: 'Session Expired: Reconnection failed. Refresh.' }, { status: 400 });
            }

            // Find the correct page (the last one opened that isn't dummy)
            const pages = await browser.pages();
            let page;

            // Search for our marked page
            for (const p of pages) {
                try {
                    const isTarget = await p.evaluate(() => (window as any)._IS_TARGET_PAGE === 'YES');
                    if (isTarget) {
                        page = p;
                        break;
                    }
                } catch (e) { }
            }

            if (!page) {
                browser.disconnect();
                return NextResponse.json({ error: `Session Expired: Page lost (Active Pages: ${pages.length}). Refresh.` }, { status: 400 });
            }

            try {
                // Fill Form
                await page.evaluate((nidValue, dobValue, captchaValue) => {
                    const ubrn = document.querySelector('#ubrn') as HTMLInputElement;
                    const birthDate = document.querySelector('#BirthDate') as HTMLInputElement;
                    const captcha = document.querySelector('#CaptchaInputText') as HTMLInputElement;

                    if (ubrn) {
                        ubrn.value = nidValue;
                        ubrn.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (birthDate) {
                        birthDate.value = dobValue;
                        birthDate.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (captcha) {
                        captcha.value = captchaValue;
                        captcha.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, nid, dob, captchaAnswer);

                await new Promise(r => setTimeout(r, 500));

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

                if (content.includes('wrong captcha')) throw new Error('Wrong Captcha Code. Please try again.');
                if (content.includes('does not match') || content.includes('no record found')) throw new Error('No Record Found for this NID/DOB.');
                if (!content.includes('registered person name')) throw new Error('Verification failed. Server response not recognized.');

                // Generate PDF: Screenshot -> PDF Strategy
                await page.emulateMediaType('print');
                await page.setViewport({ width: 1000, height: 1500, deviceScaleFactor: 2 });
                await page.evaluate(() => {
                    document.body.style.backgroundColor = 'white';
                    const style = document.createElement('style');
                    style.innerHTML = `
                        body { background-color: white !important; margin: 0 !important; padding: 10px !important; }
                        .container, .main-content, #main { 
                            width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important;
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

                // CLEANUP: Close THIS page only.
                await page.close();
                browser.disconnect();

                return NextResponse.json({
                    success: true,
                    pdfBase64: pdfBase64
                });

            } catch (e: any) {
                await page.close();
                browser.disconnect();
                console.error('Verify Step Error:', e);
                return NextResponse.json({ error: e.message || 'Verification Failed' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
