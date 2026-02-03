#!/usr/bin/env node

/**
 * BarWatch - Bar Exam Tracker Bot v2.0
 * Refactored orchestrator: Search → Image → Caption → Post
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// New modules
import { searchForNews } from './webSearcher.js';
import { generateCaption } from './captionGenerator.js';
import { getImageForTweet, extractVisualAnchors } from './imageFetcher.js';
import { loadMemory } from './memoryStore.js';

// Twitter integration
import { initTwitter, postTweet, uploadMedia } from './twitter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Main bot execution
 */
async function runBarWatch() {
  console.log('🎯 BarWatch Bot v2.0 Starting...');
  console.log('═'.repeat(60));
  console.log(`📅 Time: ${new Date().toLocaleString()}`);
  console.log(`🌍 Timezone: ${process.env.TIMEZONE || 'America/Los_Angeles'}`);
  console.log(`🧪 Dry Run: ${process.env.DRY_RUN === 'true' ? 'YES' : 'NO'}`);
  console.log('═'.repeat(60));
  console.log('');

  try {
    // Step 1: Initialize Twitter
    console.log('📱 Step 1: Initialize Twitter\n');
    initTwitter();

    // Step 2: Search for news (autonomous web search)
    console.log('🔍 Step 2: Search for Bar Exam News\n');
    const searchResults = await searchForNews();

    const { scrapedItems, hasNewUpdate } = searchResults;
    console.log(`   New update detected: ${hasNewUpdate ? 'YES' : 'NO'}\n`);

    // Step 3: Select image
    console.log('🖼️ Step 3: Select Image\n');
    const memory = loadMemory();
    const selectedImage = await getImageForTweet(memory.usedImages || []);

    let imageDescription = '';
    let imagePath = null;
    let isLowResImage = false;

    if (selectedImage) {
      imagePath = selectedImage.path;
      imageDescription = selectedImage.description || '';
      isLowResImage = selectedImage.isLowRes || false;

      console.log(`   Selected: ${selectedImage.id}`);
      console.log(`   Resolution: ${selectedImage.width}x${selectedImage.height}`);
      console.log(`   Low-res: ${isLowResImage ? 'YES ⚠️' : 'NO'}`);
      console.log(`   Description: ${imageDescription || 'none'}\n`);
    } else {
      console.log('   No image selected (will post text only)\n');
    }

    // Step 4: Generate caption
    console.log('✍️ Step 4: Generate Caption\n');
    const captionResult = await generateCaption({
      imageDescription,
      scrapedItems,
      hasNewUpdate,
      isLowResImage
    });

    if (!captionResult.success) {
      console.warn('   ⚠️ Using fallback caption');
    }

    const caption = captionResult.caption;
    console.log(`   Final: ${caption}\n`);

    // Step 5: Upload media if we have an image
    console.log('📤 Step 5: Post Tweet\n');
    let mediaId = null;

    if (imagePath && fs.existsSync(imagePath)) {
      console.log(`   Uploading image: ${path.basename(imagePath)}...`);
      mediaId = await uploadMedia(imagePath);
    }

    // Step 6: Post the tweet
    const tweetResult = await postTweet(caption, mediaId);

    // Log results
    console.log('\n📊 RESULTS\n');
    console.log('─'.repeat(60));
    console.log(`News Found: ${scrapedItems.length} facts`);
    console.log(`New Update: ${hasNewUpdate ? 'YES' : 'NO'}`);
    console.log(`Caption Length: ${caption.length} chars`);
    console.log(`Tweet Posted: ${tweetResult.success ? 'YES' : 'NO'}`);
    if (tweetResult.tweetId) {
      console.log(`Tweet ID: ${tweetResult.tweetId}`);
    }
    console.log('─'.repeat(60));

    console.log('\n✅ BarWatch completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
BarWatch - Bar Exam Tracker Bot v2.0

Usage: npm start [options]

Options:
  --help, -h       Show this help message
  --dry-run        Run without posting tweets
  --version, -v    Show version

Features:
  - Autonomous news search (Google News RSS)
  - Tiered trusted sources (calbar.ca.gov, People, TMZ, etc.)
  - AI-generated snarky captions (Replicate)
  - Anti-repetition memory system
  - High-res image selection with safety filters
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('BarWatch v2.0.0');
  process.exit(0);
}

if (args.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

// Run the bot
runBarWatch();
