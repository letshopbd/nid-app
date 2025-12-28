import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Declare global types to prevent TS errors
declare global {
    var __BROWSER__: import('puppeteer-core').Browser | undefined;
    var __PAGE__: import('puppeteer-core').Page | undefined;
}

// Helper to launch or get existing browser
async function getBrowser() {
    // If browser exists and connected, return it
    if (global.__BROWSER__ && global.__BROWSER__.isConnected()) {
        return global.__BROWSER__;
    }

    // Local Development Configuration (Windows/Mac)
    if (process.env.NODE_ENV === 'development') {
        const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

        global.__BROWSER__ = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: localExecutablePath,
            headless: true, // Force headless mode to prevent external browser window
            defaultViewport: null,
        });
        return global.__BROWSER__;
    }

    // Production Configuration
    global.__BROWSER__ = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'),
        headless: true, // Force headless mode to prevent external browser window
    });
    return global.__BROWSER__;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, nid, dob, captchaAnswer } = body;

        // --- STEP 1: FETCH CAPTCHA ---
        if (action === 'FETCH_CAPTCHA') {
            const browser = await getBrowser();

            // Close existing page if any to ensure fresh start
            if (global.__PAGE__ && !global.__PAGE__.isClosed()) {
                await global.__PAGE__.close();
            }

            const page = await browser.newPage();
            global.__PAGE__ = page; // Save page for Step 2

            try {
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

                // DO NOT CLOSE BROWSER HERE regarding persistent session
                // We return response, browser stays open in background

                return NextResponse.json({
                    success: true,
                    captchaImage: `data:image/png;base64,${captchaBase64}`,
                });

            } catch (e) {
                if (global.__PAGE__) await global.__PAGE__.close();
                console.error('Fetch Captcha Error:', e);
                throw e;
            }
        }

        // --- STEP 2: SUBMIT & VERIFY ---
        if (action === 'VERIFY') {
            if (!captchaAnswer || !nid || !dob) {
                return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
            }

            // Reuse existing page
            if (!global.__BROWSER__ || !global.__PAGE__ || global.__PAGE__.isClosed()) {
                return NextResponse.json({ error: 'Session Expired. Please try again.' }, { status: 400 });
            }

            const page = global.__PAGE__;

            try {
                // Restore focus if needed or just type

                // Fill Form via DOM (safer for Datepickers)
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

                await new Promise(r => setTimeout(r, 500));

                const searchBtnSelector = 'input[type="submit"][value="Search"]';
                await page.waitForSelector(searchBtnSelector, { timeout: 5000 });

                const submissionPromise = Promise.all([
                    // Use evaluate to click, often more reliable than page.click()
                    page.evaluate((selector) => {
                        const btn = document.querySelector(selector) as HTMLElement;
                        if (btn) btn.click();
                    }, searchBtnSelector),

                    page.waitForFunction(
                        () => {
                            const text = document.body.innerText.toLowerCase();
                            return text.includes('registered person name') ||
                                text.includes('wrong captcha') ||
                                text.includes('no record found') ||
                                text.includes('does not match');
                        },
                        { timeout: 120000, polling: 1000 }
                    )
                ]);

                try {
                    await submissionPromise;
                } catch (timeoutError) {
                    // debug: capture what is on the screen
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    console.error('Timeout/Wait Error! Current Page Text (First 1000 chars):', bodyText.substring(0, 1000));

                    throw new Error('Server response timeout (120s). The government server is too slow or unresponsive.');
                }

                const content = (await page.content()).toLowerCase();

                // Error Checks (Case Insensitive)
                if (content.includes('wrong captcha')) {
                    throw new Error('Wrong Captcha Code. Please try again.');
                }
                if (content.includes('does not match') || content.includes('no record found')) {
                    throw new Error('No Record Found for this NID/DOB.');
                }
                if (!content.includes('registered person name')) {
                    throw new Error('Verification failed. Server response not recognized.');
                }

                // Generate PDF: Screenshot -> PDF Strategy (More Robust)
                // 1. Capture Screenshot as PNG
                // Use 'print' media type to get the official document look
                await page.emulateMediaType('print');
                // Use smaller viewport width so content appears larger (zoomed in) relative to the page
                await page.setViewport({ width: 1000, height: 1500, deviceScaleFactor: 2 });

                // --- STYLE MANIPULATION FOR PRINT LOOK ---
                await page.evaluate(() => {
                    // Force white background
                    document.body.style.backgroundColor = 'white';

                    // Inject CSS to maximize width and reduce margins
                    const style = document.createElement('style');
                    style.innerHTML = `
                        body { background-color: white !important; margin: 0 !important; padding: 10px !important; }
                        .container, .main-content, #main { 
                            width: 100% !important; 
                            max-width: none !important; 
                            margin: 0 !important; 
                            padding: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                        }
                        // Ensure table fits
                        table { width: 100% !important; }
                    `;
                    document.head.appendChild(style);

                    // Ensure specific container exists and is clean (fallback)
                    const mainContainer = document.querySelector('.container') || document.querySelector('.main-content') || document.body;
                    if (mainContainer instanceof HTMLElement) {
                        mainContainer.style.backgroundColor = 'white';
                    }
                });
                // -----------------------------------------

                const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png' });

                // 2. Create PDF using pdf-lib
                const { PDFDocument } = await import('pdf-lib');
                const pdfDoc = await PDFDocument.create();
                const pngImage = await pdfDoc.embedPng(screenshotBuffer);

                // Scale image to fit A4
                const pngDims = pngImage.scale(1);
                const pageA4 = pdfDoc.addPage([595.28, 841.89]); // Standard A4 points

                // Scale to fit width with margin
                const margin = 20;
                const availableWidth = pageA4.getWidth() - (margin * 2);
                const scaleFactor = availableWidth / pngDims.width;

                pageA4.drawImage(pngImage, {
                    x: margin,
                    y: pageA4.getHeight() - (pngDims.height * scaleFactor) - margin, // Top alignment
                    width: pngDims.width * scaleFactor,
                    height: pngDims.height * scaleFactor,
                });

                const pdfBytes = await pdfDoc.save();
                const pdfBuffer = Buffer.from(pdfBytes);

                // (Debug saving removed for production)


                const pdfBase64 = pdfBuffer.toString('base64');

                // Close page on success
                await page.close();

                return NextResponse.json({
                    success: true,
                    pdfBase64: pdfBase64
                });

            } catch (e: unknown) {
                // If verify fails, close page so user can try again cleanly
                if (global.__PAGE__ && !global.__PAGE__.isClosed()) {
                    await global.__PAGE__.close();
                }
                console.error('Verify Step Error:', e);
                const errorMessage = e instanceof Error ? e.message : 'Verification Failed';
                return NextResponse.json({ error: errorMessage }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: unknown) {
        console.error('API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
