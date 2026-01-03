/**
 * XT-API Wrapper - Utility Functions
 * @module xt-api-wrapper/utils
 */

import type { Platform, Download } from './types';

/**
 * List of all supported platforms
 */
export const SUPPORTED_PLATFORMS: Platform[] = [
  // Social Media
  'instagram',
  'facebook',
  'twitter',
  'tiktok',
  'youtube',
  'weibo',
  // Content Platforms
  'reddit',
  'bilibili',
  'soundcloud',
  'pixiv',
  // Adult Platforms (18+)
  'erome',
  'eporner',
  'pornhub',
  'rule34video',
];

/**
 * Platform domain patterns for URL detection
 */
const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  instagram: [/instagram\.com/, /instagr\.am/],
  facebook: [/facebook\.com/, /fb\.watch/, /fb\.com/],
  twitter: [/twitter\.com/, /x\.com/, /t\.co/],
  tiktok: [/tiktok\.com/, /vm\.tiktok\.com/],
  youtube: [/youtube\.com/, /youtu\.be/, /youtube\.shorts/],
  weibo: [/weibo\.com/, /weibo\.cn/],
  reddit: [/reddit\.com/, /redd\.it/],
  bilibili: [/bilibili\.com/, /b23\.tv/],
  soundcloud: [/soundcloud\.com/],
  pixiv: [/pixiv\.net/],
  erome: [/erome\.com/],
  eporner: [/eporner\.com/],
  pornhub: [/pornhub\.com/],
  rule34video: [/rule34video\.com/],
};

/**
 * Validate if a string is a valid URL
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Detect platform from URL
 * @returns Platform name or null if not supported
 */
export function detectPlatform(url: string): Platform | null {
  if (!isValidURL(url)) return null;

  const hostname = new URL(url).hostname.toLowerCase();

  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(hostname))) {
      return platform as Platform;
    }
  }

  return null;
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(platform: string): platform is Platform {
  return SUPPORTED_PLATFORMS.includes(platform as Platform);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Find best quality download from array
 */
export function findBestQuality(
  downloads: Download[],
  type: 'video' | 'image' | 'audio' = 'video'
): Download | undefined {
  const filtered = downloads.filter((d) => d.type === type);

  if (filtered.length === 0) return undefined;

  // Sort by quality (higher resolution first)
  return filtered.sort((a, b) => {
    // Try to parse quality as number (e.g., '1080p' -> 1080)
    const qualityA = parseInt(a.quality) || 0;
    const qualityB = parseInt(b.quality) || 0;

    if (qualityA !== qualityB) return qualityB - qualityA;

    // Fall back to resolution
    const resA = (a.width || 0) * (a.height || 0);
    const resB = (b.width || 0) * (b.height || 0);

    return resB - resA;
  })[0];
}

/**
 * Find download by quality
 */
export function findByQuality(
  downloads: Download[],
  quality: string,
  type?: 'video' | 'image' | 'audio'
): Download | undefined {
  return downloads.find((d) => {
    const matchesQuality = d.quality.toLowerCase() === quality.toLowerCase();
    const matchesType = type ? d.type === type : true;
    return matchesQuality && matchesType;
  });
}

/**
 * Get all available qualities from downloads
 */
export function getAvailableQualities(
  downloads: Download[],
  type?: 'video' | 'image' | 'audio'
): string[] {
  const filtered = type ? downloads.filter((d) => d.type === type) : downloads;
  const qualities = new Set(filtered.map((d) => d.quality));
  return Array.from(qualities);
}

/**
 * Filter downloads that need merge (YouTube)
 */
export function getDownloadsNeedingMerge(downloads: Download[]): Download[] {
  return downloads.filter((d) => d.needsMerge === true);
}

/**
 * Filter downloads with audio
 */
export function getDownloadsWithAudio(downloads: Download[]): Download[] {
  return downloads.filter((d) => d.hasAudio === true || d.type === 'audio');
}

/**
 * Sleep utility for retry logic
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize filename for safe file system usage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Remove consecutive underscores
    .replace(/^\.+/, '') // Remove leading dots
    .trim()
    .slice(0, 200); // Limit length
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `xt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if running in Node.js environment
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
