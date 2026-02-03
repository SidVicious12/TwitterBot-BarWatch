import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { enhanceImage } from './imageEnhancer.js';

/**
 * Google Images Scraper for Kim Kardashian bar exam photos
 * Enhanced: Attempts to get full-res images + Replicate enhancement
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPED_DIR = path.join(__dirname, '../assets/scraped');

// Search queries - prioritize bar exam content
const SEARCH_QUERIES = [
    'Kim Kardashian bar exam quote',
    'Kim Kardashian bar exam interview',
    'Kim Kardashian lawyer studying',
    'Kim Kardashian law school'
];

/**
 * Scrape Google Images - attempts to get full-resolution URLs
 */
export async function scrapeGoogleImages(query, maxResults = 5) {
    console.log(`🔍 Searching Google Images: "${query}"...`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    try {
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Request large images only
        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&tbs=isz:l,iar:s`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        await page.waitForSelector('img', { timeout: 10000 });

        // Scroll and wait for lazy loading
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 1500));

        // Click on first few images to get full-res URLs
        const images = await page.evaluate(() => {
            const results = [];

            // Strategy 1: Get data-src URLs (often higher quality)
            const imgElements = document.querySelectorAll('img[data-src], img[src*="encrypted"]');
            for (const img of imgElements) {
                const dataSrc = img.getAttribute('data-src');
                const src = dataSrc || img.getAttribute('src') || '';

                if (src && src.length > 50 && !src.includes('logo')) {
                    results.push({
                        url: src,
                        alt: img.alt || '',
                        width: img.naturalWidth || 400,
                        height: img.naturalHeight || 400,
                        isThumbnail: src.includes('encrypted-tbn')
                    });
                }
            }

            // Strategy 2: Look for full-size image URLs in page data
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const text = script.textContent || '';
                const urlMatches = text.match(/https:\/\/[^"\s]+\.(?:jpg|jpeg|png|webp)/gi);
                if (urlMatches) {
                    for (const url of urlMatches) {
                        if (!url.includes('encrypted-tbn') && !url.includes('gstatic') && !results.find(r => r.url === url)) {
                            results.push({
                                url: url,
                                alt: '',
                                width: 800,
                                height: 800,
                                isThumbnail: false
                            });
                        }
                    }
                }
            }

            // Sort: prefer non-thumbnails
            results.sort((a, b) => (a.isThumbnail ? 1 : 0) - (b.isThumbnail ? 1 : 0));

            return results;
        });

        await browser.close();

        console.log(`   Found ${images.length} images (${images.filter(i => !i.isThumbnail).length} full-res)`);
        return images.slice(0, maxResults);

    } catch (error) {
        await browser.close();
        console.error(`   Error: ${error.message}`);
        return [];
    }
}

/**
 * Download image from URL
 */
function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(destPath);
                return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(destPath); } catch { }
                return reject(new Error(`HTTP ${response.statusCode}`));
            }

            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            file.close();
            try { fs.unlinkSync(destPath); } catch { }
            reject(err);
        });
    });
}

/**
 * Fetch a fresh Kim K image with optional enhancement
 * @param {Object} options - { enhance: boolean, scale: number }
 */
export async function fetchRecentKimImage(options = {}) {
    const { enhance = true, scale = 2 } = options;

    console.log('📸 Fetching recent Kim Kardashian image...\n');

    if (!fs.existsSync(SCRAPED_DIR)) {
        fs.mkdirSync(SCRAPED_DIR, { recursive: true });
    }

    for (const query of SEARCH_QUERIES) {
        const images = await scrapeGoogleImages(query, 5);

        if (images.length === 0) continue;

        for (const img of images) {
            try {
                const timestamp = Date.now();
                const ext = img.url.includes('.png') ? 'png' : 'jpg';
                const filename = `kim_${timestamp}.${ext}`;
                const localPath = path.join(SCRAPED_DIR, filename);

                console.log(`   Downloading: ${img.isThumbnail ? 'thumbnail' : 'full-res'}...`);
                await downloadImage(img.url, localPath);

                const stats = fs.statSync(localPath);
                if (stats.size < 3000) {
                    fs.unlinkSync(localPath);
                    continue;
                }

                console.log(`   ✅ Downloaded: ${filename} (${Math.round(stats.size / 1024)}KB)`);

                // Enhance if enabled and image is small/thumbnail
                const needsEnhancement = enhance && (img.isThumbnail || stats.size < 50000);

                if (needsEnhancement && process.env.REPLICATE_API_TOKEN) {
                    console.log('   Image needs enhancement, upscaling...\n');
                    try {
                        const enhanced = await enhanceImage(localPath, { scale, faceEnhance: true });
                        return {
                            ...enhanced,
                            description: img.alt || query,
                            originalUrl: img.url,
                            isScraped: true,
                            wasEnhanced: true
                        };
                    } catch (enhanceError) {
                        console.log(`   Enhancement failed: ${enhanceError.message}`);
                        console.log('   Using original image...\n');
                    }
                }

                return {
                    id: filename,
                    path: localPath,
                    url: img.url,
                    description: img.alt || query,
                    width: img.width,
                    height: img.height,
                    isScraped: true,
                    isLowRes: img.isThumbnail,
                    wasEnhanced: false
                };

            } catch (error) {
                console.log(`   Download failed: ${error.message}, trying next...`);
                continue;
            }
        }
    }

    throw new Error('No images could be fetched');
}

export default { scrapeGoogleImages, fetchRecentKimImage };
