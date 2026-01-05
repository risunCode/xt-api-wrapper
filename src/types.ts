/**
 * Fetchtium API Wrapper - Type Definitions
 * @module fetchtium-wrapper/types
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for FetchtiumClient
 */
export interface FetchtiumClientConfig {
  /** API key for authentication (required) */
  apiKey: string;
  /** Base URL for the API (default: 'http://localhost:8080') */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Retry configuration for automatic retry logic */
  retry?: RetryConfig;
  /** Cache configuration for response caching */
  cache?: CacheConfig;
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;
}

/**
 * Retry configuration for automatic retry logic
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Error codes that should trigger a retry (default: retryable errors) */
  retryableErrors?: ErrorCode[];
}

/**
 * Cache configuration for response caching
 */
export interface CacheConfig {
  /** Enable caching (default: false) */
  enabled?: boolean;
  /** Cache time-to-live in seconds (default: 300) */
  ttl?: number;
  /** Maximum number of cache entries (default: 100) */
  maxSize?: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Maximum number of concurrent requests (default: 5) */
  maxConcurrent?: number;
  /** Queue timeout in milliseconds (default: 30000) */
  queueTimeout?: number;
  /** Respect server rate limits via Retry-After header (default: true) */
  respectServerLimits?: boolean;
}

// ============================================================================
// Platform & Content Types
// ============================================================================

/**
 * Supported platforms for media extraction
 * Matches Fetchtium backend supported platforms
 */
export type Platform =
  // Social Media
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  // Content Platforms
  | 'reddit'
  | 'bilibili'
  | 'soundcloud'
  | 'pixiv'
  // Adult Platforms (18+)
  | 'erome'
  | 'eporner'
  | 'rule34video'
  // Generic (fallback for any URL)
  | 'generic';

/**
 * Type of content being extracted
 */
export type ContentType =
  | 'video'
  | 'image'
  | 'audio'
  | 'story'
  | 'reel'
  | 'post'
  | 'carousel';

/**
 * Type of downloadable media
 */
export type MediaType = 'video' | 'image' | 'audio';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Main API response structure
 */
export interface FetchtiumResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Media data extracted from the URL (only when success: true) */
  data?: MediaData;
  /** Response metadata (only when success: true) */
  meta?: ResponseMeta;
  /** Whether the response was served from cache (only when success: true) */
  cached?: boolean;
  /** Error code (only when success: false) */
  code?: ErrorCode;
  /** Error message (only when success: false) */
  error?: string;
}

/**
 * Extracted media data
 */
export interface MediaData {
  /** Platform the content was extracted from */
  platform: Platform;
  /** Type of content */
  contentType: ContentType;
  /** Unique post identifier on the platform */
  id: string;
  /** Title of the content */
  title?: string;
  /** Description or caption */
  description?: string;
  /** Author/creator information */
  author?: Author;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Duration in seconds (for videos/audio) */
  duration?: number;
  /** Available downloads */
  downloads: Download[];
  /** Engagement metrics */
  engagement?: Engagement;
  /** Original URL that was processed */
  url: string;
  /** Source URL (may include query params) */
  sourceUrl?: string;
  /** Timestamp when content was extracted */
  extractedAt?: string;
  /** Whether a cookie was used for extraction */
  usedCookie?: boolean;
  /** Issues/errors encountered during extraction */
  issues?: string[];
}

/**
 * Download option for media
 */
export interface Download {
  /** Index in carousel/gallery (0-based) */
  index?: number;
  /** Type of media */
  type: MediaType;
  /** Quality label (e.g., '1080p', '720p', 'HD', 'SD') */
  quality: string;
  /** Direct download URL */
  url: string;
  /** Thumbnail URL for this specific item */
  thumbnail?: string;
  /** File size in bytes */
  size?: number;
  /** Video/image width in pixels */
  width?: number;
  /** Video/image height in pixels */
  height?: number;
  /** File extension (e.g., 'mp4', 'webm', 'jpg') */
  extension?: string;
  /** File format (e.g., 'mp4', 'webm', 'jpg') */
  format?: string;
  /** MIME type (e.g., 'video/mp4', 'image/jpeg') */
  mimeType?: string;
  /** Whether video needs audio merge (YouTube) */
  needsMerge?: boolean;
  /** Whether video has audio track */
  hasAudio?: boolean;
  /** Whether audio can be extracted/converted from this download */
  canConvertAudio?: boolean;
  /** Display label for UI */
  label?: string;
}

/**
 * Content author/creator information
 */
export interface Author {
  /** Platform-specific user ID */
  id?: string;
  /** Display name */
  name?: string;
  /** Username/handle */
  username?: string;
  /** Profile picture URL */
  avatar?: string;
  /** Whether the account is verified */
  verified?: boolean;
}

/**
 * Engagement metrics for the content
 */
export interface Engagement {
  /** Number of likes/hearts */
  likes?: number;
  /** Number of comments */
  comments?: number;
  /** Number of views */
  views?: number;
  /** Number of shares/retweets */
  shares?: number;
  /** Number of saves/bookmarks */
  saves?: number;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** Time taken to process the request (ms) */
  responseTime: number;
  /** Final resolved URL after redirects */
  resolvedUrl?: string;
  /** Original URL */
  url?: string;
  /** Whether the content is publicly accessible */
  isPublic?: boolean;
  /** Whether a cookie was used */
  usedCookie?: boolean;
}

// ============================================================================
// Merge Types (YouTube)
// ============================================================================

/**
 * Options for YouTube video+audio merge
 */
export interface MergeOptions {
  /** YouTube video URL */
  url: string;
  /** Desired quality (e.g., '1080p', '720p', '480p', '360p') */
  quality: string;
  /** Optional output filename (without extension) */
  filename?: string;
}

/**
 * Response from merge endpoint
 */
export interface MergeResponse {
  /** Whether the merge was successful */
  success: boolean;
  /** Merged video blob */
  blob?: Blob;
  /** Suggested filename */
  filename?: string;
  /** File size in bytes */
  size?: number;
  /** Error message (if failed) */
  error?: string;
}

// ============================================================================
// Audio Convert Types
// ============================================================================

/**
 * Options for audio conversion
 */
export interface ConvertOptions {
  /** Video URL to extract audio from */
  url: string;
  /** Output format: 'mp3' or 'm4a' */
  format?: 'mp3' | 'm4a';
  /** Optional output filename (without extension) */
  filename?: string;
}

/**
 * Response from convert endpoint
 */
export interface ConvertResponse {
  /** Whether the conversion was successful */
  success: boolean;
  /** Converted audio blob */
  blob?: Blob;
  /** Suggested filename */
  filename?: string;
  /** File size in bytes */
  size?: number;
  /** Error message (if failed) */
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes returned by the API
 * Matches Fetchtium backend error codes
 */
export type ErrorCode =
  | 'INVALID_URL'
  | 'UNSUPPORTED_PLATFORM'
  | 'PLATFORM_DISABLED'
  | 'PRIVATE_CONTENT'
  | 'COOKIE_REQUIRED'
  | 'COOKIE_EXPIRED'
  | 'CONTENT_NOT_FOUND'
  | 'NO_MEDIA_FOUND'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'PARSE_ERROR'
  | 'CHECKPOINT_REQUIRED'
  | 'SCRAPE_ERROR'
  | 'LOGIN_REQUIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'NO_MEDIA'
  | 'STORY_EXPIRED'
  | 'AGE_RESTRICTED'
  | 'CONTENT_REMOVED'
  | 'MAINTENANCE'
  | 'INTERNAL_ERROR';

/**
 * Error response structure from API
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is a successful FetchtiumResponse
 */
export function isFetchtiumResponse(response: unknown): response is FetchtiumResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as FetchtiumResponse).success === true
  );
}

/**
 * Type guard to check if response is an ErrorResponse
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ErrorResponse).success === false &&
    'error' in response
  );
}

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Raw API response (before processing)
 */
export type RawAPIResponse = FetchtiumResponse | ErrorResponse;

/**
 * Request options for internal use
 */
export interface RequestOptions {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}
