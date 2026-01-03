# XT-API Wrapper

TypeScript wrapper for XT-API social media downloader. Extract media from Instagram, Facebook, Twitter, TikTok, YouTube, and 9 more platforms.

## Features

- 🚀 Zero runtime dependencies (uses native `fetch`)
- 📦 Full TypeScript support with type definitions
- 🎯 Simple API - one function call to fetch media
- 🔄 YouTube video+audio merge support
- 🌐 14 platforms supported

## Installation

```bash
npm install xt-api-wrapper
# or
yarn add xt-api-wrapper
```

## Quick Start

```typescript
import { XTClient } from 'xt-api-wrapper';

const client = new XTClient({
  apiKey: 'xt_xxxxx',
  baseUrl: 'https://api-xtfetch.up.railway.app', // optional
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

| Platform | Status |
|----------|--------|
| Instagram | ✅ |
| Facebook | ✅ |
| Twitter/X | ✅ |
| TikTok | ✅ |
| YouTube | ✅ |
| Weibo | ✅ |
| Reddit | ✅ |
| Bilibili | ✅ |
| SoundCloud | ✅ |
| Pixiv | ✅ |
| Erome | ✅ |
| Eporner | ✅ |
| PornHub | ✅ |
| Rule34Video | ✅ |

## API Reference

### XTClient

```typescript
const client = new XTClient({
  apiKey: string,      // Required - Your API key
  baseUrl?: string,    // Optional - API base URL
  timeout?: number,    // Optional - Request timeout in ms (default: 30000)
});
```

### fetch(url)

Fetch media from a URL.

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

### merge(options)

Merge YouTube video and audio streams (for high quality videos).

```typescript
const result = await client.merge({
  url: 'https://www.youtube.com/watch?v=xxx',
  quality: '1080p',
  filename: 'my_video', // optional
});

if (result.success && result.downloadUrl) {
  console.log('Download:', result.downloadUrl);
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
} from 'xt-api-wrapper';

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
import { XTError, isXTError } from 'xt-api-wrapper';

try {
  const result = await client.fetch(url);
} catch (error) {
  if (isXTError(error)) {
    switch (error.code) {
      case 'PRIVATE_CONTENT':
        console.log('Content is private');
        break;
      case 'RATE_LIMITED':
        console.log('Too many requests');
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

| Code | Description |
|------|-------------|
| `PRIVATE_CONTENT` | Content is private |
| `LOGIN_REQUIRED` | Login required to access |
| `RATE_LIMITED` | Too many requests |
| `NO_MEDIA` | No downloadable media found |
| `CONTENT_REMOVED` | Content has been removed |
| `NETWORK_ERROR` | Network connection error |
| `TIMEOUT` | Request timed out |
| `INVALID_URL` | Invalid or unsupported URL |
| `UNSUPPORTED_PLATFORM` | Platform not supported |
| `INVALID_API_KEY` | Invalid API key |
| `SERVER_ERROR` | Server error |

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)

## License

GPL-3.0
