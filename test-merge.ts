/**
 * Test Merge - XT-API Wrapper
 * Run with: npx tsx test-merge.ts
 */

import { XTClient } from './src/index';
import * as fs from 'fs';

const API_KEY = 'xt_45277959eec3b6f17ea049324b62902f925faf07c084c1832d9bfbe18b4824f2';
const BASE_URL = 'http://localhost:3002';

const client = new XTClient({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  timeout: 120000,
});

async function testMerge() {
  const url = 'https://www.youtube.com/watch?v=uX7sposDAzc';
  
  console.log('🎬 Testing YouTube Merge');
  console.log('URL:', url);
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

  // Step 2: Merge 480p
  console.log('\n🔄 Step 2: Merging 480p video + audio...');
  
  try {
    const mergeResult = await client.merge({
      url: url,
      quality: '480p',
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
