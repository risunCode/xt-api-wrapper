/**
 * Fetchtium API Wrapper
 * TypeScript wrapper for Fetchtium social media downloader
 *
 * @packageDocumentation
 * @module fetchtium-wrapper
 * @license GPL-3.0
 */

// Main client
export { FetchtiumClient } from './client';

// Error classes
export { FetchtiumError, isFetchtiumError } from './errors';

// Types
export type {
  // Configuration
  FetchtiumClientConfig,
  // Platform & Content
  Platform,
  ContentType,
  MediaType,
  // Response types
  FetchtiumResponse,
  MediaData,
  Download,
  Author,
  Engagement,
  ResponseMeta,
  // Merge types
  MergeOptions,
  MergeResponse,
  // Convert types
  ConvertOptions,
  ConvertResponse,
  // Error types
  ErrorCode,
  ErrorResponse,
  // Type guards
  isFetchtiumResponse,
  isErrorResponse,
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
