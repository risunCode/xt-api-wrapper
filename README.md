# Fetchtium API Wrapper v2.2.0

TypeScript wrapper for Fetchtium API social media downloader. Extract media from Instagram, Facebook, Twitter, TikTok, YouTube, and 9 more platforms with advanced features like automatic retry, caching, rate limiting, and batch processing.

## Features

- 🚀 Zero runtime dependencies (uses native `fetch`)
- 📦 Full TypeScript support with type definitions
- 🎯 Simple API - one function call to fetch media
- 🔄 Automatic retry with exponential backoff
- 💾 Response caching with TTL
- 🚦 Rate limiting and request queue
- 📦 Batch processing for multiple URLs
- 🎬 YouTube video+audio merge support
- 🌐 14 platforms supported

## Installation

```bash
npm install fetchtium-wrapper
# or
yarn add fetchtium-wrapper
```

## Quick Start

```typescript
import { FetchtiumClient } from 'fetchtium-wrapper';

const client = new FetchtiumClient({
  apiKey: 'sk_xxxxx',
  baseUrl: 'http://localhost:8080', // optional
});

// Fetch media from URL
const result = await client.fetch('https://www.instagram.com/p/ABC123/');

if (result.success) {
  console.log(result.data.downloads);
  console.log(result.data.author);
  console.log(result.meta.responseTime);
}
```

## Supported Platforms

### Native Extractors (Enhanced)

| Platform | Status | Provider |
|----------|--------|----------|
| Instagram | ✅ | Native + Enhanced (GraphQL API) |
| Facebook | ✅ | Native + Enhanced Extractor |
| Twitter/X | ✅ | Native + Enhanced (Syndication API) |
| TikTok | ✅ | Native + Enhanced (TikWM API) |
| YouTube | ✅ | yt-dlp + Enhanced (Merge support) |

### Generic Extractors (yt-dlp)

| Platform | Status | Provider |
|----------|--------|----------|
| Reddit | ✅ | yt-dlp |
| Bilibili | ✅ | yt-dlp |
| SoundCloud | ✅ | yt-dlp |
| Pixiv | ✅ | yt-dlp |
| Erome | ✅ | yt-dlp (18+) |
| Eporner | ✅ | yt-dlp (18+) |
| Rule34Video | ✅ | yt-dlp (18+) |
| Generic | ✅ | yt-dlp (fallback) |

**Total: 13 platforms supported**

## Configuration

```typescript
const client = new FetchtiumClient({
  // Required
  apiKey: string,      // Your API key
  
  // Optional
  baseUrl?: string,    // API base URL (default: 'http://localhost:8080')
  timeout?: number,    // Request timeout in ms (default: 30000)
  
  // Retry Configuration
  retry?: {
    maxRetries?: number;           // Max retry attempts (default: 3)
    retryDelay?: number;           // Initial delay in ms (default: 1000)
    backoffMultiplier?: number;    // Exponential backoff (default: 2)
    retryableErrors?: ErrorCode[]; // Error codes to retry
  },
  
  // Cache Configuration
  cache?: {
    enabled?: boolean;    // Enable caching (default: false)
    ttl?: number;         // Cache TTL in seconds (default: 300)
    maxSize?: number;     // Max cache entries (default: 100)
  },
  
  // Rate Limiting Configuration
  rateLimit?: {
    maxConcurrent?: number;         // Max concurrent requests (default: 5)
    queueTimeout?: number;          // Queue timeout in ms (default: 30000)
    respectServerLimits?: boolean;  // Respect Retry-After header (default: true)
  },
});
```

## API Reference

### fetch(url)

Fetch media from a URL with automatic caching and rate limiting.

```typescript
const result = await client.fetch('https://www.instagram.com/p/ABC123/');

// Response structure
{
  success: boolean,
  data: {
    platform: 'instagram',
    contentType: 'carousel',
    author: { name, username, avatar, verified },
    downloads: [
      { index: 0, type: 'image', quality: 'HD', url: '...' },
      { index: 1, type: 'video', quality: '1080p', url: '...' }
    ]
  },
  meta: { responseTime: 1234 },
  cached: false
}
```

### fetchWithRetry(url, retryConfig?)

Fetch with automatic retry for transient errors.

```typescript
const result = await client.fetchWithRetry(url, {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
});

// Retries on: NETWORK_ERROR, TIMEOUT, RATE_LIMITED, INTERNAL_ERROR
// Respects Retry-After header from server
```

### fetchBatch(urls, options?)

Fetch multiple URLs in batch with concurrency control.

```typescript
const results = await client.fetchBatch(
  [
    'https://www.instagram.com/p/ABC123/',
    'https://www.facebook.com/share/p/xyz/',
  ],
  {
    concurrency: 3,      // Max concurrent requests (default: 3)
    stopOnError: false,  // Stop on first error (default: false)
  }
);

// Results array
[
  {
    url: 'https://www.instagram.com/p/ABC123/',
    success: true,
    data: FetchtiumResponse,
    responseTime: 1234,
  },
  {
    url: 'https://www.facebook.com/share/p/xyz/',
    success: false,
    error: FetchtiumError,
    responseTime: 567,
  },
]
```

### convert(options)

Convert video to audio (MP3/M4A) using FFmpeg.

```typescript
const result = await client.convert({
  url: 'https://www.youtube.com/watch?v=xxx',
  format: 'mp3', // or 'm4a'
  filename: 'my_audio', // optional
});

if (result.success && result.blob) {
  // Download the audio blob
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename || 'audio.mp3';
  a.click();
}
```

**Note:** The convert endpoint extracts audio from any video URL. It uses FFmpeg to convert the video to MP3 (192kbps) or M4A (AAC 192kbps) format.

### merge(options)

Merge YouTube video and audio streams (for high quality videos).

```typescript
const result = await client.merge({
  url: 'https://www.youtube.com/watch?v=xxx',
  quality: '1080p',
  filename: 'my_video', // optional
});

if (result.success && result.blob) {
  // result.blob is a Blob object
  // result.filename is the suggested filename
  // result.size is the file size in bytes
}
```

### Generic Platform

The Generic platform uses **yt-dlp** as a fallback extractor for URLs that don't match native extractors. It automatically detects the platform from the yt-dlp output.

**Supported via Generic (yt-dlp):**
- Reddit - Posts, videos, images
- Bilibili - Videos, comments
- SoundCloud - Audio tracks
- Pixiv - Images, illustrations
- Erome - Adult content (18+)
- Eporner - Adult videos (18+)
- Rule34Video - Adult videos (18+)

**How it works:**
1. Generic extractor handles any URL as fallback
2. Runs yt-dlp to fetch metadata
3. Automatically detects platform from yt-dlp's `extractor` field
4. Returns platform-specific results

**Example:**
```typescript
// Reddit URL - automatically detected
const result = await client.fetch('https://www.reddit.com/r/...');

// Bilibili URL - automatically detected
const result = await client.fetch('https://www.bilibili.com/video/...');

// SoundCloud URL - automatically detected
const result = await client.fetch('https://soundcloud.com/...');
```

**Note:** Generic platform only supports the platforms listed above. For other sites, you may need a separate wrapper.

### Cache Management

```typescript
// Get cache stats
const stats = client.getCacheStats();
// { size: 5, maxSize: 100, enabled: true }

// Clear cache
client.clearCache();
```

### Rate Limit Stats

```typescript
// Get rate limit stats
const stats = client.getRateLimitStats();
// { activeRequests: 2, queuedRequests: 1, maxConcurrent: 5 }
```

## Examples

### Basic Usage

```typescript
import { FetchtiumClient } from 'fetchtium-wrapper';

const client = new FetchtiumClient({
  apiKey: 'sk_xxxxx',
});

const result = await client.fetch('https://www.instagram.com/p/ABC123/');

if (result.success) {
  result.data.downloads.forEach(download => {
    console.log(`${download.type} - ${download.quality}: ${download.url}`);
  });
}
```

### With Retry

```typescript
const client = new FetchtiumClient({
  apiKey: 'sk_xxxxx',
  retry: {
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 2,
  },
});

const result = await client.fetchWithRetry('https://www.instagram.com/p/ABC123/');
```

### With Caching

```typescript
const client = new FetchtiumClient({
  apiKey: 'sk_xxxxx',
  cache: {
    enabled: true,
    ttl: 300,      // 5 minutes
    maxSize: 50,   // Max 50 cached responses
  },
});

// First request - hits API
const result1 = await client.fetch('https://www.instagram.com/p/ABC123/');

// Second request - returns cached response (instant)
const result2 = await client.fetch('https://www.instagram.com/p/ABC123/');
```

### With Rate Limiting

```typescript
const client = new FetchtiumClient({
  apiKey: 'sk_xxxxx',
  rateLimit: {
    maxConcurrent: 3,      // Max 3 concurrent requests
    queueTimeout: 30000,   // 30 second queue timeout
    respectServerLimits: true,
  },
});

// Requests are automatically queued if over limit
const results = await Promise.all([
  client.fetch('https://www.instagram.com/p/ABC123/'),
  client.fetch('https://www.facebook.com/share/p/xyz/'),
  client.fetch('https://www.tiktok.com/@user/video/123/'),
]);
```

### Batch Processing

```typescript
const client = new FetchtiumClient({
  apiKey: 'sk_xxxxx',
});

const urls = [
  'https://www.instagram.com/p/ABC123/',
  'https://www.facebook.com/share/p/xyz/',
  'https://www.tiktok.com/@user/video/123/',
];

// Process 3 URLs concurrently
const results = await client.fetchBatch(urls, {
  concurrency: 3,
  stopOnError: false, // Continue on errors
});

results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.url}`);
    console.log(`   Downloads: ${result.data?.data.downloads.length}`);
  } else {
    console.log(`❌ ${result.url}`);
    console.log(`   Error: ${result.error?.code}`);
  }
});
```

### YouTube Merge

```typescript
const client = new FetchtiumClient({
  apiKey: 'sk_xxxxx',
});

const result = await client.merge({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  quality: '1080p',
  filename: 'never_gonna_give_you_up',
});

if (result.success && result.blob) {
  // Download the blob
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename || 'video.mp4';
  a.click();
}
```

## Utility Functions

```typescript
import {
  detectPlatform,
  findBestQuality,
  findByQuality,
  formatFileSize,
  getDownloadsNeedingMerge,
} from 'fetchtium-wrapper';

// Detect platform from URL
detectPlatform('https://instagram.com/p/xxx'); // 'instagram'

// Find best quality download
const best = findBestQuality(result.data.downloads, 'video');

// Find specific quality
const hd = findByQuality(result.data.downloads, '1080p');

// Format file size
formatFileSize(1024 * 1024); // '1 MB'

// Get downloads that need merge (YouTube)
const needsMerge = getDownloadsNeedingMerge(result.data.downloads);
```

## Error Handling

```typescript
import { FetchtiumError, isFetchtiumError } from 'fetchtium-wrapper';

try {
  const result = await client.fetch(url);
} catch (error) {
  if (isFetchtiumError(error)) {
    console.log(`Error Code: ${error.code}`);
    console.log(`Message: ${error.message}`);
    console.log(`User Message: ${error.getUserMessage()}`);
    console.log(`Severity: ${error.severity}`);
    console.log(`Retryable: ${error.isRetryable()}`);
    console.log(`Suggestions: ${error.suggestions}`);
    console.log(`Context:`, error.context);
    
    switch (error.code) {
      case 'PRIVATE_CONTENT':
        console.log('Content is private');
        break;
      case 'RATE_LIMITED':
        console.log('Too many requests - retry after:', error.context.retryAfter);
        break;
      case 'INVALID_URL':
        console.log('Invalid URL');
        break;
      default:
        console.log(error.getUserMessage());
    }
  }
}
```

### Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `PRIVATE_CONTENT` | Content is private | No |
| `LOGIN_REQUIRED` | Login required to access | No |
| `RATE_LIMITED` | Too many requests | Yes |
| `NO_MEDIA` | No downloadable media found | No |
| `CONTENT_REMOVED` | Content has been removed | No |
| `NETWORK_ERROR` | Network connection error | Yes |
| `TIMEOUT` | Request timed out | Yes |
| `INVALID_URL` | Invalid or unsupported URL | No |
| `UNSUPPORTED_PLATFORM` | Platform not supported | No |
| `INVALID_API_KEY` | Invalid API key | No |
| `INTERNAL_ERROR` | Server error | Yes |
| `COOKIE_REQUIRED` | Authentication required | No |
| `COOKIE_EXPIRED` | Session expired | No |
| `CONTENT_NOT_FOUND` | Content not found | No |
| `PARSE_ERROR` | Failed to parse content | No |
| `CHECKPOINT_REQUIRED` | Account verification required | No |
| `SCRAPE_ERROR` | Failed to extract content | No |
| `UNAUTHORIZED` | Authorization failed | No |
| `FORBIDDEN` | Access forbidden | No |
| `BAD_REQUEST` | Invalid request format | No |
| `STORY_EXPIRED` | Story has expired | No |
| `AGE_RESTRICTED` | Content is age-restricted | No |

## Performance Tips

1. **Enable Caching**: For frequently accessed URLs, enable caching to reduce response time by up to 100%
2. **Use Batch Processing**: Process multiple URLs efficiently with controlled concurrency
3. **Configure Retry**: Adjust retry settings based on your use case
4. **Rate Limiting**: Set appropriate concurrency limits to avoid overwhelming the server

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)
- TypeScript >= 5.0.0 (for type definitions)

## License

GPL-3.0
