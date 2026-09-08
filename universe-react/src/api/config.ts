/**
 * Central API configuration.
 *
 * The active backend implementation is selected here from ONE environment
 * variable. Switching the whole application between the mock API and the real
 * backend is a config-only change — no React component/hook code needs to be
 * edited:
 *
 *   VITE_API_MODE=mock   -> all services resolve to the Mock*Api implementations
 *   VITE_API_MODE=real   -> all services resolve to the HTTP-based implementations
 *
 *   VITE_API_URL           -> base URL used only by the real HTTP client
 *   VITE_MOCK_LATENCY      -> "off" disables the artificial network delay
 *   VITE_GOOGLE_CLIENT_ID  -> Google OAuth client id (real Google sign-in)
 */

export type ApiMode = 'mock' | 'real';

export interface MockLatencyOptions {
  enabled: boolean;
  /** Lower bound of the simulated network delay in ms. */
  min: number;
  /** Upper bound of the simulated network delay in ms. */
  max: number;
}

function parseMode(value: string | undefined): ApiMode {
  return value === 'real' ? 'real' : 'mock';
}

function parseMockLatency(value: string | undefined): MockLatencyOptions {
  if (value === 'off' || value === '0' || value === 'false') {
    return { enabled: false, min: 0, max: 0 };
  }
  // ~300–800ms so loading/error/empty states can be tested realistically.
  return { enabled: true, min: 300, max: 800 };
}

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  mockLatency: MockLatencyOptions;
  /**
   * Google OAuth client id (VITE_GOOGLE_CLIENT_ID). Empty string disables
   * real Google sign-in — the "Continue with Google" button then reports the
   * setup steps through the normal error UI instead of faking an account.
   */
  googleClientId: string;
}

export const apiConfig: ApiConfig = {
  mode: parseMode(import.meta.env.VITE_API_MODE as string | undefined),
  baseUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? 'http://localhost:8000/api',
  mockLatency: parseMockLatency(import.meta.env.VITE_MOCK_LATENCY as string | undefined),
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? '',
};

/** True when the real HTTP client stack is active. */
export const isRealApi = apiConfig.mode === 'real';