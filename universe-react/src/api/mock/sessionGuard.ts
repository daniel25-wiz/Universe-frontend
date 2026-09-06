/**
 * Server-side session guard for the mock API.
 *
 * Every protected mock endpoint resolves the caller through requireSession(),
 * which behaves like real backend middleware:
 *
 *  1. Reads the Bearer (access) token from the session store.
 *  2. Looks the token up by its SHA-256 hash — raw tokens are never stored.
 *  3. Enforces access-token expiry (401 when expired).
 *  4. Verifies the user still exists and is active (401/403 otherwise).
 *
 * This is the single choke point that makes "user A can never read or mutate
 * user B's data" true at the API layer — components cannot bypass it because
 * they never touch the database directly.
 */
import { mockDb } from './mockDatabase';
import type { MockSession, StoredUser } from './mockDatabase';
import { ApiError } from '../errors';
import { sessionStore } from '../session';
import { sha256Hex } from './security';

export interface AuthContext {
  user: StoredUser;
  session: MockSession;
}

function unauthorized(message: string): ApiError {
  return new ApiError({ message, status: 401, code: 'UNAUTHORIZED' });
}

/** Require a valid, unexpired session. Throws ApiError(401/403) otherwise. */
export async function requireSession(): Promise<AuthContext> {
  const token = sessionStore.getAccessToken();
  if (!token) {
    throw unauthorized('Not authenticated. Please log in.');
  }
  const tokenHash = await sha256Hex(token);
  const session = mockDb.query('sessions', (s) => s.accessTokenHash === tokenHash)[0];
  if (!session) {
    throw unauthorized('Session expired. Please log in again.');
  }
  if (session.accessExpiresAt <= Date.now()) {
    throw unauthorized('Session expired. Please log in again.');
  }
  const user = mockDb.findById('users', session.userId);
  if (!user) {
    throw unauthorized('This account no longer exists.');
  }
  if (user.status !== 'active') {
    throw new ApiError({
      message: 'This account has been suspended.',
      status: 403,
      code: 'FORBIDDEN',
    });
  }
  return { user, session };
}

/**
 * Non-throwing variant for endpoints that are public but behave differently
 * for a signed-in user (e.g. product listings). Returns null when anonymous.
 */
export async function getSessionUserSafe(): Promise<StoredUser | null> {
  try {
    return (await requireSession()).user;
  } catch {
    return null;
  }
}
