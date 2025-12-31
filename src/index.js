#!/usr/bin/env node

/**
 * BarWatch - Bar Exam Tracker Bot
 * Main orchestrator that coordinates scraping, analysis, and tweeting
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeAllSources } from './scraper.js';
import { analyzeBarExamStatus } from './analyzer.js';
import { initTwitter, postTweet, uploadMedia } from './twitter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMES_DIR = path.join(__dirname, '../assets/memes');

/**
 * Main bot execution
 */
async function runBarWatch() {
  console.log('🎯 BarWatch Bot Starting...');
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

    // Step 2: Scrape news sources
    console.log('📰 Step 2: Scrape News Sources\n');
    const scrapeResults = await scrapeAllSources();

    // Step 3: Analyze with Replicate AI
    console.log('🧠 Step 3: Analyze with Replicate AI\n');

    // We pass whatever headlines we found (or empty) to the analyzer
    // It will handle the "No News" case dynamically
    const analysis = await analyzeBarExamStatus(scrapeResults.allHeadlines);

    // Step 4: Prepare Media (if needed)
    console.log('🖼️ Step 4: Select Media\n');
    let mediaId = null;

    if (analysis.shouldTweet) {
      // Pick a random meme/image if we are tweeting
      if (fs.existsSync(MEMES_DIR)) {
        const files = fs.readdirSync(MEMES_DIR).filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file));
        if (files.length > 0) {
          const randomFile = files[Math.floor(Math.random() * files.length)];
          const filePath = path.join(MEMES_DIR, randomFile);

          console.log(`   Selected image: ${randomFile}`);
          mediaId = await uploadMedia(filePath);
        } else {
          console.log('   No images found in assets/memes');
        }
      } else {
        console.log('   assets/memes directory does not exist');
      }
    }

    // Step 5: Post tweet if needed
    console.log('📤 Step 5: Post Tweet\n');

    if (analysis.shouldTweet && analysis.message) {
      const tweetResult = await postTweet(analysis.message, mediaId);

      // Log results
      console.log('📊 RESULTS\n');
      console.log('─'.repeat(60));
      console.log(`Status: ${analysis.status}`);
      console.log(`Tweet Posted: ${tweetResult.success ? 'YES' : 'NO'}`);
      if (tweetResult.tweetId) {
        console.log(`Tweet ID: ${tweetResult.tweetId}`);
      }
      console.log('─'.repeat(60));

      // Exit with success
      console.log('\n✅ BarWatch completed successfully!\n');
      process.exit(0);

    } else {
      console.log('ℹ️  Skipping tweet (shouldTweet = false)\n');
      process.exit(0);
    }

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
BarWatch - Bar Exam Tracker Bot

Usage: npm start [options]

Options:
  --help, -h       Show this help message
  --dry-run        Run without posting tweets
  --version, -v    Show version

Environment Variables:
  TWITTER_API_KEY            Twitter API key
  ... (others) ...
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('BarWatch v1.1.0');
  process.exit(0);
}

if (args.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

// Run the bot
runBarWatch();
