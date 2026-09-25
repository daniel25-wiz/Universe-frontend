/**
 * Consistent API error type shared by the mock API and the real HTTP client.
 *
 * Components only ever see ApiError instances, so the UI does not depend on
 * mock-specific or HTTP-specific error shapes.
 *
 * Error-code rules (see docs/API_CONTRACT.md -> "Error format"):
 * - The codes below are the ONLY values the frontend understands. A backend
 *   code outside this list is NEVER guessed or mapped onto a "similar" one —
 *   it falls back to UNKNOWN_ERROR so the UI cannot act on a misleading code.
 * - UNKNOWN_ERROR is the explicit "cannot safely classify this error" bucket
 *   (unrecognized backend code, unparseable body, non-HTTP failure).
 * - MARKETPLACE_LIMIT_REACHED is part of the frontend contract (the workshop
 *   UI surfaces it verbatim when the 2-listing cap is hit).
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_CURRENT_PASSWORD'
  | 'WEAK_PASSWORD'
  /** Seller already features MARKETPLACE_LISTING_LIMIT active products. */
  | 'MARKETPLACE_LIMIT_REACHED'
  /** Seller already holds WORKSHOP_PRODUCT_LIMIT products (active + drafts). */
  | 'WORKSHOP_LIMIT_REACHED'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  /** The backend error could not be safely classified. */
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  /** HTTP status code when the backend produced the error (0 for network issues). */
  status: number;
  /** Stable machine-readable code, e.g. "EMAIL_TAKEN". */
  code: ApiErrorCode;
  /** Backend code as received, retained for logging even when unrecognized. */
  backendCode?: string;
  /** Per-field validation messages keyed by field name (when applicable). */
  fieldErrors?: Record<string, string>;

  constructor(options: {
    message: string;
    status?: number;
    code?: ApiErrorCode;
    backendCode?: string;
    fieldErrors?: Record<string, string>;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.backendCode = options.backendCode;
    this.fieldErrors = options.fieldErrors;
  }
}

/** Build an ApiError from an unknown throwable (network failure, JSON parse, ...). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError({ message: error.message, code: 'UNKNOWN_ERROR' });
  }
  return new ApiError({ message: 'Something went wrong. Please try again.', code: 'UNKNOWN_ERROR' });
}

/** True when the error indicates the session is invalid/expired. */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'UNAUTHORIZED';
}
