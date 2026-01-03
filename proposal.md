# XT-API Wrapper Services - Proposal

## Overview

TypeScript/Node.js wrapper library untuk XT-API Engine. Bisa dipakai sebagai:
- NPM package (`@xt-api/wrapper` atau `xt-api-wrapper`)
- Direct import di project Node.js/TypeScript

## Goals

1. **Simple API** - Satu function call untuk fetch media
2. **Type-safe** - Full TypeScript support dengan interfaces
3. **Lightweight** - Minimal dependencies
4. **Publishable** - Siap publish ke NPM

---

## API Design

### Installation
```bash
npm install xt-api-wrapper
# atau
yarn add xt-api-wrapper
```

### Basic Usage
```typescript
import { XTClient } from 'xt-api-wrapper';

const client = new XTClient({
  apiKey: 'xt_xxxxx',
  baseUrl: 'https://api-xtfetch.up.railway.app' // optional, ada default
});

// Fetch media dari URL
const result = await client.fetch('https://www.instagram.com/p/ABC123/');

if (result.success) {
  console.log(result.data.downloads); // Download array
  console.log(result.data.author);    // Author info
  console.log(result.meta.responseTime); // Response time
}

// YouTube merge (video + audio)
const merged = await client.merge({
  url: 'https://www.youtube.com/watch?v=xxx',
  quality: '1080p', // atau '720p', '480p', '360p'
  filename: 'my_video' // optional
});

// Returns blob atau stream
```

---

## Type Definitions

```typescript
// Config
interface XTClientConfig {
  apiKey: string;
  baseUrl?: string; // default: 'https://api-xtfetch.up.railway.app'
  timeout?: number; // default: 30000ms
}

// Response types (aligned with backend)
interface XTResponse {
  success: boolean;
  data: MediaData;
  meta: ResponseMeta;
  cached: boolean;
}

interface MediaData {
  platform: Platform;
  contentType: ContentType;
  postId?: string;
  postDate?: string;
  author?: Author;
  title?: string;
  description?: string;
  thumbnail?: string;
  url: string;
  engagement?: Engagement;
  downloads: Download[];
  usedCookie?: boolean;
}

interface Download {
  index?: number;
  type: 'video' | 'image' | 'audio';
  quality: string;
  url: string;
  thumbnail?: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
  mimeType?: string;
  needsMerge?: boolean;
  hasAudio?: boolean;
}

interface Author {
  id?: string;
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
}

interface Engagement {
  likes?: number;
  comments?: number;
  views?: number;
  shares?: number;
  saves?: number;
}

interface ResponseMeta {
  responseTime: number;
  resolvedUrl?: string;
  isPublic?: boolean;
  usedCookie?: boolean;
}

type Platform = 
  // Social Media
  | 'instagram' 
  | 'facebook' 
  | 'twitter' 
  | 'tiktok' 
  | 'youtube' 
  | 'weibo'
  // Content Platforms
  | 'reddit' 
  | 'bilibili'
  | 'soundcloud' 
  | 'pixiv'
  // Adult Platforms (18+)
  | 'erome' 
  | 'eporner' 
  | 'pornhub' 
  | 'rule34video';

type ContentType = 'video' | 'image' | 'audio' | 'story' | 'reel' | 'post' | 'carousel';

// Error types
interface XTError {
  code: ErrorCode;
  message: string;
}

type ErrorCode = 
  | 'PRIVATE_CONTENT' | 'LOGIN_REQUIRED' | 'RATE_LIMITED'
  | 'NO_MEDIA' | 'CONTENT_REMOVED' | 'NETWORK_ERROR'
  | 'TIMEOUT' | 'INVALID_URL' | 'UNSUPPORTED_PLATFORM';
```

---

## Project Structure

```
XT-WrapperServices/
├── src/
│   ├── index.ts          # Main export
│   ├── client.ts         # XTClient class
│   ├── types.ts          # Type definitions
│   ├── errors.ts         # Error classes
│   └── utils.ts          # Helper functions
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## Implementation Plan

### Phase 1: Core Setup (30 min)
- [ ] Initialize npm package
- [ ] Setup TypeScript config
- [ ] Create type definitions
- [ ] Basic project structure

### Phase 2: Client Implementation (45 min)
- [ ] `XTClient` class
- [ ] `fetch()` method - main scraping
- [ ] `merge()` method - YouTube video+audio merge
- [ ] Error handling

### Phase 3: Polish (30 min)
- [ ] README documentation
- [ ] JSDoc comments
- [ ] Build scripts
- [ ] Example usage

---

## Dependencies

```json
{
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "node-fetch": "^3.0.0"  // Optional, for Node.js < 18
  }
}
```

**Zero runtime dependencies!** Pakai native `fetch` (Node 18+) atau browser fetch.

---

## Example Code

### Fetch Instagram
```typescript
const result = await client.fetch('https://www.instagram.com/p/ABC123/');

// Carousel
result.data.downloads.forEach((item, i) => {
  console.log(`Item ${item.index}: ${item.type} - ${item.quality}`);
  console.log(`  URL: ${item.url}`);
  console.log(`  Thumbnail: ${item.thumbnail}`);
});
```

### Fetch YouTube + Merge
```typescript
const result = await client.fetch('https://www.youtube.com/watch?v=xxx');

// Find HD video that needs merge
const hdVideo = result.data.downloads.find(d => 
  d.quality === '1080p' && d.needsMerge
);

if (hdVideo) {
  // Use merge endpoint
  const blob = await client.merge({
    url: result.data.url,
    quality: '1080p'
  });
  
  // Save to file (Node.js)
  fs.writeFileSync('video.mp4', Buffer.from(await blob.arrayBuffer()));
}
```

### Error Handling
```typescript
try {
  const result = await client.fetch(url);
} catch (error) {
  if (error instanceof XTError) {
    switch (error.code) {
      case 'PRIVATE_CONTENT':
        console.log('Content is private');
        break;
      case 'RATE_LIMITED':
        console.log('Too many requests, try again later');
        break;
      default:
        console.log(error.message);
    }
  }
}
```

---

## NPM Package Config

```json
{
  "name": "xt-api-wrapper",
  "version": "1.0.0",
  "description": "TypeScript wrapper for XT-API social media downloader",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "keywords": [
    "social-media", "downloader", "api-wrapper",
    "instagram", "facebook", "twitter", "tiktok", "youtube", "weibo",
    "reddit", "bilibili", "soundcloud", "pixiv",
    "video-downloader", "media-extractor"
  ],
  "license": "GPL-3.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/user/xt-api-wrapper"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Estimated Effort

| Phase | Task | Time |
|-------|------|------|
| 1 | Core Setup | 30 min |
| 2 | Client Implementation | 45 min |
| 3 | Polish & Docs | 30 min |
| **Total** | | **~2 hours** |

---

## Questions

1. Package name preference? `xt-api-wrapper` atau `@xt-api/wrapper` (scoped)?
2. Mau support Node.js < 18 (perlu polyfill fetch)?
3. Mau ada helper untuk download file langsung ke disk?

---

## Next Steps

Kalau proposal approved:
1. Setup project structure
2. Implement core client
3. Test dengan real API
4. Publish ke NPM (optional)
