import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Image Composer - TMZ-style text overlay on curated images
 * Produces Twitter-optimized images (1200x675) with bold caption banners.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMES_DIR = path.join(__dirname, '../assets/memes');
const OUTPUT_DIR = path.join(__dirname, '../assets/composed');

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

const TWITTER_WIDTH = 1200;
const TWITTER_HEIGHT = 675;

const ACCENT_COLORS = [
  '#FFD700', // TMZ gold
  '#FF3B30', // breaking red
  '#FF9500', // alert orange
  '#FFFFFF', // clean white
];

/**
 * Pick a random curated image from assets/memes, avoiding recent picks
 */
export function pickImage(recentlyUsed = []) {
  const files = fs.readdirSync(MEMES_DIR)
    .filter(f => SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .filter(f => !f.startsWith('.'));

  if (files.length === 0) {
    throw new Error('No images found in assets/memes/');
  }

  const available = files.filter(f => !recentlyUsed.includes(f));
  const pool = available.length > 0 ? available : files;

  return path.join(MEMES_DIR, pool[Math.floor(Math.random() * pool.length)]);
}

/**
 * Word-wrap text to fit within a max character width
 */
function wrapText(text, maxCharsPerLine = 35) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current.trim());

  return lines;
}

/**
 * Build an SVG text overlay with TMZ-style banner
 */
function buildOverlaySvg(captionText, width, height) {
  const accentColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
  const lines = wrapText(captionText.toUpperCase(), 38);
  const lineHeight = 38;
  const padding = 24;
  const accentBarHeight = 5;
  const bannerHeight = (lines.length * lineHeight) + (padding * 2) + accentBarHeight;
  const bannerY = height - bannerHeight;

  const textElements = lines.map((line, i) => {
    const y = bannerY + accentBarHeight + padding + (i * lineHeight) + 28;
    // Shadow + main text for readability
    return `
      <text x="${padding + 2}" y="${y + 2}" font-family="Arial Black, Impact, Helvetica, sans-serif" font-size="32" font-weight="900" fill="rgba(0,0,0,0.7)" letter-spacing="1">${escapeXml(line)}</text>
      <text x="${padding}" y="${y}" font-family="Arial Black, Impact, Helvetica, sans-serif" font-size="32" font-weight="900" fill="white" letter-spacing="1">${escapeXml(line)}</text>
    `;
  }).join('');

  // Badge
  const badgeWidth = 130;
  const badgeHeight = 26;
  const badgeX = width - badgeWidth - 16;
  const badgeY = bannerY - badgeHeight - 10;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient scrim over bottom portion -->
      <defs>
        <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.85)" />
        </linearGradient>
      </defs>
      <rect x="0" y="${bannerY - 60}" width="${width}" height="${bannerHeight + 60}" fill="url(#scrim)" />

      <!-- Accent bar -->
      <rect x="0" y="${bannerY}" width="${width}" height="${accentBarHeight}" fill="${accentColor}" />

      <!-- Caption text -->
      ${textElements}

      <!-- BARWATCH badge -->
      <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="4" fill="${accentColor}" />
      <text x="${badgeX + 10}" y="${badgeY + 19}" font-family="Arial Black, Helvetica, sans-serif" font-size="15" font-weight="900" fill="black" letter-spacing="2">BARWATCH</text>
    </svg>
  `;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Compose a TMZ-style image: source photo + bold text overlay
 * @param {string} imagePath - Path to the source image
 * @param {string} captionText - Text to overlay (the tweet body, minus hashtags)
 * @returns {string} Path to the composed output image (PNG)
 */
export async function composeImage(imagePath, captionText) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`🎨 Composing TMZ-style image...`);
  console.log(`   Source: ${path.basename(imagePath)}`);

  // Strip hashtags from the overlay text
  const cleanCaption = captionText.replace(/#\w+/g, '').trim();

  // Resize source image to Twitter dimensions, cover-crop
  const resized = await sharp(imagePath)
    .resize(TWITTER_WIDTH, TWITTER_HEIGHT, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer();

  // Build SVG overlay
  const overlaySvg = buildOverlaySvg(cleanCaption, TWITTER_WIDTH, TWITTER_HEIGHT);

  // Composite overlay onto image
  const timestamp = Date.now();
  const outputFilename = `composed_${timestamp}.png`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  await sharp(resized)
    .composite([{
      input: Buffer.from(overlaySvg),
      top: 0,
      left: 0,
    }])
    .png({ quality: 95 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`   ✅ Composed: ${outputFilename} (${Math.round(stats.size / 1024)}KB)`);

  return outputPath;
}

/**
 * Full pipeline: pick image → compose with caption → return path
 * @param {string} captionText - The tweet text
 * @param {Array} recentlyUsed - Filenames to avoid reusing
 * @returns {{ composedPath: string, sourceFile: string }}
 */
export async function composeForTweet(captionText, recentlyUsed = []) {
  const imagePath = pickImage(recentlyUsed);
  const sourceFile = path.basename(imagePath);

  console.log(`   📸 Selected: ${sourceFile}`);

  const composedPath = await composeImage(imagePath, captionText);

  return { composedPath, sourceFile };
}
