/**
 * XT-API Wrapper - Type Definitions
 * @module xt-api-wrapper/types
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for XTClient
 */
export interface XTClientConfig {
  /** API key for authentication (required) */
  apiKey: string;
  /** Base URL for the API (default: 'https://api-xtfetch.up.railway.app') */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// ============================================================================
// Platform & Content Types
// ============================================================================

/**
 * Supported platforms for media extraction
 * Includes social media, content platforms, and adult platforms (18+)
 */
export type Platform =
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
export interface XTResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Media data extracted from the URL */
  data: MediaData;
  /** Response metadata */
  meta: ResponseMeta;
  /** Whether the response was served from cache */
  cached: boolean;
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
  postId?: string;
  /** Date the content was posted */
  postDate?: string;
  /** Author/creator information */
  author?: Author;
  /** Title of the content */
  title?: string;
  /** Description or caption */
  description?: string;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Original URL that was processed */
  url: string;
  /** Engagement metrics */
  engagement?: Engagement;
  /** Available downloads */
  downloads: Download[];
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
  /** File format (e.g., 'mp4', 'webm', 'jpg') */
  format?: string;
  /** MIME type (e.g., 'video/mp4', 'image/jpeg') */
  mimeType?: string;
  /** Whether video needs audio merge (YouTube) */
  needsMerge?: boolean;
  /** Whether video has audio track */
  hasAudio?: boolean;
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
  /** Download URL for merged video (if using URL mode) */
  downloadUrl?: string;
  /** Filename of the merged video */
  filename?: string;
  /** Blob data of merged video (if using blob mode) */
  blob?: Blob;
  /** File size in bytes */
  size?: number;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes returned by the API
 */
export type ErrorCode =
  | 'PRIVATE_CONTENT'
  | 'LOGIN_REQUIRED'
  | 'RATE_LIMITED'
  | 'NO_MEDIA'
  | 'CONTENT_REMOVED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_URL'
  | 'UNSUPPORTED_PLATFORM'
  | 'INVALID_API_KEY'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

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
// Internal Types
// ============================================================================

/**
 * Raw API response (before processing)
 */
export type RawAPIResponse = XTResponse | ErrorResponse;

/**
 * Request options for internal use
 */
export interface RequestOptions {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}
