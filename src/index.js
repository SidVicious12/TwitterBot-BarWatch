#!/usr/bin/env node

/**
 * BarWatch - Bar Exam Tracker Bot v3.0
 * Simplified orchestrator: Search → Caption → Post (text-only)
 * No more broken image pipeline. Pre-written bangers from tweet bank.
 */

import 'dotenv/config';

import { searchForNews } from './webSearcher.js';
import { generateCaption } from './captionGenerator.js';
import { getCurrentPhase, getDaysUntilExam } from './tweetBank.js';
import { initTwitter, postTweet } from './twitter.js';

async function runBarWatch() {
  const now = new Date();
  const phase = getCurrentPhase(now);
  const days = getDaysUntilExam(now);

  console.log('🎯 BarWatch Bot v3.0 Starting...');
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

    // Step 4: Post the tweet (text-only — no more broken image pipeline)
    console.log('📤 Step 4: Post Tweet\n');
    const tweetResult = await postTweet(caption);

    // Results
    console.log('\n📊 RESULTS\n');
    console.log('─'.repeat(60));
    console.log(`Phase: ${captionResult.phase}`);
    console.log(`Days to exam: ${days}`);
    console.log(`Caption: ${caption.length} chars`);
    console.log(`Posted: ${tweetResult.success ? 'YES ✅' : 'NO ❌'}`);
    if (tweetResult.tweetId) console.log(`Tweet ID: ${tweetResult.tweetId}`);
    console.log('─'.repeat(60));

    console.log('\n✅ BarWatch v3 completed!\n');
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
BarWatch - Bar Exam Tracker Bot v3.0

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
  console.log('BarWatch v3.0.0');
  process.exit(0);
}

if (args.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

runBarWatch();
