import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

/**
 * Google Images Scraper for Kim Kardashian bar exam photos
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPED_DIR = path.join(__dirname, '../assets/scraped');

// Search queries
const SEARCH_QUERIES = [
    'Kim Kardashian bar exam',
    'Kim Kardashian lawyer',
    'Kim Kardashian studying law',
    'Kim Kardashian meme bar exam'
];

/**
 * Scrape Google Images
 */
export async function scrapeGoogleImages(query, maxResults = 5) {
    console.log(`🔍 Searching Google Images: "${query}"...`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    try {
        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&tbs=isz:l`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for images
        await page.waitForSelector('img', { timeout: 10000 });

        // Scroll to load more images
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(r => setTimeout(r, 1000));

        // Extract image URLs from data attributes and src
        const images = await page.evaluate(() => {
            const results = [];

            // Try multiple selector strategies
            const imgElements = document.querySelectorAll('img[src*="encrypted"], img[data-src*="encrypted"], img[src*="gstatic"]');

            for (const img of imgElements) {
                const src = img.getAttribute('data-src') || img.getAttribute('src') || '';

                // Skip tiny thumbnails and icons
                if (src.includes('encrypted-tbn') && src.length > 50) {
                    results.push({
                        url: src,
                        alt: img.alt || '',
                        width: img.naturalWidth || 200,
                        height: img.naturalHeight || 200
                    });
                }
            }

            // Also check for larger images in divs
            const divImages = document.querySelectorAll('[data-lpage] img, [jsname] img');
            for (const img of divImages) {
                const src = img.src || '';
                if (src.startsWith('http') && !src.includes('logo') && !results.find(r => r.url === src)) {
                    results.push({
                        url: src,
                        alt: img.alt || '',
                        width: img.naturalWidth || 400,
                        height: img.naturalHeight || 400
                    });
                }
            }

            return results;
        });

        await browser.close();

        console.log(`   Found ${images.length} images`);
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
 * Fetch a fresh Kim K image
 */
export async function fetchRecentKimImage() {
    console.log('📸 Fetching recent Kim Kardashian image...\n');

    if (!fs.existsSync(SCRAPED_DIR)) {
        fs.mkdirSync(SCRAPED_DIR, { recursive: true });
    }

    for (const query of SEARCH_QUERIES) {
        const images = await scrapeGoogleImages(query, 5);

        if (images.length === 0) continue;

        // Try to download each image until one works
        for (const img of images) {
            try {
                const timestamp = Date.now();
                const filename = `kim_${timestamp}.jpg`;
                const localPath = path.join(SCRAPED_DIR, filename);

                console.log(`   Downloading image...`);
                await downloadImage(img.url, localPath);

                // Verify file exists and has content
                const stats = fs.statSync(localPath);
                if (stats.size < 5000) {
                    fs.unlinkSync(localPath);
                    continue;
                }

                console.log(`   ✅ Saved: ${filename} (${stats.size} bytes)\n`);

                return {
                    id: filename,
                    path: localPath,
                    url: img.url,
                    description: img.alt || query,
                    width: img.width,
                    height: img.height,
                    isScraped: true,
                    isLowRes: false
                };

            } catch (error) {
                console.log(`   Download failed, trying next...`);
                continue;
            }
        }
    }

    throw new Error('No images could be fetched');
}

export default { scrapeGoogleImages, fetchRecentKimImage };
