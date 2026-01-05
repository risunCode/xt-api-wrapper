/**
 * Fetchtium API Wrapper - Error Classes
 * @module fetchtium-wrapper/errors
 */

import type { ErrorCode } from './types';

/**
 * Error context information
 */
export interface ErrorContext {
  /** URL that caused the error */
  url?: string;
  /** Platform being accessed */
  platform?: string;
  /** Timestamp when error occurred */
  timestamp?: string;
  /** Request ID for tracking */
  requestId?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Retry attempt number */
  retryAttempt?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry-After header value (seconds) */
  retryAfter?: number;
  /** Response time in milliseconds */
  responseTime?: number;
}

/**
 * Custom error class for Fetchtium API errors
 * Provides structured error information with error codes
 */
export class FetchtiumError extends Error {
  /** Error code for programmatic handling */
  public readonly code: ErrorCode;
  /** HTTP status code (if applicable) */
  public readonly statusCode?: number;
  /** Original error (if wrapped) */
  public override readonly cause?: Error;
  /** Error context information */
  public readonly context: ErrorContext;
  /** Error severity level */
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  /** Suggestions for resolving the error */
  public readonly suggestions: string[];

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
      context?: ErrorContext;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      suggestions?: string[];
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'FetchtiumError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;
    this.context = options?.context || {};
    this.severity = options?.severity || 'medium';
    this.suggestions = options?.suggestions || [];

    // Set timestamp if not provided
    if (!this.context.timestamp) {
      this.context.timestamp = new Date().toISOString();
    }

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, FetchtiumError);
    }
  }

  /**
   * Create error from API error response
   */
  static fromAPIError(error: { code: ErrorCode; message: string }, statusCode?: number): FetchtiumError {
    return new FetchtiumError(error.code, error.message, { statusCode });
  }

  /**
   * Create network error
   */
  static networkError(message: string, cause?: Error): FetchtiumError {
    return new FetchtiumError('NETWORK_ERROR', message, {
      cause,
      severity: 'medium',
      suggestions: [
        'Check your internet connection',
        'Verify the server is running',
        'Try again later',
      ],
    });
  }

  /**
   * Create timeout error
   */
  static timeoutError(timeout: number): FetchtiumError {
    return new FetchtiumError('TIMEOUT', `Request timed out after ${timeout}ms`, {
      severity: 'medium',
      suggestions: [
        'Check your internet connection',
        'Try increasing the timeout',
        'The server may be experiencing high load',
      ],
    });
  }

  /**
   * Create invalid URL error
   */
  static invalidURL(url: string): FetchtiumError {
    return new FetchtiumError('INVALID_URL', `Invalid or unsupported URL: ${url}`, {
      context: { url },
      severity: 'low',
      suggestions: [
        'Check the URL format',
        'Ensure the URL is from a supported platform',
        'Supported platforms: Instagram, Facebook, Twitter/X, TikTok, YouTube, Reddit, Bilibili, SoundCloud, Pixiv, Erome, Eporner, Rule34Video',
      ],
    });
  }

  /**
   * Create invalid API key error
   */
  static invalidAPIKey(): FetchtiumError {
    return new FetchtiumError('UNAUTHORIZED', 'Invalid or missing API key', {
      statusCode: 401,
      severity: 'high',
      suggestions: [
        'Check your API key',
        'Ensure the API key is valid and not expired',
        'Contact support if the issue persists',
      ],
    });
  }

  /**
   * Create rate limit error
   */
  static rateLimited(retryAfter?: number): FetchtiumError {
    const message = retryAfter
      ? `Rate limited. Retry after ${retryAfter} seconds`
      : 'Rate limited. Please try again later';
    return new FetchtiumError('RATE_LIMITED', message, {
      statusCode: 429,
      severity: 'medium',
      suggestions: [
        retryAfter ? `Wait ${retryAfter} seconds before retrying` : 'Wait a moment before retrying',
        'Reduce the frequency of your requests',
        'Consider upgrading your API plan for higher limits',
      ],
    });
  }

  /**
   * Create server error
   */
  static serverError(message: string, statusCode: number): FetchtiumError {
    return new FetchtiumError('INTERNAL_ERROR', message, {
      statusCode,
      severity: 'high',
      suggestions: [
        'The server encountered an error',
        'Try again later',
        'Contact support if the issue persists',
      ],
    });
  }

  /**
   * Create unknown error
   */
  static unknownError(message: string, cause?: Error): FetchtiumError {
    return new FetchtiumError('API_ERROR', message, {
      cause,
      severity: 'high',
      suggestions: [
        'An unexpected error occurred',
        'Try again later',
        'Contact support with the error details',
      ],
    });
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'INTERNAL_ERROR'].includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      INVALID_URL: 'The URL you provided is invalid or not supported. Please check the URL and try again.',
      UNSUPPORTED_PLATFORM: 'This platform is not supported.',
      PLATFORM_DISABLED: 'This platform is temporarily unavailable. Please try again later.',
      PRIVATE_CONTENT: 'This content is private and cannot be accessed.',
      COOKIE_REQUIRED: 'This content requires authentication. Please provide valid cookies.',
      COOKIE_EXPIRED: 'Your session has expired. Please refresh your cookies.',
      CONTENT_NOT_FOUND: 'The content you\'re looking for was not found. It may have been deleted or moved.',
      NO_MEDIA_FOUND: 'No downloadable media was found in this content.',
      RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
      NETWORK_ERROR: 'A network error occurred. Please check your connection and try again.',
      TIMEOUT: 'The request timed out. Please try again.',
      API_ERROR: 'An error occurred while processing your request. Please try again.',
      PARSE_ERROR: 'Failed to parse the content. The page format may have changed.',
      CHECKPOINT_REQUIRED: 'Account verification required. Please try with different credentials.',
      SCRAPE_ERROR: 'Failed to extract content. Please try again later.',
      LOGIN_REQUIRED: 'Login is required to access this content.',
      UNAUTHORIZED: 'Authorization is required or failed.',
      FORBIDDEN: 'Access forbidden - content may be private or age-restricted.',
      BAD_REQUEST: 'Invalid request format.',
      NO_MEDIA: 'No downloadable media was found.',
      STORY_EXPIRED: 'The story has expired.',
      AGE_RESTRICTED: 'This content is age-restricted.',
      CONTENT_REMOVED: 'This content has been removed or is no longer available.',
      MAINTENANCE: 'Service is under maintenance. Please try again later.',
      INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
    };
    return messages[this.code] || this.message;
  }

  /**
   * Get error suggestions
   */
  getSuggestions(): string[] {
    if (this.suggestions.length > 0) {
      return this.suggestions;
    }

    const defaultSuggestions: Partial<Record<ErrorCode, string[]>> = {
      LOGIN_REQUIRED: [
        'This content requires authentication',
        'Try providing valid cookies for the platform',
        'Some content may only be accessible to logged-in users',
      ],
      PRIVATE_CONTENT: [
        'This content is private',
        'You may need to be friends with the author',
        'Some content is only accessible to followers',
      ],
      RATE_LIMITED: [
        'Wait a moment before trying again',
        'Reduce the frequency of your requests',
        'Consider upgrading your API plan for higher limits',
      ],
      TIMEOUT: [
        'Check your internet connection',
        'Try again with a longer timeout',
        'The server may be experiencing high load',
      ],
      NETWORK_ERROR: [
        'Check your internet connection',
        'Verify the server is running',
        'Try again later',
      ],
      INVALID_URL: [
        'Check the URL format',
        'Ensure the URL is from a supported platform',
        'Supported platforms: Instagram, Facebook, Twitter/X, TikTok, YouTube, Reddit, Bilibili, SoundCloud, Pixiv, Erome, Eporner, Rule34Video',
      ],
      UNSUPPORTED_PLATFORM: [
        'This platform is not supported',
        'Supported platforms: Instagram, Facebook, Twitter/X, TikTok, YouTube, Reddit, Bilibili, SoundCloud, Pixiv, Erome, Eporner, Rule34Video',
      ],
      COOKIE_REQUIRED: [
        'This content requires authentication',
        'Try providing valid cookies for the platform',
      ],
      COOKIE_EXPIRED: [
        'Your session has expired',
        'Refresh your cookies and try again',
      ],
    };

    return defaultSuggestions[this.code] || [];
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      severity: this.severity,
      context: this.context,
      suggestions: this.suggestions,
      stack: this.stack,
    };
  }
}

/**
 * Type guard to check if an error is a FetchtiumError
 */
export function isFetchtiumError(error: unknown): error is FetchtiumError {
  return error instanceof FetchtiumError;
}
