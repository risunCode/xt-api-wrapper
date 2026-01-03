/**
 * XT-API Wrapper - Error Classes
 * @module xt-api-wrapper/errors
 */

import type { ErrorCode } from './types';

/**
 * Custom error class for XT-API errors
 * Provides structured error information with error codes
 */
export class XTError extends Error {
  /** Error code for programmatic handling */
  public readonly code: ErrorCode;
  /** HTTP status code (if applicable) */
  public readonly statusCode?: number;
  /** Original error (if wrapped) */
  public override readonly cause?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { statusCode?: number; cause?: Error }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'XTError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, XTError);
    }
  }

  /**
   * Create error from API error response
   */
  static fromAPIError(error: { code: ErrorCode; message: string }, statusCode?: number): XTError {
    return new XTError(error.code, error.message, { statusCode });
  }

  /**
   * Create network error
   */
  static networkError(message: string, cause?: Error): XTError {
    return new XTError('NETWORK_ERROR', message, { cause });
  }

  /**
   * Create timeout error
   */
  static timeoutError(timeout: number): XTError {
    return new XTError('TIMEOUT', `Request timed out after ${timeout}ms`);
  }

  /**
   * Create invalid URL error
   */
  static invalidURL(url: string): XTError {
    return new XTError('INVALID_URL', `Invalid or unsupported URL: ${url}`);
  }

  /**
   * Create invalid API key error
   */
  static invalidAPIKey(): XTError {
    return new XTError('INVALID_API_KEY', 'Invalid or missing API key', { statusCode: 401 });
  }

  /**
   * Create rate limit error
   */
  static rateLimited(retryAfter?: number): XTError {
    const message = retryAfter
      ? `Rate limited. Retry after ${retryAfter} seconds`
      : 'Rate limited. Please try again later';
    return new XTError('RATE_LIMITED', message, { statusCode: 429 });
  }

  /**
   * Create server error
   */
  static serverError(message: string, statusCode: number): XTError {
    return new XTError('SERVER_ERROR', message, { statusCode });
  }

  /**
   * Create unknown error
   */
  static unknownError(message: string, cause?: Error): XTError {
    return new XTError('UNKNOWN_ERROR', message, { cause });
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'SERVER_ERROR'].includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      PRIVATE_CONTENT: 'This content is private and cannot be accessed',
      LOGIN_REQUIRED: 'Login is required to access this content',
      RATE_LIMITED: 'Too many requests. Please try again later',
      NO_MEDIA: 'No downloadable media found in this URL',
      CONTENT_REMOVED: 'This content has been removed or is no longer available',
      NETWORK_ERROR: 'Network error. Please check your connection',
      TIMEOUT: 'Request timed out. Please try again',
      INVALID_URL: 'The provided URL is invalid or not supported',
      UNSUPPORTED_PLATFORM: 'This platform is not supported',
      INVALID_API_KEY: 'Invalid API key. Please check your credentials',
      SERVER_ERROR: 'Server error. Please try again later',
      UNKNOWN_ERROR: 'An unexpected error occurred',
    };
    return messages[this.code] || this.message;
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
      stack: this.stack,
    };
  }
}

/**
 * Type guard to check if an error is an XTError
 */
export function isXTError(error: unknown): error is XTError {
  return error instanceof XTError;
}
