#!/usr/bin/env node

import 'dotenv/config';
import Replicate from 'replicate';

console.log('🔍 Verifying Replicate API credentials...\n');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

async function verifyReplicateAPI() {
  try {
    const output = await replicate.run(
      "openai/gpt-5-nano",
      {
        input: {
          prompt: 'Respond with just "OK" if you can read this.',
          max_tokens: 50,
          temperature: 0.7
        }
      }
    );

    const text = output.join('');

    console.log('✅ Replicate API credentials verified!');
    console.log(`   Model: openai/gpt-5-nano`);
    console.log(`   Response: ${text}\n`);

    console.log('✅ All checks passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Replicate API verification failed:', error.message);
    process.exit(1);
  }
}

verifyReplicateAPI();
