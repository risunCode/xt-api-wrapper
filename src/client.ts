/**
 * XT-API Wrapper - Client Class
 * @module xt-api-wrapper/client
 */

import type {
  XTClientConfig,
  XTResponse,
  MergeOptions,
  MergeResponse,
  RequestOptions,
  ErrorResponse,
} from './types';
import { XTError } from './errors';
import { isValidURL, detectPlatform, generateRequestId } from './utils';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  baseUrl: 'https://api-xtfetch.up.railway.app',
  timeout: 30000,
} as const;

/**
 * API endpoints
 */
const ENDPOINTS = {
  fetch: '/api/v1/publicservices',
  merge: '/api/v1/youtube/merge',
} as const;

/**
 * XTClient - Main client class for interacting with XT-API
 *
 * @example
 * ```typescript
 * const client = new XTClient({
 *   apiKey: 'xt_xxxxx',
 *   baseUrl: 'https://api-xtfetch.up.railway.app',
 *   timeout: 30000
 * });
 *
 * const result = await client.fetch('https://www.instagram.com/p/ABC123/');
 * console.log(result.data.downloads);
 * ```
 */
export class XTClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  /**
   * Create a new XTClient instance
   * @param config - Client configuration
   * @throws {XTError} If API key is not provided
   */
  constructor(config: XTClientConfig) {
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw XTError.invalidAPIKey();
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_CONFIG.baseUrl).replace(/\/$/, '');
    this.timeout = config.timeout || DEFAULT_CONFIG.timeout;
  }

  /**
   * Fetch media from a URL
   *
   * @param url - URL to extract media from
   * @returns Promise resolving to XTResponse with media data
   * @throws {XTError} On validation, network, or API errors
   *
   * @example
   * ```typescript
   * const result = await client.fetch('https://www.instagram.com/p/ABC123/');
   *
   * if (result.success) {
   *   result.data.downloads.forEach(download => {
   *     console.log(`${download.type}: ${download.quality} - ${download.url}`);
   *   });
   * }
   * ```
   */
  async fetch(url: string): Promise<XTResponse> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw XTError.invalidURL(url);
    }

    if (!isValidURL(url)) {
      throw XTError.invalidURL(url);
    }

    // Check if platform is supported
    const platform = detectPlatform(url);
    if (!platform) {
      throw new XTError('UNSUPPORTED_PLATFORM', `URL does not match any supported platform: ${url}`);
    }

    // Make API request
    const response = await this.request<XTResponse>(ENDPOINTS.fetch, {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    // Check for error response - backend returns success: false with data.issues array
    if (!response.success) {
      const issues = response.data?.issues || [];
      const issueCode = issues[0] || 'UNKNOWN_ERROR';
      
      // Map backend issue codes to our error codes
      const errorCode = this.mapIssueToErrorCode(issueCode);
      throw new XTError(errorCode, `Failed to fetch media: ${issues.join(', ') || 'Unknown error'}`);
    }

    return response;
  }

  /**
   * Merge YouTube video and audio streams
   *
   * @param options - Merge options including URL, quality, and optional filename
   * @returns Promise resolving to MergeResponse with download URL or blob
   * @throws {XTError} On validation, network, or API errors
   *
   * @example
   * ```typescript
   * const result = await client.merge({
   *   url: 'https://www.youtube.com/watch?v=xxx',
   *   quality: '1080p',
   *   filename: 'my_video'
   * });
   *
   * if (result.success && result.downloadUrl) {
   *   console.log('Download:', result.downloadUrl);
   * }
   * ```
   */
  async merge(options: MergeOptions): Promise<MergeResponse> {
    // Validate URL
    if (!options.url || typeof options.url !== 'string') {
      throw XTError.invalidURL(options.url);
    }

    if (!isValidURL(options.url)) {
      throw XTError.invalidURL(options.url);
    }

    // Validate it's a YouTube URL
    const platform = detectPlatform(options.url);
    if (platform !== 'youtube') {
      throw new XTError(
        'UNSUPPORTED_PLATFORM',
        'Merge is only supported for YouTube URLs'
      );
    }

    // Validate quality
    if (!options.quality || typeof options.quality !== 'string') {
      throw new XTError('INVALID_URL', 'Quality parameter is required');
    }

    // Build query params for GET endpoint (returns file directly)
    const params = new URLSearchParams({
      url: options.url,
      quality: options.quality,
    });

    if (options.filename) {
      params.set('filename', options.filename);
    }

    // POST endpoint for YouTube merge - returns file directly
    // We need to make the request and return blob/stream
    const mergeUrl = `${this.baseUrl}/api/v1/youtube/merge`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(mergeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          url: options.url,
          quality: options.quality,
          filename: options.filename,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error
        const errorText = await response.text();
        throw new XTError('SERVER_ERROR', `Merge failed: ${errorText}`, { statusCode: response.status });
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let finalFilename = options.filename || 'merged';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          finalFilename = match[1].replace(/['"]/g, '');
        }
      }

      // Return blob for download
      const blob = await response.blob();

      return {
        success: true,
        filename: finalFilename,
        blob: blob,
        size: blob.size,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof XTError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw XTError.timeoutError(this.timeout);
      }
      throw XTError.unknownError(
        error instanceof Error ? error.message : 'Merge failed',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Make an HTTP request to the API
   * @internal
   */
  private async request<T>(endpoint: string, options: Partial<RequestOptions>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestId = generateRequestId();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-Request-ID': requestId,
          ...options.headers,
        },
        body: options.body,
        signal: controller.signal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleHTTPError(response);
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw XTError.timeoutError(this.timeout);
      }

      // Handle fetch errors
      if (error instanceof TypeError) {
        throw XTError.networkError(error.message, error);
      }

      // Re-throw XTError
      if (error instanceof XTError) {
        throw error;
      }

      // Wrap unknown errors
      throw XTError.unknownError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Handle HTTP error responses
   * @internal
   */
  private async handleHTTPError(response: Response): Promise<never> {
    const status = response.status;

    // Try to parse error body
    let errorBody: ErrorResponse | null = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        if (errorBody?.error) {
          throw XTError.fromAPIError(errorBody.error, status);
        }
        throw new XTError('INVALID_URL', 'Bad request', { statusCode: status });

      case 401:
        throw XTError.invalidAPIKey();

      case 403:
        if (errorBody?.error) {
          throw XTError.fromAPIError(errorBody.error, status);
        }
        throw new XTError('PRIVATE_CONTENT', 'Access forbidden', { statusCode: status });

      case 404:
        throw new XTError('CONTENT_REMOVED', 'Content not found', { statusCode: status });

      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw XTError.rateLimited(retryAfter ? parseInt(retryAfter) : undefined);

      case 500:
      case 502:
      case 503:
      case 504:
        throw XTError.serverError(
          errorBody?.error?.message || `Server error (${status})`,
          status
        );

      default:
        if (errorBody?.error) {
          throw XTError.fromAPIError(errorBody.error, status);
        }
        throw XTError.serverError(`HTTP error ${status}`, status);
    }
  }

  /**
   * Get the configured base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the configured timeout
   */
  getTimeout(): number {
    return this.timeout;
  }

  /**
   * Check if the client is configured with a valid API key
   * (Does not validate the key with the server)
   */
  hasAPIKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  /**
   * Map backend issue codes to XTError codes
   * @internal
   */
  private mapIssueToErrorCode(issue: string): import('./types').ErrorCode {
    const issueMap: Record<string, import('./types').ErrorCode> = {
      'no_media': 'NO_MEDIA',
      'private_content': 'PRIVATE_CONTENT',
      'login_required': 'LOGIN_REQUIRED',
      'rate_limited': 'RATE_LIMITED',
      'content_removed': 'CONTENT_REMOVED',
      'invalid_url': 'INVALID_URL',
      'unsupported_platform': 'UNSUPPORTED_PLATFORM',
    };
    return issueMap[issue.toLowerCase()] || 'UNKNOWN_ERROR';
  }
}
