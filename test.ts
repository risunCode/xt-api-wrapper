/**
 * Functional Test - XT-API Wrapper
 * Run with: npx tsx test.ts
 */

import { XTClient, detectPlatform, findBestQuality, formatFileSize } from './src/index';

const API_KEY = 'xt_45277959eec3b6f17ea049324b62902f925faf07c084c1832d9bfbe18b4824f2';
const BASE_URL = 'http://localhost:3002';

const client = new XTClient({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  timeout: 60000,
});

// Test URLs
const testUrls = [
  'https://www.youtube.com/watch?v=uX7sposDAzc',
];

async function testFetch(url: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`Testing: ${url}`);
  console.log(`Platform: ${detectPlatform(url)}`);
  console.log('='.repeat(60));

  try {
    const result = await client.fetch(url);

    if (result.success) {
      console.log('\n✅ SUCCESS');
      console.log(`Platform: ${result.data.platform}`);
      console.log(`Content Type: ${result.data.contentType}`);
      console.log(`Response Time: ${result.meta.responseTime}ms`);
      console.log(`Cached: ${result.cached}`);

      if (result.data.author) {
        console.log(`\nAuthor: ${result.data.author.name || result.data.author.username}`);
      }

      if (result.data.title) {
        console.log(`Title: ${result.data.title.slice(0, 50)}...`);
      }

      console.log(`\nDownloads (${result.data.downloads.length}):`);
      result.data.downloads.forEach((d, i) => {
        const size = d.size ? formatFileSize(d.size) : 'N/A';
        console.log(`  [${d.index ?? i}] ${d.type} - ${d.quality} (${size})`);
        if (d.needsMerge) console.log(`       ⚠️  Needs merge`);
      });

      // Test utility functions
      const best = findBestQuality(result.data.downloads, 'video');
      if (best) {
        console.log(`\nBest video quality: ${best.quality}`);
      }
    } else {
      console.log('\n❌ FAILED');
      console.log(result);
    }
  } catch (error) {
    console.log('\n❌ ERROR');
    console.error(error);
  }
}

async function main() {
  console.log('🚀 XT-API Wrapper Functional Test');
  console.log(`API: ${BASE_URL}`);

  for (const url of testUrls) {
    await testFetch(url);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!');
}

main();
