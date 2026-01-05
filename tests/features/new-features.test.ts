/**
 * Test new features: Retry, Caching, Rate Limiting, Batch Processing
 */

import { FetchtiumClient } from '../../src/index';

const API_KEY = 'sk-dwa_c0e0714542ccf114748610fd97ae4fb1';
const BASE_URL = 'http://localhost:8080';

// ============================================================================
// Test 1: Retry Logic
// ============================================================================

async function testRetry() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 TEST 1: Retry Logic');
  console.log('='.repeat(60));

  const client = new FetchtiumClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
    retry: {
      maxRetries: 2,
      retryDelay: 500,
      backoffMultiplier: 2,
    },
  });

  try {
    const result = await client.fetchWithRetry('https://www.instagram.com/p/DM8qsPuTl6N/?hl=en&img_index=1');
    console.log('✅ Retry test passed!');
    console.log(`   Downloads: ${result.data.downloads.length}`);
  } catch (error) {
    console.log('❌ Retry test failed!');
    console.log(`   Error: ${error}`);
  }
}

// ============================================================================
// Test 2: Caching System
// ============================================================================

async function testCaching() {
  console.log('\n' + '='.repeat(60));
  console.log('💾 TEST 2: Caching System');
  console.log('='.repeat(60));

  const client = new FetchtiumClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
    cache: {
      enabled: true,
      ttl: 60,
      maxSize: 10,
    },
  });

  const url = 'https://www.facebook.com/share/p/1AVb5qxYjz/';

  // First request (not cached)
  console.log('\n📥 First request (not cached)...');
  const start1 = Date.now();
  const result1 = await client.fetch(url);
  const time1 = Date.now() - start1;
  console.log(`   Time: ${time1}ms`);
  console.log(`   Downloads: ${result1.data.downloads.length}`);

  // Second request (cached)
  console.log('\n📥 Second request (cached)...');
  const start2 = Date.now();
  const result2 = await client.fetch(url);
  const time2 = Date.now() - start2;
  console.log(`   Time: ${time2}ms`);
  console.log(`   Downloads: ${result2.data.downloads.length}`);

  // Cache stats
  const stats = client.getCacheStats();
  console.log('\n📊 Cache Stats:');
  console.log(`   Size: ${stats.size}/${stats.maxSize}`);
  console.log(`   Enabled: ${stats.enabled}`);

  // Performance improvement
  const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
  console.log(`\n⚡ Performance improvement: ${improvement}% faster`);

  if (time2 < time1) {
    console.log('✅ Caching test passed!');
  } else {
    console.log('❌ Caching test failed!');
  }
}

// ============================================================================
// Test 3: Rate Limiting
// ============================================================================

async function testRateLimiting() {
  console.log('\n' + '='.repeat(60));
  console.log('🚦 TEST 3: Rate Limiting');
  console.log('='.repeat(60));

  const client = new FetchtiumClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
    rateLimit: {
      maxConcurrent: 2,
      queueTimeout: 30000,
      respectServerLimits: true,
    },
  });

  const urls = [
    'https://www.facebook.com/share/p/1AVb5qxYjz/',
    'https://www.facebook.com/share/p/1MwYtuMRFw/',
    'https://www.instagram.com/p/DM8qsPuTl6N/?hl=en&img_index=1',
  ];

  console.log(`\n📥 Fetching ${urls.length} URLs with maxConcurrent=2...`);
  const start = Date.now();

  const results = await Promise.all(
    urls.map(url => client.fetch(url).catch(e => ({ error: e })))
  );

  const time = Date.now() - start;
  console.log(`\n⏱️  Total time: ${time}ms`);

  const successCount = results.filter(r => !r.error).length;
  console.log(`✅ Successful: ${successCount}/${urls.length}`);

  // Rate limit stats
  const stats = client.getRateLimitStats();
  console.log('\n📊 Rate Limit Stats:');
  console.log(`   Active: ${stats.activeRequests}`);
  console.log(`   Queued: ${stats.queuedRequests}`);
  console.log(`   Max Concurrent: ${stats.maxConcurrent}`);

  if (successCount === urls.length) {
    console.log('✅ Rate limiting test passed!');
  } else {
    console.log('❌ Rate limiting test failed!');
  }
}

// ============================================================================
// Test 4: Batch Processing
// ============================================================================

async function testBatchProcessing() {
  console.log('\n' + '='.repeat(60));
  console.log('📦 TEST 4: Batch Processing');
  console.log('='.repeat(60));

  const client = new FetchtiumClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  const urls = [
    'https://www.facebook.com/share/p/1AVb5qxYjz/',
    'https://www.facebook.com/share/p/1MwYtuMRFw/',
    'https://www.instagram.com/p/DM8qsPuTl6N/?hl=en&img_index=1',
  ];

  console.log(`\n📦 Processing ${urls.length} URLs in batch (concurrency=2)...`);
  const start = Date.now();

  const results = await client.fetchBatch(urls, {
    concurrency: 2,
    stopOnError: false,
  });

  const time = Date.now() - start;
  console.log(`\n⏱️  Total time: ${time}ms`);

  console.log('\n📊 Results:');
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`   ${icon} ${index + 1}. ${result.url.substring(0, 50)}...`);
    if (result.success) {
      console.log(`      Downloads: ${result.data?.data.downloads.length || 0}`);
      console.log(`      Response time: ${result.responseTime}ms`);
    } else {
      console.log(`      Error: ${result.error?.code}`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Successful: ${successCount}/${urls.length}`);

  if (successCount === urls.length) {
    console.log('✅ Batch processing test passed!');
  } else {
    console.log('❌ Batch processing test failed!');
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('🚀 Testing New Features');
  console.log('API Key:', API_KEY);
  console.log('Base URL:', BASE_URL);

  try {
    await testRetry();
    await testCaching();
    await testRateLimiting();
    await testBatchProcessing();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Tests Completed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Test suite failed!');
    console.error(error);
  }
}

runAllTests();
