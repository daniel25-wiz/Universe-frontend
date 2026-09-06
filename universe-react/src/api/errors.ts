/**
 * Consistent API error type shared by the mock API and the real HTTP client.
 *
 * Components only ever see ApiError instances (or network wrappers around
 * them), so the UI does not depend on mock-specific or HTTP-specific error
 * shapes.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_CURRENT_PASSWORD'
  | 'WEAK_PASSWORD'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export class ApiError extends Error {
  /** HTTP status code when the backend produced the error (0 for network issues). */
  status: number;
  /** Stable machine-readable code, e.g. "EMAIL_TAKEN". */
  code: ApiErrorCode;
  /** Per-field validation messages keyed by field name (when applicable). */
  fieldErrors?: Record<string, string>;

  constructor(options: {
    message: string;
    status?: number;
    code?: ApiErrorCode;
    fieldErrors?: Record<string, string>;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.code = options.code ?? 'UNKNOWN';
    this.fieldErrors = options.fieldErrors;
  }
}

/** Build an ApiError from an unknown throwable (network failure, JSON parse, ...). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError({ message: error.message, code: 'UNKNOWN' });
  }
  return new ApiError({ message: 'Something went wrong. Please try again.', code: 'UNKNOWN' });
}

/** True when the error indicates the session is invalid/expired. */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'UNAUTHORIZED';
}