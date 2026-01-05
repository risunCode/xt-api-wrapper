/**
 * Test Fetchtium Wrapper with YouTube URL
 */

import { FetchtiumClient } from '../../src/index';

// API Configuration
const API_KEY = 'sk-dwa_c0e0714542ccf114748610fd97ae4fb1';
const BASE_URL = 'http://localhost:8080';

// Test URL
const TEST_URL = 'https://www.youtube.com/watch?v=31KxAImSEsg&list=PLiL1O7WxU1AeLG8Damoj4HQk2hoo_GQ96&index=5';

async function testYouTube() {
  console.log('Testing Fetchtium Wrapper with YouTube URL');
  console.log('='.repeat(60));
  console.log(`URL: ${TEST_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));
  console.log();

  const client = new FetchtiumClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  try {
    console.log('Fetching...');
    const result = await client.fetch(TEST_URL);

    console.log('\n✅ Success!');
    console.log('='.repeat(60));
    console.log('\n📦 Full Response Structure:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n\n📊 Summary:');
    console.log(`Success: ${result.success}`);
    console.log(`Platform: ${result.data?.platform}`);
    console.log(`Content Type: ${result.data?.contentType}`);
    console.log(`Title: ${result.data?.title}`);
    console.log(`Author: ${result.data?.author?.name} (@${result.data?.author?.username})`);
    console.log(`Duration: ${result.data?.duration}s`);
    console.log(`Downloads: ${result.data?.downloads?.length}`);
    console.log(`Response Time: ${result.meta?.responseTime}ms`);
    console.log(`Cached: ${result.cached}`);

    console.log('\n📥 Downloads:');
    result.data?.downloads?.forEach((dl, index) => {
      console.log(`  [${index}] ${dl.type.toUpperCase()} - ${dl.quality}`);
      console.log(`      URL: ${dl.url.substring(0, 80)}...`);
      console.log(`      Size: ${dl.size ? formatBytes(dl.size) : 'N/A'}`);
      console.log(`      Width: ${dl.width || 'N/A'}, Height: ${dl.height || 'N/A'}`);
      console.log(`      Has Audio: ${dl.hasAudio ? 'Yes' : 'No'}`);
      console.log(`      Needs Merge: ${dl.needsMerge ? 'Yes' : 'No'}`);
      console.log();
    });

    console.log('💬 Engagement:');
    console.log(`  Views: ${result.data?.engagement?.views?.toLocaleString() || 'N/A'}`);
    console.log(`  Likes: ${result.data?.engagement?.likes?.toLocaleString() || 'N/A'}`);
    console.log(`  Comments: ${result.data?.engagement?.comments?.toLocaleString() || 'N/A'}`);

    console.log('\n🖼️ Thumbnail:');
    console.log(`  ${result.data?.thumbnail || 'N/A'}`);

  } catch (error: any) {
    console.log('\n❌ Error!');
    console.log('='.repeat(60));
    console.log(`Error Code: ${error.code}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`User Message: ${error.getUserMessage()}`);
    console.log(`Retryable: ${error.isRetryable()}`);
    console.log(`Status Code: ${error.statusCode || 'N/A'}`);

    if (error.cause) {
      console.log(`\nCause: ${error.cause.message}`);
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Run test
testYouTube().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
