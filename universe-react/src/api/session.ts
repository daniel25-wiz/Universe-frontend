/**
 * Client-side session/token store.
 *
 * This is the ONLY place the UI-adjacent code (mainly the hooks) persists the
 * session. It belongs to the API layer so that neither React components nor
 * localStorage are coupled together directly:
 *
 *   React component -> hook -> auth service -> sessionStore
 *
 * Security notes:
 * - "Remember me" decides where tokens live. Remembered sessions persist in
 *   localStorage; non-remembered sessions live in sessionStorage so they die
 *   with the tab — a real-world session-scoping measure.
 * - Tokens are opaque random values; the mock backend only ever stores their
 *   SHA-256 hashes server-side.
 */

const ACCESS_TOKEN_KEY = 'universe.access_token';
const REFRESH_TOKEN_KEY = 'universe.refresh_token';

export type TokenPersistMode = 'local' | 'session';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

function readFirst(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeToken(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    /* storage full/blocked — token simply won't persist */
  }
}

function removeToken(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const sessionStore = {
  getAccessToken(): string | null {
    return readFirst(window.localStorage, ACCESS_TOKEN_KEY) ?? readFirst(window.sessionStorage, ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return readFirst(window.localStorage, REFRESH_TOKEN_KEY) ?? readFirst(window.sessionStorage, REFRESH_TOKEN_KEY);
  },

  hasTokens(): boolean {
    return Boolean(this.getAccessToken());
  },

  /**
   * Store a token pair. `persist: 'local'` keeps the session across browser
   * restarts (remember me), `'session'` scopes it to the current tab. Any
   * stale copy in the other storage is removed so exactly one authoritative
   * copy exists.
   */
  setTokens(tokens: StoredTokens, persist: TokenPersistMode = 'local'): void {
    const keep = persist === 'local' ? window.localStorage : window.sessionStorage;
    const drop = persist === 'local' ? window.sessionStorage : window.localStorage;
    writeToken(keep, ACCESS_TOKEN_KEY, tokens.accessToken);
    writeToken(keep, REFRESH_TOKEN_KEY, tokens.refreshToken);
    removeToken(drop, ACCESS_TOKEN_KEY);
    removeToken(drop, REFRESH_TOKEN_KEY);
  },

  /** Where the current access token lives ('local' when not signed in). */
  currentPersistMode(): TokenPersistMode {
    if (readFirst(window.localStorage, ACCESS_TOKEN_KEY)) return 'local';
    if (readFirst(window.sessionStorage, ACCESS_TOKEN_KEY)) return 'session';
    return 'local';
  },

  clear(): void {
    removeToken(window.localStorage, ACCESS_TOKEN_KEY);
    removeToken(window.localStorage, REFRESH_TOKEN_KEY);
    removeToken(window.sessionStorage, ACCESS_TOKEN_KEY);
    removeToken(window.sessionStorage, REFRESH_TOKEN_KEY);
  },
};
