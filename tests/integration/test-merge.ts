/**
 * Test Merge - Fetchtium Wrapper
 * Run with: npx tsx tests/integration/test-merge.ts
 * 
 * NOTE: This is a development test. In production, set FETCHTIUM_API_URL
 * in YOUR project's .env file, NOT in the wrapper folder.
 */

import { FetchtiumClient } from '../../src/index';
import * as fs from 'fs';

const API_KEY = 'sk-dwa_c0e0714542ccf114748610fd97ae4fb1';
const BASE_URL = 'http://localhost:8080'; // Development test URL

const client = new FetchtiumClient({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  timeout: 120000,
});

async function testMerge() {
  const url = 'https://www.youtube.com/watch?v=qEN3_ou1xXI';
  
  console.log('🎬 Testing YouTube Merge with Fetchtium Wrapper');
  console.log('URL:', url);
  console.log('Base URL:', BASE_URL);
  console.log('='.repeat(60));

  // Step 1: Fetch video info
  console.log('\n📥 Step 1: Fetching video info...');
  const result = await client.fetch(url);

  if (!result.success) {
    console.log('❌ Failed to fetch:', result);
    return;
  }

  const title = result.data.title || 'video';
  console.log('✅ Video:', title);
  console.log('\nAvailable downloads:');
  result.data.downloads.forEach((d, i) => {
    const merge = d.needsMerge ? '⚠️ needs merge' : '✅ has audio';
    console.log(`  [${i}] ${d.type} - ${d.quality} ${merge}`);
  });

  // Step 2: Merge 144p
  console.log('\n🔄 Step 2: Merging 144p video + audio...');
  
  try {
    const mergeResult = await client.merge({
      url: url,
      quality: '144p',
    });

    if (mergeResult.success && mergeResult.blob) {
      console.log('\n✅ Merge successful!');
      console.log('Filename:', mergeResult.filename);
      console.log('Size:', (mergeResult.size! / 1024 / 1024).toFixed(2), 'MB');

      // Save to file
      const buffer = Buffer.from(await mergeResult.blob.arrayBuffer());
      const outputFile = mergeResult.filename || 'output.mp4';
      fs.writeFileSync(outputFile, buffer);
      console.log('Saved to:', outputFile);
    } else {
      console.log('❌ Merge failed:', mergeResult.error);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

testMerge().catch(console.error);
