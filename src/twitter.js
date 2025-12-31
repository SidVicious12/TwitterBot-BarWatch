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
 * Upload media to Twitter
 */
export async function uploadMedia(filePath) {
  if (!filePath) return null;

  // Dry run check
  if (process.env.DRY_RUN === 'true') {
    console.log(`🧪 DRY RUN: Simulating upload of ${filePath}`);
    return 'mock_media_id_123';
  }

  try {
    if (!twitterClient) {
      initTwitter();
    }

    // Media upload uses v1.1 API
    console.log(`📤 Uploading media: ${filePath}...`);
    const mediaId = await twitterClient.v1.uploadMedia(filePath);
    console.log(`✅ Media uploaded! ID: ${mediaId}\n`);

    return mediaId;

  } catch (error) {
    console.error('❌ Failed to upload media', error.message);
    return null;
  }
}

/**
 * Post a tweet (text + optional media)
 */
export async function postTweet(message, mediaId = null) {
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
    if (mediaId) console.log(`[Attached Media ID: ${mediaId}]`);
    console.log('─'.repeat(50));
    console.log(`\n✅ Dry run successful (${message.length} characters)\n`);
    return {
      success: true,
      dryRun: true,
      message,
      tweetId: 'mock_tweet_id_123'
    };
  }

  try {
    if (!twitterClient) {
      initTwitter();
    }

    console.log('📤 Posting tweet...\n');
    console.log('─'.repeat(50));
    console.log(message);
    if (mediaId) console.log(`[With Media ID: ${mediaId}]`);
    console.log('─'.repeat(50));

    // Construct tweet payload
    const payload = { text: message };
    if (mediaId) {
      payload.media = { media_ids: [mediaId] }; // v2 format
    }

    const tweet = await twitterClient.v2.tweet(payload);

    console.log(`\n✅ Tweet posted successfully!`);
    console.log(`   Tweet ID: ${tweet.data.id}`);

    return {
      success: true,
      dryRun: false,
      tweetId: tweet.data.id,
      message,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to post tweet');
    console.error('   Error message:', error.message);
    return {
      success: false,
      error: error.message
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
    console.error('❌ Twitter credential verification failed');
    console.error('   Error message:', error.message);
    console.error('   Status code:', error.code || error.statusCode || 'N/A');

    if (error.data) {
      console.error('   Response data:', JSON.stringify(error.data, null, 2));
    }

    if (error.errors) {
      console.error('   API errors:', JSON.stringify(error.errors, null, 2));
    }

    if (error.response?.data) {
      console.error('   Full response body:', JSON.stringify(error.response.data, null, 2));
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code || error.statusCode,
      errorData: error.data || error.response?.data
    };
  }
}

export default {
  initTwitter,
  postTweet,
  uploadMedia,
  verifyCredentials
};
