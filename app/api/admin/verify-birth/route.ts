import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Declare global types to prevent TS errors
declare global {
    var __BROWSER__: import('puppeteer-core').Browser | undefined;
    var __PAGE__: import('puppeteer-core').Page | undefined;
}

// Ensure browser is closed
async function closeBrowser() {
    if (global.__PAGE__ && !global.__PAGE__.isClosed()) {
        try { await global.__PAGE__.close(); } catch (e) { }
    }
    if (global.__BROWSER__) {
        try {
            if (global.__BROWSER__.isConnected()) await global.__BROWSER__.close();
        } catch (e) { }
    }
    global.__BROWSER__ = undefined;
    global.__PAGE__ = undefined;
}

// Helper to launch browser
async function getBrowser() {
    // Always start fresh for reliability given the "Failed to connect" errors
    await closeBrowser();

    // Local Development Configuration (Windows/Mac)
    if (process.env.NODE_ENV === 'development') {
        const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

        global.__BROWSER__ = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            executablePath: localExecutablePath,
            headless: true,
            defaultViewport: null,
        });
        return global.__BROWSER__;
    }

    // Production Configuration
    global.__BROWSER__ = await puppeteer.launch({
        args: [...chromium.args, '--disable-dev-shm-usage', '--disable-gpu'],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'),
        headless: true,
    });
    return global.__BROWSER__;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, nid, dob, captchaAnswer } = body;

        // --- STEP 1: FETCH CAPTCHA ---
        if (action === 'FETCH_CAPTCHA') {
            try {
                const browser = await getBrowser();
                const page = await browser.newPage();
                global.__PAGE__ = page;

                await page.goto('https://everify.bdris.gov.bd/', { waitUntil: 'domcontentloaded', timeout: 30000 });

                // Wait for captcha
                await page.waitForSelector('#CaptchaImage', { timeout: 15000 });
                const captchaElement = await page.$('#CaptchaImage');

                let captchaBase64 = '';
                if (captchaElement) {
                    captchaBase64 = await captchaElement.screenshot({ encoding: 'base64' });
                } else {
                    throw new Error('Captcha element not found');
                }

                // Keep browser open for Step 2 (session persistence needed for captcha)
                return NextResponse.json({
                    success: true,
                    captchaImage: `data:image/png;base64,${captchaBase64}`,
                });

            } catch (e) {
                await closeBrowser();
                console.error('Fetch Captcha Error:', e);
                // @ts-ignore
                return NextResponse.json({ error: `Failed to load captcha: ${e.message}` }, { status: 500 });
            }
        }

        // --- STEP 2: SUBMIT & VERIFY ---
        if (action === 'VERIFY') {
            if (!captchaAnswer || !nid || !dob) {
                return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
            }

            // Reuse existing page - MUST exist from Step 1
            if (!global.__BROWSER__) {
                return NextResponse.json({ error: 'Session Expired: Browser instance lost. Please try again.' }, { status: 400 });
            }
            if (!global.__PAGE__) {
                return NextResponse.json({ error: 'Session Expired: Page instance lost. Please try again.' }, { status: 400 });
            }
            if (global.__PAGE__.isClosed()) {
                return NextResponse.json({ error: 'Session Expired: Page closed unexpectedly. Please try again.' }, { status: 400 });
            }

            const page = global.__PAGE__;

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

                if (content.includes('wrong captcha')) {
                    throw new Error('Wrong Captcha Code. Please try again.');
                }
                if (content.includes('does not match') || content.includes('no record found')) {
                    throw new Error('No Record Found for this NID/DOB.');
                }
                if (!content.includes('registered person name')) {
                    throw new Error('Verification failed. Server response not recognized.');
                }

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

                // CLEANUP ON SUCCESS
                await closeBrowser();

                return NextResponse.json({
                    success: true,
                    pdfBase64: pdfBase64
                });

            } catch (e: unknown) {
                // CLEANUP ON FAILURE
                await closeBrowser();
                console.error('Verify Step Error:', e);
                // @ts-ignore
                const errorMessage = e.message || 'Verification Failed';
                return NextResponse.json({ error: errorMessage }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: unknown) {
        console.error('API Error:', error);
        await closeBrowser();
        // @ts-ignore
        const errorMessage = error.message || 'Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
