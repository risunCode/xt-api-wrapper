/**
 * Test User-Provided URLs
 * Test specific URLs provided by the user
 */

import { FetchtiumClient } from '../../src/index';

const API_KEY = 'sk-dwa_c0e0714542ccf114748610fd97ae4fb1';
const BASE_URL = 'http://localhost:8080';

const TEST_URLS = {
  facebook: {
    public: 'https://www.facebook.com/share/p/1AVb5qxYjz/',
    reels: 'https://www.facebook.com/share/r/16BQebJKww/',
    group: 'https://www.facebook.com/share/p/1MwYtuMRFw/',
  },
  instagram: {
    image: 'https://www.instagram.com/p/DM8qsPuTl6N/?hl=en&img_index=1',
  },
};

async function testURL(platform: string, type: string, url: string) {
  const client = new FetchtiumClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${platform.toUpperCase()} - ${type.toUpperCase()}`);
  console.log('='.repeat(60));
  console.log(`URL: ${url}\n`);

  try {
    const result = await client.fetch(url);

    console.log(`✅ Success!`);
    console.log(`   Platform: ${result.data?.platform}`);
    console.log(`   Content Type: ${result.data?.contentType}`);
    console.log(`   ID: ${result.data?.id}`);
    console.log(`   Title: ${result.data?.title?.substring(0, 60)}...`);
    console.log(`   Author: ${result.data?.author?.name || 'N/A'} (@${result.data?.author?.username || 'N/A'})`);
    console.log(`   Duration: ${result.data?.duration ? result.data.duration + 's' : 'N/A'}`);
    console.log(`   Downloads: ${result.data?.downloads?.length}`);
    console.log(`   Response Time: ${result.meta?.responseTime}ms`);

    if (result.data?.downloads && result.data.downloads.length > 0) {
      console.log(`\n   📥 Downloads:`);
      result.data.downloads.forEach((dl, i) => {
        const size = dl.size ? formatBytes(dl.size) : 'N/A';
        console.log(`      [${i}] ${dl.type.toUpperCase()} - ${dl.quality} (${size})`);
        console.log(`          URL: ${dl.url.substring(0, 60)}...`);
        console.log(`          Has Audio: ${dl.hasAudio ? 'Yes' : 'No'}, Needs Merge: ${dl.needsMerge ? 'Yes' : 'No'}`);
      });
    }

    if (result.data?.engagement) {
      console.log(`\n   💬 Engagement:`);
      console.log(`      Views: ${result.data.engagement.views?.toLocaleString() || 'N/A'}`);
      console.log(`      Likes: ${result.data.engagement.likes?.toLocaleString() || 'N/A'}`);
      console.log(`      Comments: ${result.data.engagement.comments?.toLocaleString() || 'N/A'}`);
    }

    console.log(`\n   🖼️ Thumbnail: ${result.data?.thumbnail || 'N/A'}`);

  } catch (error: any) {
    console.log(`❌ Error!`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   User Message: ${error.getUserMessage()}`);
    console.log(`   Severity: ${error.severity}`);
    console.log(`   Retryable: ${error.isRetryable()}`);
    
    if (error.context) {
      console.log(`\n   📍 Context:`);
      console.log(`      URL: ${error.context.url || 'N/A'}`);
      console.log(`      Platform: ${error.context.platform || 'N/A'}`);
      console.log(`      Timestamp: ${error.context.timestamp || 'N/A'}`);
    }

    if (error.suggestions && error.suggestions.length > 0) {
      console.log(`\n   💡 Suggestions:`);
      error.suggestions.forEach((s: string, i: number) => {
        console.log(`      ${i + 1}. ${s}`);
      });
    }
  }

  // Rate limiting delay
  await new Promise(resolve => setTimeout(resolve, 2000));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function runTests() {
  console.log('🚀 Testing User-Provided URLs');
  console.log(`API Key: ${API_KEY}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total URLs: ${Object.values(TEST_URLS).flat().length}`);

  for (const [platform, urls] of Object.entries(TEST_URLS)) {
    for (const [type, url] of Object.entries(urls)) {
      await testURL(platform, type, url);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All Tests Completed!');
  console.log('='.repeat(60));
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
