/**
 * Fetchtium API Wrapper - Client Class
 * @module fetchtium-wrapper/client
 */

import type {
  FetchtiumClientConfig,
  FetchtiumResponse,
  MergeOptions,
  MergeResponse,
  ConvertOptions,
  ConvertResponse,
  RequestOptions,
  ErrorResponse,
  RetryConfig,
  CacheConfig,
  RateLimitConfig,
  ErrorCode,
} from './types';
import { FetchtiumError } from './errors';
import { isValidURL, detectPlatform, generateRequestId } from './utils';

/**
 * Get base URL from environment variables
 * Only checks FETCHTIUM_API_URL
 */
function getBaseUrlFromEnv(): string {
  if (typeof process !== 'undefined' && process.env?.FETCHTIUM_API_URL) {
    return process.env.FETCHTIUM_API_URL;
  }
  
  return 'http://localhost:8080';
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  baseUrl: getBaseUrlFromEnv(),
  timeout: 30000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'INTERNAL_ERROR'] as ErrorCode[],
  },
  cache: {
    enabled: false,
    ttl: 300,
    maxSize: 100,
  },
  rateLimit: {
    maxConcurrent: 5,
    queueTimeout: 30000,
    respectServerLimits: true,
  },
} as const;

/**
 * API endpoints
 */
const ENDPOINTS = {
  fetch: '/api/v1/publicservices',
  merge: '/api/v1/youtube/merge',
  convert: '/api/v1/convert',
} as const;

/**
 * FetchtiumClient - Main client class for interacting with Fetchtium API
 *
 * @example
 * ```typescript
 * const client = new FetchtiumClient({
 *   apiKey: 'sk_xxxxx',
 *   baseUrl: 'http://localhost:8080',
 *   timeout: 30000
 * });
 *
 * const result = await client.fetch('https://www.instagram.com/p/ABC123/');
 * console.log(result.data.downloads);
 * ```
 */
export class FetchtiumClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryConfig: Required<RetryConfig>;
  private readonly cacheConfig: Required<CacheConfig>;
  private readonly rateLimitConfig: Required<RateLimitConfig>;
  private cache: Map<string, { data: FetchtiumResponse; timestamp: number; ttl: number }>;
  private activeRequests: number = 0;
  private requestQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
    fn: () => Promise<unknown>;
  }> = [];

  /**
   * Create a new FetchtiumClient instance
   * @param config - Client configuration
   * @throws {FetchtiumError} If API key is not provided
   */
  constructor(config: FetchtiumClientConfig) {
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw FetchtiumError.invalidAPIKey();
    }

    // Validate API key format
    if (!config.apiKey.startsWith('sk-dwa_')) {
      throw new FetchtiumError(
        'UNAUTHORIZED',
        'Invalid API key format. API key must start with "sk-dwa_"',
        { severity: 'high' }
      );
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_CONFIG.baseUrl).replace(/\/$/, '');
    this.timeout = config.timeout || DEFAULT_CONFIG.timeout;
    this.retryConfig = {
      maxRetries: config.retry?.maxRetries ?? DEFAULT_CONFIG.retry.maxRetries,
      retryDelay: config.retry?.retryDelay ?? DEFAULT_CONFIG.retry.retryDelay,
      backoffMultiplier: config.retry?.backoffMultiplier ?? DEFAULT_CONFIG.retry.backoffMultiplier,
      retryableErrors: config.retry?.retryableErrors ?? DEFAULT_CONFIG.retry.retryableErrors,
    };
    this.cacheConfig = {
      enabled: config.cache?.enabled ?? DEFAULT_CONFIG.cache.enabled,
      ttl: config.cache?.ttl ?? DEFAULT_CONFIG.cache.ttl,
      maxSize: config.cache?.maxSize ?? DEFAULT_CONFIG.cache.maxSize,
    };
    this.rateLimitConfig = {
      maxConcurrent: config.rateLimit?.maxConcurrent ?? DEFAULT_CONFIG.rateLimit.maxConcurrent,
      queueTimeout: config.rateLimit?.queueTimeout ?? DEFAULT_CONFIG.rateLimit.queueTimeout,
      respectServerLimits: config.rateLimit?.respectServerLimits ?? DEFAULT_CONFIG.rateLimit.respectServerLimits,
    };
    this.cache = new Map();
  }

  /**
   * Fetch media from a URL
   *
   * @param url - URL to extract media from
   * @returns Promise resolving to FetchtiumResponse with media data
   * @throws {FetchtiumError} On validation, network, or API errors
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
  async fetch(url: string): Promise<FetchtiumResponse> {
    // Validate URL
    this.validateURL(url);

    // Check if platform is supported
    const platform = detectPlatform(url);
    if (!platform) {
      throw new FetchtiumError('UNSUPPORTED_PLATFORM', `URL does not match any supported platform: ${url}`);
    }

    // Check cache first
    const cached = this.getFromCache(url);
    if (cached) {
      return cached;
    }

    // Make API request with rate limiting
    const requestId = generateRequestId();
    const response = await this.executeWithRateLimit(() =>
      this.request<FetchtiumResponse>(ENDPOINTS.fetch, {
        method: 'POST',
        body: JSON.stringify({ url }),
      })
    );

    // Check for error response - backend returns success: false with code and error fields
    if (!response.success) {
      // New format: success: false, code: "ERROR_CODE", error: "message"
      if (response.code) {
        throw new FetchtiumError(
          response.code as ErrorCode,
          response.error || 'Unknown error',
          {
            context: {
              url,
              platform,
              requestId,
            },
          }
        );
      }
      
      // Legacy format: success: false with data.issues array
      const issues = response.data?.issues || [];
      const issueCode = issues[0] || 'API_ERROR';
      
      // Map backend issue codes to our error codes
      const errorCode = this.mapIssueToErrorCode(issueCode);
      throw new FetchtiumError(
        errorCode,
        `Failed to fetch media: ${issues.length > 0 ? issues.join(', ') : 'Unknown error'}`,
        {
          context: {
            url,
            platform,
            requestId,
          },
        }
      );
    }

    // Cache the result
    this.setCache(url, response);

    return response;
  }

  /**
   * Merge YouTube video and audio streams
   *
   * @param options - Merge options including URL, quality, and optional filename
   * @returns Promise resolving to MergeResponse with blob
   * @throws {FetchtiumError} On validation, network, or API errors
   *
   * @example
   * ```typescript
   * const result = await client.merge({
   *   url: 'https://www.youtube.com/watch?v=xxx',
   *   quality: '1080p',
   *   filename: 'my_video'
   * });
   *
   * if (result.success && result.blob) {
   *   const url = URL.createObjectURL(result.blob);
   *   const a = document.createElement('a');
   *   a.href = url;
   *   a.download = result.filename || 'video.mp4';
   *   a.click();
   * }
   * ```
   */
  async merge(options: MergeOptions): Promise<MergeResponse> {
    // Validate URL
    this.validateURL(options.url);

    // Validate it's a YouTube URL
    const platform = detectPlatform(options.url);
    if (platform !== 'youtube') {
      throw new FetchtiumError(
        'UNSUPPORTED_PLATFORM',
        'Merge is only supported for YouTube URLs'
      );
    }

    // Validate quality
    if (!options.quality || typeof options.quality !== 'string') {
      throw new FetchtiumError('BAD_REQUEST', 'Quality parameter is required');
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
        throw new FetchtiumError('INTERNAL_ERROR', `Merge failed: ${errorText}`, { statusCode: response.status });
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

      if (error instanceof FetchtiumError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw FetchtiumError.timeoutError(this.timeout);
      }
      throw FetchtiumError.unknownError(
        error instanceof Error ? error.message : 'Merge failed',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Convert video to audio (MP3/M4A)
   *
   * @param options - Convert options including URL, format, and optional filename
   * @returns Promise resolving to ConvertResponse with audio blob
   * @throws {FetchtiumError} On validation, network, or API errors
   *
   * @example
   * ```typescript
   * const result = await client.convert({
   *   url: 'https://www.youtube.com/watch?v=xxx',
   *   format: 'mp3',
   *   filename: 'my_audio',
   * });
   *
   * if (result.success && result.blob) {
   *   const url = URL.createObjectURL(result.blob);
   *   const a = document.createElement('a');
   *   a.href = url;
   *   a.download = result.filename || 'audio.mp3';
   *   a.click();
   * }
   * ```
   */
  async convert(options: ConvertOptions): Promise<ConvertResponse> {
    // Validate URL
    this.validateURL(options.url);

    // Validate platform supports video
    const platform = detectPlatform(options.url);
    if (!platform) {
      throw new FetchtiumError('UNSUPPORTED_PLATFORM', 'URL does not match any supported platform');
    }

    // Validate format
    const format = options.format || 'mp3';
    if (format !== 'mp3' && format !== 'm4a') {
      throw new FetchtiumError('BAD_REQUEST', 'Format must be "mp3" or "m4a"');
    }

    // Build query params
    const params = new URLSearchParams({
      url: options.url,
      format,
    });

    if (options.filename) {
      params.set('filename', options.filename);
    }

    const convertUrl = `${this.baseUrl}${ENDPOINTS.convert}?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(convertUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new FetchtiumError('INTERNAL_ERROR', `Audio conversion failed: ${errorText}`, { statusCode: response.status });
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let finalFilename = options.filename || `audio_${Date.now()}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          finalFilename = match[1].replace(/['"]/g, '');
        }
      }

      // Get blob
      const blob = await response.blob();

      return {
        success: true,
        blob,
        filename: finalFilename,
        size: blob.size,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof FetchtiumError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw FetchtiumError.timeoutError(this.timeout);
      }
      throw FetchtiumError.unknownError(
        error instanceof Error ? error.message : 'Audio conversion failed',
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
        throw FetchtiumError.timeoutError(this.timeout);
      }

      // Handle fetch errors
      if (error instanceof TypeError) {
        throw FetchtiumError.networkError(error.message, error);
      }

      // Re-throw FetchtiumError
      if (error instanceof FetchtiumError) {
        throw error;
      }

      // Wrap unknown errors
      throw FetchtiumError.unknownError(
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
          throw FetchtiumError.fromAPIError(errorBody.error, status);
        }
        throw new FetchtiumError('BAD_REQUEST', 'Bad request', { statusCode: status });

      case 401:
        throw FetchtiumError.invalidAPIKey();

      case 403:
        if (errorBody?.error) {
          throw FetchtiumError.fromAPIError(errorBody.error, status);
        }
        throw new FetchtiumError('FORBIDDEN', 'Access forbidden - content may be private or age-restricted', { statusCode: status });

      case 404:
        throw new FetchtiumError('CONTENT_NOT_FOUND', 'Content not found', { statusCode: status });

      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw FetchtiumError.rateLimited(retryAfter ? parseInt(retryAfter) : undefined);

      case 500:
      case 502:
      case 503:
      case 504:
        throw FetchtiumError.serverError(
          errorBody?.error?.message || `Server error (${status})`,
          status
        );

      default:
        if (errorBody?.error) {
          throw FetchtiumError.fromAPIError(errorBody.error, status);
        }
        throw FetchtiumError.serverError(`HTTP error ${status}`, status);
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
   * Map backend issue codes to FetchtiumError codes
   * Matches Fetchtium backend error codes
   * @internal
   */
  private mapIssueToErrorCode(issue: string): ErrorCode {
    const issueMap: Record<string, ErrorCode> = {
      // Login/Auth related
      'login_required': 'LOGIN_REQUIRED',
      'checkpoint': 'CHECKPOINT_REQUIRED',
      'cookies_required': 'COOKIE_REQUIRED',
      'no_healthy_cookies': 'COOKIE_REQUIRED',
      'all_cookies_failed': 'COOKIE_REQUIRED',
      
      // Content related
      'no_media': 'NO_MEDIA_FOUND',
      'private': 'PRIVATE_CONTENT',
      'private_or_friends': 'PRIVATE_CONTENT',
      'age_restricted': 'AGE_RESTRICTED',
      'content_removed': 'CONTENT_REMOVED',
      'story_expired': 'STORY_EXPIRED',
      
      // Rate limiting
      'rate_limited': 'RATE_LIMITED',
      
      // URL/Platform
      'invalid_url': 'INVALID_URL',
      'unsupported_platform': 'UNSUPPORTED_PLATFORM',
      
      // Parsing
      'parse_error': 'PARSE_ERROR',
    };
    return issueMap[issue.toLowerCase()] || 'API_ERROR';
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

  /**
   * Validate URL and throw error if invalid
   * @internal
   */
  private validateURL(url: string): void {
    if (!url || typeof url !== 'string') {
      throw FetchtiumError.invalidURL(url);
    }
    if (!isValidURL(url)) {
      throw FetchtiumError.invalidURL(url);
    }
  }

  /**
   * Fetch with automatic retry
   * @param url - URL to extract media from
   * @param retryConfig - Optional retry configuration override
   * @returns Promise resolving to FetchtiumResponse with media data
   * @throws {FetchtiumError} On validation, network, or API errors (after max retries)
   */
  async fetchWithRetry(url: string, retryConfig?: Partial<RetryConfig>): Promise<FetchtiumResponse> {
    this.validateURL(url);
    const config = { ...this.retryConfig, ...retryConfig };
    let lastError: FetchtiumError | undefined;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
      try {
        const result = await this.fetch(url);
        return result;
      } catch (error) {
        if (!(error instanceof FetchtiumError)) {
          throw error;
        }

        lastError = error;

        // Check if error is retryable
        if (!config.retryableErrors.includes(error.code) || attempt >= config.maxRetries) {
          throw error;
        }

        attempt++;

        // Calculate delay with exponential backoff
        const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt - 1);

        // Check for Retry-After header
        if (error.statusCode === 429 && error.context?.retryAfter) {
          const retryAfter = error.context.retryAfter;
          const serverDelay = retryAfter * 1000;
          await this.sleep(Math.max(delay, serverDelay));
        } else {
          await this.sleep(delay);
        }

        // Update error context with retry info
        error.context.retryAttempt = attempt;
        error.context.maxRetries = config.maxRetries;
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Caching System
  // ============================================================================

  private generateCacheKey(url: string): string {
    return `fetch:${url}`;
  }

  private getFromCache(url: string): FetchtiumResponse | null {
    if (!this.cacheConfig.enabled) return null;

    const key = this.generateCacheKey(url);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(url: string, data: FetchtiumResponse): void {
    if (!this.cacheConfig.enabled) return;

    // Check cache size limit
    if (this.cache.size >= this.cacheConfig.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const key = this.generateCacheKey(url);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheConfig.ttl,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxSize,
      enabled: this.cacheConfig.enabled,
    };
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  private async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    // If under limit, execute immediately
    if (this.activeRequests < this.rateLimitConfig.maxConcurrent) {
      this.activeRequests++;
      try {
        return await fn();
      } finally {
        this.activeRequests--;
        this.processQueue();
      }
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(FetchtiumError.timeoutError(this.rateLimitConfig.queueTimeout));
        const index = this.requestQueue.findIndex(item => item.reject === reject);
        if (index !== -1) this.requestQueue.splice(index, 1);
      }, this.rateLimitConfig.queueTimeout);

      this.requestQueue.push({
        resolve: resolve as (value: unknown) => void,
        reject: reject as (error: unknown) => void,
        fn: async () => {
          clearTimeout(timeoutId);
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
      });
    });
  }

  private processQueue(): void {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.rateLimitConfig.maxConcurrent
    ) {
      const item = this.requestQueue.shift();
      if (item) {
        this.activeRequests++;
        item.fn()
          .finally(() => {
            this.activeRequests--;
            this.processQueue();
          })
          .then(item.resolve)
          .catch(item.reject);
      }
    }
  }

  /**
   * Get rate limit stats
   */
  getRateLimitStats(): {
    activeRequests: number;
    queuedRequests: number;
    maxConcurrent: number;
  } {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrent: this.rateLimitConfig.maxConcurrent,
    };
  }

  // ============================================================================
  // Batch Processing
  // ============================================================================

  /**
   * Fetch multiple URLs in batch
   * @param urls - Array of URLs to fetch
   * @param options - Batch processing options
   * @returns Promise resolving to array of BatchResult
   */
  async fetchBatch(
    urls: string[],
    options?: { concurrency?: number; stopOnError?: boolean }
  ): Promise<Array<{
    url: string;
    success: boolean;
    data?: FetchtiumResponse;
    error?: FetchtiumError;
    responseTime?: number;
  }>> {
    const config = {
      concurrency: options?.concurrency || 3,
      stopOnError: options?.stopOnError || false,
    };

    const results: Array<{
      url: string;
      success: boolean;
      data?: FetchtiumResponse;
      error?: FetchtiumError;
      responseTime?: number;
    }> = [];
    const queue = [...urls];
    const active: Promise<void>[] = [];

    const processUrl = async (url: string): Promise<void> => {
      const startTime = Date.now();
      try {
        const data = await this.fetch(url);
        results.push({
          url,
          success: true,
          data,
          responseTime: Date.now() - startTime,
        });
      } catch (error) {
        const result: {
          url: string;
          success: boolean;
          data?: FetchtiumResponse;
          error?: FetchtiumError;
          responseTime?: number;
        } = {
          url,
          success: false,
          error: error instanceof FetchtiumError ? error : undefined,
          responseTime: Date.now() - startTime,
        };
        results.push(result);

        if (config.stopOnError) {
          throw error;
        }
      }
    };

    while (queue.length > 0 || active.length > 0) {
      while (active.length < config.concurrency && queue.length > 0) {
        const url = queue.shift()!;
        const promise = processUrl(url).finally(() => {
          const index = active.indexOf(promise);
          if (index !== -1) active.splice(index, 1);
        });
        active.push(promise);
      }

      if (active.length > 0) {
        await Promise.race(active);
      }
    }

    return results;
  }
}
