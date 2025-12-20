#!/usr/bin/env node

/**
 * BarWatch - Bar Exam Tracker Bot
 * Main orchestrator that coordinates scraping, analysis, and tweeting
 */

import 'dotenv/config';
import { scrapeAllSources } from './scraper.js';
import { analyzeBarExamStatus, getCountdownMessage } from './analyzer.js';
import { initTwitter, postTweet } from './twitter.js';

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

    // Step 3: Analyze with Claude AI
    console.log('🧠 Step 3: Analyze with Claude AI\n');
    let analysis;

    if (scrapeResults.allHeadlines.length > 0) {
      analysis = await analyzeBarExamStatus(scrapeResults.allHeadlines);
    } else {
      // No headlines found, use countdown message
      console.log('⚠️  No headlines found, using countdown message\n');
      analysis = {
        status: 'NO_NEWS',
        shouldTweet: true,
        message: getCountdownMessage(),
        confidence: 1.0
      };
    }

    // Step 4: Post tweet if needed
    console.log('📤 Step 4: Post Tweet\n');

    if (analysis.shouldTweet && analysis.message) {
      const tweetResult = await postTweet(analysis.message);

      // Log results
      console.log('📊 RESULTS\n');
      console.log('─'.repeat(60));
      console.log(`Status: ${analysis.status}`);
      console.log(`Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      console.log(`Tweet Posted: ${tweetResult.success ? 'YES' : 'NO'}`);
      if (tweetResult.tweetId) {
        console.log(`Tweet ID: ${tweetResult.tweetId}`);
      }
      console.log('─'.repeat(60));

      // Exit with success
      console.log('\n✅ BarWatch completed successfully!\n');
      process.exit(0);

    } else {
      console.log('ℹ️  No significant news - skipping tweet\n');
      console.log('📊 RESULTS\n');
      console.log('─'.repeat(60));
      console.log(`Status: ${analysis.status}`);
      console.log(`Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      console.log(`Tweet Posted: NO (not significant enough)`);
      console.log('─'.repeat(60));

      console.log('\n✅ BarWatch completed (no tweet needed)\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);

    // Try to post an error tweet (only if not in dry run)
    if (process.env.DRY_RUN !== 'true') {
      try {
        await postTweet(
          '⚠️ BarWatch bot encountered an issue. Working on a fix!\n#BarWatch #Status'
        );
      } catch (tweetError) {
        console.error('❌ Could not post error tweet:', tweetError.message);
      }
    }

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
  TWITTER_API_SECRET         Twitter API secret
  TWITTER_ACCESS_TOKEN       Twitter access token
  TWITTER_ACCESS_TOKEN_SECRET Twitter access token secret
  CLAUDE_API_KEY             Claude API key
  DRY_RUN                    Set to 'true' for dry run mode
  TIMEZONE                   Timezone for logging (default: America/Los_Angeles)

Examples:
  npm start                  Run the bot normally
  npm start -- --dry-run     Test without posting tweets
  DRY_RUN=true npm start     Test using environment variable

For more information, see README.md
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('BarWatch v1.0.0');
  process.exit(0);
}

if (args.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

// Run the bot
runBarWatch();
