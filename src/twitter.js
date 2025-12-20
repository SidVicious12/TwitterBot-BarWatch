import { TwitterApi } from 'twitter-api-v2';

/**
 * Twitter/X API integration
 * Posts tweets about bar exam status
 */

let twitterClient = null;

/**
 * Initialize Twitter client
 */
export function initTwitter() {
  if (!process.env.TWITTER_API_KEY) {
    throw new Error('TWITTER_API_KEY not found in environment variables');
  }

  twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  console.log('✅ Twitter client initialized\n');
  return twitterClient;
}

/**
 * Post a tweet
 */
export async function postTweet(message) {
  if (!message) {
    throw new Error('Tweet message is required');
  }

  if (message.length > 280) {
    console.warn(`⚠️  Tweet too long (${message.length} chars), truncating...`);
    message = message.substring(0, 277) + '...';
  }

  // Dry run mode - don't actually post
  if (process.env.DRY_RUN === 'true') {
    console.log('🧪 DRY RUN MODE - Tweet not posted:\n');
    console.log('─'.repeat(50));
    console.log(message);
    console.log('─'.repeat(50));
    console.log(`\n✅ Dry run successful (${message.length} characters)\n`);
    return {
      success: true,
      dryRun: true,
      message,
      length: message.length
    };
  }

  try {
    if (!twitterClient) {
      initTwitter();
    }

    console.log('📤 Posting tweet...\n');
    console.log('─'.repeat(50));
    console.log(message);
    console.log('─'.repeat(50));

    const tweet = await twitterClient.v2.tweet(message);

    console.log(`\n✅ Tweet posted successfully!`);
    console.log(`   Tweet ID: ${tweet.data.id}`);
    console.log(`   Length: ${message.length} characters\n`);

    return {
      success: true,
      dryRun: false,
      tweetId: tweet.data.id,
      message,
      length: message.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to post tweet:', error.message);

    return {
      success: false,
      error: error.message,
      message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Verify Twitter credentials
 */
export async function verifyCredentials() {
  try {
    if (!twitterClient) {
      initTwitter();
    }

    const user = await twitterClient.v2.me();

    console.log('✅ Twitter credentials verified!');
    console.log(`   Username: @${user.data.username}`);
    console.log(`   Name: ${user.data.name}`);
    console.log(`   ID: ${user.data.id}\n`);

    return {
      success: true,
      user: user.data
    };

  } catch (error) {
    console.error('❌ Twitter credential verification failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  initTwitter,
  postTweet,
  verifyCredentials
};
