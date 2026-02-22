#!/usr/bin/env node

/**
 * BarWatch - Bar Exam Tracker Bot v3.1
 * Orchestrator: Search → Caption → Compose Image → Upload → Post
 * TMZ-style image overlays on curated Kim K photos.
 */

import 'dotenv/config';

import { searchForNews } from './webSearcher.js';
import { generateCaption } from './captionGenerator.js';
import { getCurrentPhase, getDaysUntilExam } from './tweetBank.js';
import { initTwitter, postTweet, uploadMedia } from './twitter.js';
import { composeForTweet } from './imageComposer.js';

async function runBarWatch() {
  const now = new Date();
  const phase = getCurrentPhase(now);
  const days = getDaysUntilExam(now);

  console.log('🎯 BarWatch Bot v3.1 Starting...');
  console.log('═'.repeat(60));
  console.log(`📅 Time: ${now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
  console.log(`📍 Phase: ${phase}`);
  console.log(`📆 Days to exam: ${days}`);
  console.log(`🧪 Dry Run: ${process.env.DRY_RUN === 'true' ? 'YES' : 'NO'}`);
  console.log('═'.repeat(60));
  console.log('');

  try {
    // Step 1: Initialize Twitter
    console.log('📱 Step 1: Initialize Twitter\n');
    initTwitter();

    // Step 2: Search for news (check for PASS/FAIL breaking news)
    console.log('🔍 Step 2: Search for Bar Exam News\n');
    let scrapedItems = [];
    let hasNewUpdate = false;

    try {
      const searchResults = await searchForNews();
      scrapedItems = searchResults.scrapedItems;
      hasNewUpdate = searchResults.hasNewUpdate;
      console.log(`   News items: ${scrapedItems.length}`);
      console.log(`   New update: ${hasNewUpdate ? 'YES' : 'NO'}\n`);
    } catch (searchError) {
      console.warn(`   ⚠️ Search failed: ${searchError.message}`);
      console.log('   Continuing with tweet bank content...\n');
    }

    // Step 3: Generate caption from tweet bank
    console.log('✍️ Step 3: Generate Caption\n');
    const captionResult = await generateCaption({ scrapedItems, hasNewUpdate });
    const caption = captionResult.caption;

    console.log(`   Phase: ${captionResult.phase}`);
    console.log(`   Length: ${captionResult.charCount} chars`);
    console.log(`   Tweet: ${caption}\n`);

    // Step 4: Compose TMZ-style image
    console.log('🎨 Step 4: Compose Image\n');
    let composedPath = null;
    let mediaId = null;

    try {
      const composed = await composeForTweet(caption);
      composedPath = composed.composedPath;
      console.log(`   Source: ${composed.sourceFile}`);
      console.log(`   Output: ${composedPath}\n`);
    } catch (imgError) {
      console.warn(`   ⚠️ Image compose failed: ${imgError.message}`);
      console.log('   Posting text-only tweet...\n');
    }

    // Step 5: Upload media (if we have an image)
    if (composedPath) {
      console.log('📤 Step 5: Upload Media\n');
      mediaId = await uploadMedia(composedPath);
      if (mediaId) {
        console.log(`   Media ID: ${mediaId}\n`);
      } else {
        console.log('   ⚠️ Upload failed, posting text-only\n');
      }
    }

    // Step 6: Post the tweet
    console.log('📤 Step 6: Post Tweet\n');
    const tweetResult = await postTweet(caption, mediaId);

    // Results
    console.log('\n📊 RESULTS\n');
    console.log('─'.repeat(60));
    console.log(`Phase: ${captionResult.phase}`);
    console.log(`Days to exam: ${days}`);
    console.log(`Caption: ${caption.length} chars`);
    console.log(`Image: ${composedPath ? 'YES 🖼️' : 'NO (text-only)'}`);
    console.log(`Posted: ${tweetResult.success ? 'YES ✅' : 'NO ❌'}`);
    if (tweetResult.tweetId) console.log(`Tweet ID: ${tweetResult.tweetId}`);
    console.log('─'.repeat(60));

    console.log('\n✅ BarWatch v3.1 completed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
BarWatch - Bar Exam Tracker Bot v3.1

Usage: npm start [options]

Options:
  --help, -h       Show this help message
  --dry-run        Run without posting tweets
  --version, -v    Show version

Phases: countdown → exam_week → exam_day → results_pending → passed/failed
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('BarWatch v3.1.0');
  process.exit(0);
}

if (args.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

runBarWatch();
