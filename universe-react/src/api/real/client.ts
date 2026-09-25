/** Django REST Framework transport used by every real API service. */
import { apiConfig } from '../config';
import { ApiError, type ApiErrorCode } from '../errors';
import { logApi } from '../logger';
import { sessionStore } from '../session';
import { camelizeDeep, camelizeKey, isRecord, toText } from '../normalize';

function snakeizeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeizeDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeizeDeep);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [snakeizeKey(key), snakeizeDeep(entry)]));
}

export interface HttpClientOptions {
  method: string;
  path: string;
  body?: unknown;
  /** Skip the default JSON/auth headers (e.g. for FormData). */
  rawBody?: boolean;
  /** Bypass auth header for public endpoints. */
  skipAuth?: boolean;
}

/** Endpoints whose own 401s must NOT trigger a refresh attempt. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/google', '/auth/refresh'];

/**
 * Single-flight refresh: concurrent 401s share one refresh request so parallel
 * queries never rotate the refresh token against each other.
 */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Extract the rotated token pair from a refresh response, accepting the
 * documented token aliases plus the standard SimpleJWT `access`/`refresh`
 * names. A refresh response may omit a rotated refresh token, in which case
 * the existing one is retained.
 */
export function extractTokenPair(
  raw: unknown,
  fallbackRefreshToken?: string | null,
): { accessToken: string; refreshToken: string } | null {
  if (!isRecord(raw)) return null;
  const source = isRecord(raw.tokens) ? raw.tokens : raw;
  const accessToken = toText(source.accessToken)
    ?? toText(source.access_token)
    ?? toText(source.access)
    ?? toText(source.token);
  const refreshToken = toText(source.refreshToken)
    ?? toText(source.refresh_token)
    ?? toText(source.refresh)
    ?? toText(fallbackRefreshToken);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

async function tryRefreshOnce(baseUrl: string): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = sessionStore.getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken, refreshToken }),
        });
        if (!res.ok) return false;
        const data: unknown = await res.json().catch(() => null);
        const tokens = extractTokenPair(data, refreshToken);
        if (!tokens) return false;
        sessionStore.setTokens(tokens);
        return true;
      } catch {
        return false;
      } finally {
        // Reset after the microtask queue drains so retries work later.
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}


/* --------------------------- Error normalization -------------------------- */

/** First human-readable string inside a value that may be nested/arrayed. */
function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = firstMessage(entry);
      if (text) return text;
    }
    return undefined;
  }
  if (isRecord(value)) {
    return firstMessage(value.message) ?? firstMessage(value.detail) ?? firstMessage(value.error);
  }
  return undefined;
}

/**
 * Build `fieldErrors` from the contract shape (`{ fieldErrors: {...} }`) or
 * from Django REST Framework's `{ field: ["message"] }` body, so the forms
 * (which render `error.fieldErrors`) highlight the right inputs either way.
 * Non-field errors are exposed as `_form`, which SignupForm already looks for.
 *
 * Keys are camelized so DRF's `non_field_errors` lands on the same keys the
 * frontend types use.
 */
function collectFieldErrors(data: Record<string, unknown>): Record<string, string> | undefined {
  const reserved = new Set(['message', 'detail', 'code', 'errorCode', 'errors', 'fieldErrors', 'nonFieldErrors']);
  const out: Record<string, string> = {};

  const explicit = data.fieldErrors ?? data.errors;
  if (isRecord(explicit)) {
    for (const [key, value] of Object.entries(explicit)) {
      const text = firstMessage(value);
      if (text) out[camelizeKey(key)] = text;
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (reserved.has(key)) continue;
    if (!isRecord(value) && !Array.isArray(value)) continue;
    const text = firstMessage(value);
    if (text) out[camelizeKey(key)] = text;
  }

  const nonField = firstMessage(data.nonFieldErrors);
  if (nonField) out._form = nonField;

  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Accept only codes the UI understands; otherwise derive one from the HTTP
 * status. A code outside the contract's list is never adopted — the frontend
 * must not act on a code it does not define.
 */
function normalizeCode(
  value: unknown,
  status: number,
  fieldErrors?: Record<string, string>,
): ApiErrorCode {
  const raw = toText(value);
  if (raw && (KNOWN_ERROR_CODES as readonly string[]).includes(raw)) return raw as ApiErrorCode;
  // 409 on an email field is the contract's EMAIL_TAKEN (see API_CONTRACT.md).
  if (status === 409 && fieldErrors && Object.keys(fieldErrors).some((key) => /email/i.test(key))) {
    return 'EMAIL_TAKEN';
  }
  return codeFromStatus(status);
}

/** Every code in the ApiErrorCode union — used to validate backend responses. */
const KNOWN_ERROR_CODES: ApiErrorCode[] = [
  'VALIDATION_ERROR',
  'EMAIL_TAKEN',
  'INVALID_CREDENTIALS',
  'INVALID_CURRENT_PASSWORD',
  'WEAK_PASSWORD',
  'MARKETPLACE_LIMIT_REACHED',
  'WORKSHOP_LIMIT_REACHED',
  'RATE_LIMITED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'SERVER_ERROR',
  'NETWORK_ERROR',
  'TIMEOUT',
  'UNKNOWN_ERROR',
];

/**
 * Fallback status -> code mapping used when the backend sends no recognizable
 * `code`. Deliberately conservative: statuses we cannot classify become
 * UNKNOWN_ERROR instead of a misleading specific code.
 */
export function codeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    // Backends that answer 400 for validation (instead of 422) must still
    // surface per-field messages in the forms.
    case 400: return 'VALIDATION_ERROR';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 408: return 'TIMEOUT';
    case 422: return 'VALIDATION_ERROR';
    case 429: return 'RATE_LIMITED';
    default: return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR';
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let rawBody: unknown;
  try {
    rawBody = await res.json();
  } catch {
    /* non-JSON error body — fall through to the status-based error */
  }

  if (isRecord(rawBody)) {
    // Camelize once so `field_errors`, `non_field_errors` and `error_code`
    // style backends land on the same keys the contract uses.
    const data = camelizeDeep<Record<string, unknown>>(rawBody);
    const fieldErrors = collectFieldErrors(data);
    const message =
      firstMessage(data.message)
      ?? firstMessage(data.detail)
      ?? firstMessage(data.error)
      ?? (fieldErrors ? Object.values(fieldErrors)[0] : undefined)
      ?? `Request failed (${res.status}).`;
    return new ApiError({
      message,
      status: res.status,
      code: normalizeCode(data.code ?? data.errorCode, res.status, fieldErrors),
      backendCode: toText(data.code ?? data.errorCode) ?? undefined,
      fieldErrors,
    });
  }

  return new ApiError({
    message: `Request failed (${res.status}).`,
    status: res.status,
    code: codeFromStatus(res.status),
  });
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
  }

  async request<T>(options: HttpClientOptions): Promise<T> {
    const { method, path, body, rawBody, skipAuth } = options;
    logApi(method, path);

    const buildInit = (): RequestInit => {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (!rawBody) headers['Content-Type'] = 'application/json';
      const csrfToken = readCookie('csrftoken');
      if (csrfToken && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        headers['X-CSRFToken'] = csrfToken;
      }
      if (!skipAuth) {
        const token = sessionStore.getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
      const init: RequestInit = { method, headers, credentials: 'include' };
      if (body !== undefined) {
        init.body = rawBody ? (body as BodyInit) : JSON.stringify(snakeizeDeep(body));
      }
      return init;
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, buildInit());
    } catch {
      throw new ApiError({
        message: 'Network error. Please check your connection.',
        status: 0,
        code: 'NETWORK_ERROR',
      });
    }

    // SECURITY: on 401, try ONE silent refresh (single-flight) and retry the
    // original request with the rotated access token. Auth endpoints exclude
    // themselves so a failed login can never cascade into a refresh loop.
    if (res.status === 401 && !skipAuth && !AUTH_ENDPOINTS.some((p) => path.startsWith(p))) {
      const refreshed = await tryRefreshOnce(this.baseUrl);
      if (refreshed) {
        try {
          res = await fetch(`${this.baseUrl}${path}`, buildInit());
        } catch {
          throw new ApiError({ message: 'Network error. Please check your connection.', status: 0, code: 'NETWORK_ERROR' });
        }
      } else {
        // Refresh failed — the session is truly dead; drop stale tokens.
        sessionStore.clear();
      }
    }

    if (!res.ok) {
      throw await parseError(res);
    }

    if (res.status === 204) return undefined as T;

    try {
      // Key normalization happens ONCE here, so every Real*Api implementation
      // receives the camelCase contract shape even when the backend answers
      // with `featured_in_marketplace`, `sale_price` or `created_at` keys.
      return camelizeDeep<T>(await res.json());
    } catch {
      return undefined as T;
    }
  }

  /**
   * Multipart/form-data upload. SEPARATE from the JSON request family on
   * purpose: uploads carry FormData (no Content-Type header — the browser
   * sets the multipart boundary) and their success is defined ONLY by the
   * backend response parsed here. A local preview rendering is never proof
   * that an upload succeeded.
   */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    logApi('POST', path);
    const buildInit = (): RequestInit => {
      const headers: Record<string, string> = { Accept: 'application/json' };
      const token = sessionStore.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const csrfToken = readCookie('csrftoken');
      if (csrfToken) headers['X-CSRFToken'] = csrfToken;
      return { method: 'POST', headers, body: formData, credentials: 'include' };
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, buildInit());
    } catch {
      throw new ApiError({ message: 'Network error. Please check your connection.', status: 0, code: 'NETWORK_ERROR' });
    }

    if (res.status === 401 && sessionStore.getAccessToken()) {
      const refreshed = await tryRefreshOnce(this.baseUrl);
      if (refreshed) {
        try {
          res = await fetch(`${this.baseUrl}${path}`, buildInit());
        } catch {
          throw new ApiError({ message: 'Network error. Please check your connection.', status: 0, code: 'NETWORK_ERROR' });
        }
      } else {
        sessionStore.clear();
      }
    }

    if (!res.ok) throw await parseError(res);
    if (res.status === 204) return undefined as T;
    try {
      return camelizeDeep<T>(await res.json());
    } catch {
      return undefined as T;
    }
  }

  get<T>(path: string, skipAuth = false): Promise<T> {
    return this.request<T>({ method: 'GET', path, skipAuth });
  }

  post<T>(path: string, body?: unknown, skipAuth = false): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, skipAuth });
  }

  patch<T>(path: string, body?: unknown, skipAuth = false): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, skipAuth });
  }

  delete<T>(path: string, body?: unknown, skipAuth = false): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, body, skipAuth });
  }
}

/** Shared instance — use this unless you need a custom-configured client. */
export const httpClient = new HttpClient();

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}
