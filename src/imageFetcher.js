import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Image Fetcher - High-resolution image selection with content safety filters
 * Follows X/Twitter 4K specs and avoids recently used images
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_MEMES_DIR = path.join(__dirname, '../assets/memes');

// Image selection criteria
const IMAGE_CRITERIA = {
    minWidth: 1920,
    preferredWidth: 3840,
    maxWidth: 4096,

    // Content safety - exclude revealing content
    excludeKeywords: [
        'bikini', 'swimsuit', 'lingerie', 'revealing',
        'beach', 'pool', 'cleavage', 'risky'
    ],

    // Prefer professional/study imagery
    preferKeywords: [
        'business attire', 'blazer', 'suit', 'studying',
        'law books', 'interview', 'professional', 'desk',
        'courtroom', 'formal', 'portrait', 'headshot'
    ],

    // Don't reuse within last N posts
    avoidRepeatsWithin: 10
};

/**
 * Select the best image from candidates
 * @param {Array} candidates - Array of image candidates with id, url, description, width, usedRecently
 * @param {Array} recentlyUsedIds - Image IDs used in recent posts
 * @returns {Object|null} Selected image or null
 */
export function selectBestImage(candidates, recentlyUsedIds = []) {
    if (!candidates || candidates.length === 0) {
        console.log('   No image candidates provided');
        return null;
    }

    console.log(`🖼️ Selecting from ${candidates.length} image candidates...\n`);

    // Filter and score candidates
    const scoredCandidates = candidates
        .map(img => ({
            ...img,
            score: scoreImage(img, recentlyUsedIds)
        }))
        .filter(img => img.score > 0) // Exclude disqualified images
        .sort((a, b) => b.score - a.score);

    if (scoredCandidates.length === 0) {
        console.log('   ⚠️ No suitable images after filtering');
        return null;
    }

    const selected = scoredCandidates[0];
    console.log(`   ✅ Selected: ${selected.id || selected.url?.slice(-30)}`);
    console.log(`   Score: ${selected.score}, Resolution: ${selected.width}x${selected.height || '?'}\n`);

    return selected;
}

/**
 * Score an image based on criteria
 * Returns 0 if image should be excluded
 */
function scoreImage(img, recentlyUsedIds) {
    let score = 100;
    const desc = (img.description || '').toLowerCase();
    const tags = (img.tags || []).map(t => t.toLowerCase());

    // Disqualify if recently used
    if (img.id && recentlyUsedIds.includes(img.id)) {
        console.log(`   ⏭️ Skipping ${img.id} (recently used)`);
        return 0;
    }

    // Disqualify if contains excluded keywords
    for (const keyword of IMAGE_CRITERIA.excludeKeywords) {
        if (desc.includes(keyword) || tags.some(t => t.includes(keyword))) {
            console.log(`   ⏭️ Skipping ${img.id} (contains "${keyword}")`);
            return 0;
        }
    }

    // Boost for preferred keywords
    for (const keyword of IMAGE_CRITERIA.preferKeywords) {
        if (desc.includes(keyword) || tags.some(t => t.includes(keyword))) {
            score += 20;
        }
    }

    // Boost for resolution
    const width = img.width || 0;
    if (width >= IMAGE_CRITERIA.preferredWidth) {
        score += 50; // 4K bonus
    } else if (width >= IMAGE_CRITERIA.minWidth) {
        score += 25; // HD bonus
    } else if (width > 0 && width < IMAGE_CRITERIA.minWidth) {
        score -= 30; // Penalty for low res
    }

    // Bonus for not being flagged as used
    if (!img.usedRecently) {
        score += 10;
    }

    return score;
}

/**
 * Get local meme images from assets/memes folder with dimensions
 */
export function getLocalMemes() {
    if (!fs.existsSync(LOCAL_MEMES_DIR)) {
        console.log('   assets/memes directory not found');
        return [];
    }

    const files = fs.readdirSync(LOCAL_MEMES_DIR)
        .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file));

    return files.map(file => {
        const filePath = path.join(LOCAL_MEMES_DIR, file);
        const dimensions = getImageDimensions(filePath);
        return {
            id: file,
            path: filePath,
            description: file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            isLocal: true,
            width: dimensions.width,
            height: dimensions.height,
            isLowRes: isLowRes(dimensions.width, dimensions.height)
        };
    });
}

/**
 * Get image dimensions from file (basic PNG/JPEG header reading)
 */
export function getImageDimensions(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);

        // PNG: width at bytes 16-19, height at 20-23
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            return { width, height };
        }

        // JPEG: search for SOF0/SOF2 marker
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
            let i = 2;
            while (i < buffer.length - 8) {
                if (buffer[i] === 0xFF) {
                    const marker = buffer[i + 1];
                    // SOF0 (0xC0) or SOF2 (0xC2)
                    if (marker === 0xC0 || marker === 0xC2) {
                        const height = buffer.readUInt16BE(i + 5);
                        const width = buffer.readUInt16BE(i + 7);
                        return { width, height };
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

/**
 * Check if image is low resolution
 */
export function isLowRes(width, height, minShortSide = 600) {
    const shortSide = Math.min(width || 0, height || 0);
    return shortSide < minShortSide;
}

/**
 * Select a random local meme that hasn't been used recently
 */
export function selectLocalMeme(recentlyUsedIds = []) {
    const memes = getLocalMemes();

    if (memes.length === 0) {
        return null;
    }

    // Filter out recently used
    const available = memes.filter(m => !recentlyUsedIds.includes(m.id));

    if (available.length === 0) {
        // If all used, just pick random
        console.log('   All memes recently used, picking random');
        return memes[Math.floor(Math.random() * memes.length)];
    }

    // Pick random from available
    return available[Math.floor(Math.random() * available.length)];
}

/**
 * Analyze image description for visual anchors
 * These are elements to reference in the caption
 */
export function extractVisualAnchors(imageDescription) {
    if (!imageDescription) return [];

    const desc = imageDescription.toLowerCase();
    const anchors = [];

    // Look for specific elements
    const elements = [
        { pattern: /white\s+blazer/i, anchor: 'white blazer' },
        { pattern: /law\s+books?/i, anchor: 'law books' },
        { pattern: /studying|desk/i, anchor: 'studying' },
        { pattern: /quote\s+card/i, anchor: 'quote card' },
        { pattern: /meme/i, anchor: 'meme' },
        { pattern: /crying|tears/i, anchor: 'crying' },
        { pattern: /screenshot/i, anchor: 'screenshot' },
        { pattern: /results?\s+page/i, anchor: 'results page' },
        { pattern: /refresh/i, anchor: 'refresh button' },
        { pattern: /mental\s+breakdown/i, anchor: 'mental breakdown' },
        { pattern: /psychic/i, anchor: 'psychic' },
        { pattern: /"([^"]+)"/i, anchor: 'quote text' },
        { pattern: /courtroom/i, anchor: 'courtroom' },
        { pattern: /red\s+carpet/i, anchor: 'red carpet' },
        { pattern: /interview/i, anchor: 'interview setting' }
    ];

    for (const { pattern, anchor } of elements) {
        if (pattern.test(desc)) {
            anchors.push(anchor);
        }
    }

    // Extract quoted text if present
    const quoteMatch = imageDescription.match(/"([^"]+)"/);
    if (quoteMatch) {
        anchors.push(`"${quoteMatch[1]}"`);
    }

    return anchors.slice(0, 2); // Max 2 anchors
}

export default {
    selectBestImage,
    selectLocalMeme,
    getLocalMemes,
    extractVisualAnchors,
    IMAGE_CRITERIA
};
