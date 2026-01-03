/**
 * XT-API Wrapper
 * TypeScript wrapper for XT-API social media downloader
 *
 * @packageDocumentation
 * @module xt-api-wrapper
 * @license GPL-3.0
 */

// Main client
export { XTClient } from './client';

// Error classes
export { XTError, isXTError } from './errors';

// Types
export type {
  // Configuration
  XTClientConfig,
  // Platform & Content
  Platform,
  ContentType,
  MediaType,
  // Response types
  XTResponse,
  MediaData,
  Download,
  Author,
  Engagement,
  ResponseMeta,
  // Merge types
  MergeOptions,
  MergeResponse,
  // Error types
  ErrorCode,
  ErrorResponse,
} from './types';

// Utilities
export {
  // Platform utilities
  SUPPORTED_PLATFORMS,
  detectPlatform,
  isPlatformSupported,
  isValidURL,
  // Download utilities
  findBestQuality,
  findByQuality,
  getAvailableQualities,
  getDownloadsNeedingMerge,
  getDownloadsWithAudio,
  // Formatting utilities
  formatFileSize,
  formatDuration,
  sanitizeFilename,
  // Environment utilities
  isNode,
  isBrowser,
} from './utils';
