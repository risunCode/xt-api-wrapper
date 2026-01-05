/**
 * Test All Platforms
 * Comprehensive testing for all supported platforms
 */

import { FetchtiumClient } from '../../src/index';

const API_KEY = 'sk-dwa_c0e0714542ccf114748610fd97ae4fb1';
const BASE_URL = 'http://localhost:8080';

const TEST_URLS = {
  youtube: {
    video: 'https://www.youtube.com/watch?v=31KxAImSEsg',
    short: 'https://youtu.be/31KxAImSEsg',
    playlist: 'https://www.youtube.com/playlist?list=PLiL1O7WxU1AeLG8Damoj4HQk2hoo_GQ96',
  },
  facebook: {
    post: 'https://www.facebook.com/share/p/17uLbtVZhr/',
    video: 'https://www.facebook.com/watch?v=123456789',
    reel: 'https://www.facebook.com/reel/123456789',
  },
  instagram: {
    post: 'https://www.instagram.com/p/Cz8-8PvA-6H/',
    reel: 'https://www.instagram.com/reel/Cz8-8PvA-6H/',
    story: 'https://www.instagram.com/stories/username/123456789',
  },
  twitter: {
    tweet: 'https://twitter.com/Twitter/status/123456789',
    video: 'https://twitter.com/user/status/123456789',
  },
  tiktok: {
    video: 'https://www.tiktok.com/@tiktok/video/7100000000000000001',
  },
};

const results: {
  platform: string;
  type: string;
  status: 'success' | 'error';
  data?: any;
  error?: any;
}[] = [];

async function testPlatform(platform: string, urls: Record<string, string>) {
  const client = new FetchtiumClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing ${platform.toUpperCase()}`);
  console.log('='.repeat(60));

  for (const [type, url] of Object.entries(urls)) {
    try {
      console.log(`\n📌 ${type}: ${url}`);
      const result = await client.fetch(url);

      console.log(`✅ Success!`);
      console.log(`   Platform: ${result.data?.platform}`);
      console.log(`   Content Type: ${result.data?.contentType}`);
      console.log(`   Title: ${result.data?.title?.substring(0, 50)}...`);
      console.log(`   Downloads: ${result.data?.downloads?.length}`);
      console.log(`   Response Time: ${result.meta?.responseTime}ms`);

      if (result.data?.downloads && result.data.downloads.length > 0) {
        const first = result.data.downloads[0];
        console.log(`   First: ${first.type} - ${first.quality} (${first.size ? formatBytes(first.size) : 'N/A'})`);
      }

      results.push({
        platform,
        type,
        status: 'success',
        data: {
          downloads: result.data?.downloads?.length,
          responseTime: result.meta?.responseTime,
        },
      });
    } catch (error: any) {
      console.log(`❌ Error: ${error.code}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   User: ${error.getUserMessage()}`);
      console.log(`   Retryable: ${error.isRetryable()}`);

      results.push({
        platform,
        type,
        status: 'error',
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function printSummary() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const total = results.length;
  const success = results.filter(r => r.status === 'success').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Errors: ${errors}`);

  console.log('\n\n📋 Results by Platform:');
  const platforms = [...new Set(results.map(r => r.platform))];
  
  platforms.forEach(platform => {
    const platformResults = results.filter(r => r.platform === platform);
    const platformSuccess = platformResults.filter(r => r.status === 'success').length;
    const platformErrors = platformResults.filter(r => r.status === 'error').length;
    
    console.log(`\n${platform.toUpperCase()}:`);
    console.log(`  ✅ ${platformSuccess} | ❌ ${platformErrors}`);
    
    platformResults.forEach(r => {
      const icon = r.status === 'success' ? '✅' : '❌';
      const info = r.status === 'success' 
        ? `${r.data.downloads} downloads, ${r.data.responseTime}ms`
        : `${r.error.code}`;
      console.log(`  ${icon} ${r.type}: ${info}`);
    });
  });

  console.log(`\n${'='.repeat(60)}\n`);
}

async function runAllTests() {
  console.log('🚀 Starting Fetchtium Wrapper Platform Tests');
  console.log(`API Key: ${API_KEY}`);
  console.log(`Base URL: ${BASE_URL}`);

  for (const [platform, urls] of Object.entries(TEST_URLS)) {
    await testPlatform(platform, urls);
  }

  printSummary();
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
