#!/usr/bin/env node

import 'dotenv/config';
import { verifyCredentials } from '../src/twitter.js';

console.log('🔍 Verifying Twitter credentials...\n');

verifyCredentials()
  .then(result => {
    if (result.success) {
      console.log('✅ All checks passed!\n');
      process.exit(0);
    } else {
      console.error('❌ Verification failed\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
