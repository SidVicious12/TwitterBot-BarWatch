#!/usr/bin/env node

/**
 * Test script for the image enhancement pipeline
 * Run: node scripts/test-image-pipeline.js
 */

import 'dotenv/config';
import { fetchRecentKimImage } from '../src/imageScraper.js';
import { enhanceImage } from '../src/imageEnhancer.js';
import { generateCaption } from '../src/captionGenerator.js';

async function testPipeline() {
    console.log('🧪 Testing Image Enhancement Pipeline\n');
    console.log('═'.repeat(60));

    // Check for Replicate API token
    if (!process.env.REPLICATE_API_TOKEN) {
        console.error('❌ REPLICATE_API_TOKEN not set in .env');
        process.exit(1);
    }

    console.log('✅ Replicate API token found\n');

    try {
        // Step 1: Fetch and enhance image
        console.log('📸 Step 1: Fetching Kim Kardashian image...\n');
        const image = await fetchRecentKimImage({ enhance: true, scale: 2 });

        if (!image) {
            throw new Error('No image returned');
        }

        console.log('Image result:');
        console.log(`   Path: ${image.path}`);
        console.log(`   Size: ${image.width}x${image.height}`);
        console.log(`   Enhanced: ${image.wasEnhanced ? 'YES ✨' : 'NO'}`);
        console.log(`   Description: ${image.description}\n`);

        // Step 2: Generate caption
        console.log('✍️ Step 2: Generating caption...\n');
        const captionResult = await generateCaption({
            imageDescription: image.description,
            scrapedItems: [],
            hasNewUpdate: false,
            isLowResImage: image.isLowRes || false
        });

        console.log('Caption result:');
        console.log(`   Text: ${captionResult.caption}`);
        console.log(`   Length: ${captionResult.charCount} chars`);
        console.log(`   Hashtags: ${captionResult.hashtags.join(' ')}\n`);

        // Verify hashtags
        const hasKimKardashian = captionResult.caption.includes('#KimKardashian');
        const hasBarWatch = captionResult.caption.includes('#BarWatch');

        console.log('═'.repeat(60));
        console.log('✅ Pipeline test completed!\n');
        console.log('Verification:');
        console.log(`   #KimKardashian: ${hasKimKardashian ? '✅' : '❌'}`);
        console.log(`   #BarWatch: ${hasBarWatch ? '✅' : '❌'}`);
        console.log(`   Image enhanced: ${image.wasEnhanced ? '✅' : '⚠️ (may have used full-res)'}`);

    } catch (error) {
        console.error('❌ Pipeline test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testPipeline();
