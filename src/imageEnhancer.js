import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Replicate from 'replicate';
import https from 'https';
import http from 'http';

/**
 * Image Enhancer - Upscale and smooth images via Replicate Real-ESRGAN
 * Enhances scraped images without creating entirely new ones
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENHANCED_DIR = path.join(__dirname, '../assets/enhanced');

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
});

/**
 * Enhance an image using Real-ESRGAN upscaling
 * @param {string} inputPath - Path to the source image
 * @param {Object} options - Enhancement options
 * @returns {Object} Enhanced image details { path, width, height, enhanced: true }
 */
export async function enhanceImage(inputPath, options = {}) {
    const {
        scale = 4,
        faceEnhance = true
    } = options;

    console.log('🔧 Enhancing image via Replicate Real-ESRGAN...\n');

    if (!fs.existsSync(ENHANCED_DIR)) {
        fs.mkdirSync(ENHANCED_DIR, { recursive: true });
    }

    if (!fs.existsSync(inputPath)) {
        throw new Error(`Source image not found: ${inputPath}`);
    }

    try {
        const imageBuffer = fs.readFileSync(inputPath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = inputPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        console.log(`   Source: ${path.basename(inputPath)}`);
        console.log(`   Scale: ${scale}x`);
        console.log(`   Face enhance: ${faceEnhance}`);

        const output = await replicate.run(
            "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
            {
                input: {
                    image: dataUri,
                    scale: scale,
                    face_enhance: faceEnhance
                }
            }
        );

        if (!output) {
            throw new Error('No output returned from Real-ESRGAN');
        }

        const outputUrl = typeof output === 'string' ? output : output[0];
        console.log(`   Enhanced URL: ${outputUrl.slice(0, 50)}...`);

        const timestamp = Date.now();
        const ext = path.extname(inputPath) || '.png';
        const filename = `enhanced_${timestamp}${ext}`;
        const localPath = path.join(ENHANCED_DIR, filename);

        await downloadImage(outputUrl, localPath);

        const stats = fs.statSync(localPath);
        const dimensions = getImageDimensions(localPath);

        console.log(`   ✅ Saved: ${filename}`);
        console.log(`   Size: ${Math.round(stats.size / 1024)}KB`);
        console.log(`   Resolution: ${dimensions.width}x${dimensions.height}\n`);

        return {
            id: filename,
            path: localPath,
            originalPath: inputPath,
            width: dimensions.width,
            height: dimensions.height,
            size: stats.size,
            enhanced: true,
            isLowRes: false
        };

    } catch (error) {
        console.error(`   ❌ Enhancement failed: ${error.message}`);
        throw error;
    }
}

/**
 * Smooth and refine an image (lighter enhancement)
 * Uses GFPGAN for face restoration without aggressive upscaling
 */
export async function smoothImage(inputPath) {
    console.log('✨ Smoothing image via GFPGAN...\n');

    if (!fs.existsSync(ENHANCED_DIR)) {
        fs.mkdirSync(ENHANCED_DIR, { recursive: true });
    }

    try {
        const imageBuffer = fs.readFileSync(inputPath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = inputPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        const output = await replicate.run(
            "tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c",
            {
                input: {
                    img: dataUri,
                    version: "v1.4",
                    scale: 2
                }
            }
        );

        if (!output) {
            throw new Error('No output returned from GFPGAN');
        }

        const outputUrl = typeof output === 'string' ? output : output[0];

        const timestamp = Date.now();
        const filename = `smoothed_${timestamp}.png`;
        const localPath = path.join(ENHANCED_DIR, filename);

        await downloadImage(outputUrl, localPath);

        const dimensions = getImageDimensions(localPath);

        console.log(`   ✅ Smoothed: ${filename} (${dimensions.width}x${dimensions.height})\n`);

        return {
            id: filename,
            path: localPath,
            originalPath: inputPath,
            width: dimensions.width,
            height: dimensions.height,
            smoothed: true,
            enhanced: true,
            isLowRes: false
        };

    } catch (error) {
        console.error(`   ❌ Smoothing failed: ${error.message}`);
        throw error;
    }
}

/**
 * Full enhancement pipeline: upscale + smooth
 */
export async function enhanceAndSmooth(inputPath, options = {}) {
    const { skipSmooth = false, scale = 2 } = options;

    console.log('🎨 Running full enhancement pipeline...\n');

    const upscaled = await enhanceImage(inputPath, { scale, faceEnhance: true });

    if (skipSmooth) {
        return upscaled;
    }

    try {
        const smoothed = await smoothImage(upscaled.path);
        return {
            ...smoothed,
            originalPath: inputPath,
            pipeline: 'upscale+smooth'
        };
    } catch {
        console.log('   Smoothing failed, returning upscaled version');
        return upscaled;
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
                try { fs.unlinkSync(destPath); } catch { }
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
 * Get image dimensions from file
 */
function getImageDimensions(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);

        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
        }

        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
            let i = 2;
            while (i < buffer.length - 8) {
                if (buffer[i] === 0xFF) {
                    const marker = buffer[i + 1];
                    if (marker === 0xC0 || marker === 0xC2) {
                        return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) };
                    }
                    const len = buffer.readUInt16BE(i + 2);
                    i += 2 + len;
                } else {
                    i++;
                }
            }
        }

        return { width: 0, height: 0 };
    } catch {
        return { width: 0, height: 0 };
    }
}

export default {
    enhanceImage,
    smoothImage,
    enhanceAndSmooth,
    ENHANCED_DIR
};
