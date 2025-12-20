#!/usr/bin/env node

import 'dotenv/config';

console.log('🏥 Running health check...\n');

const checks = {
  'TWITTER_API_KEY': !!process.env.TWITTER_API_KEY,
  'TWITTER_API_SECRET': !!process.env.TWITTER_API_SECRET,
  'TWITTER_ACCESS_TOKEN': !!process.env.TWITTER_ACCESS_TOKEN,
  'TWITTER_ACCESS_TOKEN_SECRET': !!process.env.TWITTER_ACCESS_TOKEN_SECRET,
  'CLAUDE_API_KEY': !!process.env.CLAUDE_API_KEY
};

let allPassed = true;

console.log('Environment Variables:\n');
for (const [key, passed] of Object.entries(checks)) {
  console.log(`  ${passed ? '✅' : '❌'} ${key}`);
  if (!passed) allPassed = false;
}

console.log('\nConfiguration:\n');
console.log(`  DRY_RUN: ${process.env.DRY_RUN || 'false'}`);
console.log(`  TIMEZONE: ${process.env.TIMEZONE || 'America/Los_Angeles'}`);

if (allPassed) {
  console.log('\n✅ All health checks passed!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please check your .env file.\n');
  process.exit(1);
}
