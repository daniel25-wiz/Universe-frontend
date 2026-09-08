/**
 * Centralized HTTP client for the REAL backend.
 *
 * All real API implementations delegate to this client so that base URL,
 * headers, auth tokens, and error handling live in ONE place. Components
 * never call fetch() directly.
 *
 * When VITE_API_MODE=real, the service factories (auth.ts, products.ts, users.ts)
 * swap in these implementations, which talk to the real backend through here.
 */
import { apiConfig } from '../config';
import { ApiError, type ApiErrorCode } from '../errors';
import { logApi } from '../logger';
import { sessionStore } from '../session';

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

async function tryRefreshOnce(baseUrl: string): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = sessionStore.getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        sessionStore.setTokens(data);
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

async function parseError(res: Response): Promise<ApiError> {
  try {
    const data = await res.json();
    if (data && typeof data === 'object') {
      return new ApiError({
        message: data.message ?? data.detail ?? 'Request failed.',
        status: res.status,
        code: data.code ?? codeFromStatus(res.status),
        fieldErrors: data.fieldErrors ?? data.errors ?? undefined,
      });
    }
  } catch {
    /* non-JSON error body */
  }
  return new ApiError({
    message: `Request failed (${res.status}).`,
    status: res.status,
    code: codeFromStatus(res.status),
  });
}

function codeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'VALIDATION_ERROR';
    case 429: return 'RATE_LIMITED';
    case 408: return 'TIMEOUT';
    case 500: return 'SERVER_ERROR';
    default: return 'UNKNOWN';
  }
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
      const headers: Record<string, string> = {};
      if (!rawBody) headers['Content-Type'] = 'application/json';
      if (!skipAuth) {
        const token = sessionStore.getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
      const init: RequestInit = { method, headers };
      if (body !== undefined) {
        init.body = rawBody ? (body as BodyInit) : JSON.stringify(body);
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
      return (await res.json()) as T;
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
