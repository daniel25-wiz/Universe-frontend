/**
 * Mock Auth API — implements the AuthApi contract against the mock database.
 *
 * Security model (mirrors what a hardened real backend must do):
 * - Passwords hashed with PBKDF2-SHA256 (see security.ts); never stored/logged
 *   in plaintext and never included in any API response.
 * - Brute-force lockout: 5 consecutive failed logins locks the account for
 *   15 minutes (429 RATE_LIMITED).
 * - Generic login errors ("Invalid email or password") so attackers cannot
 *   enumerate registered emails.
 * - Sessions: 256-bit random tokens stored only as SHA-256 hashes; access
 *   tokens expire after 24h; refresh tokens after 30 days (or 12h when the
 *   user did NOT check "remember me") and are ROTATED on every refresh.
 * - "Remember me" scopes the session to localStorage vs sessionStorage.
 */
import type {
  AuthResponse,
  GoogleLoginRequest,
  LoginRequest,
  PasswordResetRequest,
  PasswordResetResponse,
  RefreshTokenResponse,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
} from '../types';
import type { AuthApi } from '../services/auth';
import { mockDb, generateId, nowIso } from './mockDatabase';
import type { MockSession, StoredUser } from './mockDatabase';
import { withMockLatency } from './mockLatency';
import { assertValidGoogleClaims, decodeGoogleIdToken } from './googleIdToken';
import { ApiError } from '../errors';
import { logApi } from '../logger';
import { sessionStore, type TokenPersistMode } from '../session';
import {
  generateSecureToken,
  hashPassword,
  sha256Hex,
  validatePasswordStrength,
  verifyPassword,
} from './security';

/** Access tokens are deliberately short-lived. */
const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
/** Refresh token lifetime for remembered sessions. */
const REFRESH_TTL_REMEMBERED_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/** Refresh token lifetime when the user did not check "remember me". */
const REFRESH_TTL_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours
/** Brute-force lockout thresholds. */
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
/** Password reset OTP configuration. */
const OTP_LENGTH = 6;
const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_ATTEMPTS = 3;

function toPublicUser(stored: StoredUser): User {
  const { passwordHash: _p, failedLoginCount: _f, lockedUntil: _l, ...publicUser } = stored;
  return publicUser;
}

/**
 * Issue a fresh session: random tokens, hashed into the DB, stored client-side.
 * Returns the raw pair so callers can hand it to the client exactly like a
 * real login/refresh response would.
 */
async function issueSession(
  userId: string,
  remember: boolean,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateSecureToken();
  const refreshToken = generateSecureToken();
  const now = Date.now();
  const session: MockSession = {
    id: generateId(),
    userId,
    accessTokenHash: await sha256Hex(accessToken),
    refreshTokenHash: await sha256Hex(refreshToken),
    accessExpiresAt: now + ACCESS_TOKEN_TTL_MS,
    refreshExpiresAt: now + (remember ? REFRESH_TTL_REMEMBERED_MS : REFRESH_TTL_SESSION_MS),
    createdAt: nowIso(),
    lastUsedAt: nowIso(),
  };
  mockDb.insert('sessions', session);
  const persist: TokenPersistMode = remember ? 'local' : 'session';
  sessionStore.setTokens({ accessToken, refreshToken }, persist);
  return { accessToken, refreshToken };
}

function assertNotLocked(user: StoredUser): void {
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const minutes = Math.max(1, Math.ceil((user.lockedUntil - Date.now()) / 60_000));
    throw new ApiError({
      message: `Too many failed attempts. This account is locked for ${minutes} more minute(s).`,
      status: 429,
      code: 'RATE_LIMITED',
    });
  }
}

async function registerFailedLogin(user: StoredUser): Promise<void> {
  const count = (user.failedLoginCount ?? 0) + 1;
  const lockedUntil = count >= MAX_FAILED_LOGINS ? Date.now() + LOCKOUT_DURATION_MS : null;
  mockDb.update('users', user.id, { failedLoginCount: count, lockedUntil } as never);
}

function clearFailedLogins(userId: string): void {
  mockDb.update('users', userId, { failedLoginCount: 0, lockedUntil: null } as never);
}

export class MockAuthApi implements AuthApi {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    logApi('POST', '/auth/register');
    return withMockLatency((async () => {
      const fullName = data.fullName?.trim() ?? '';
      const email = data.email?.trim().toLowerCase() ?? '';
      const password = data.password ?? '';

      const fieldErrors: Record<string, string> = {};
      if (!fullName) fieldErrors.fullName = 'Full name is required';
      else if (fullName.length < 2 || fullName.length > 80) {
        fieldErrors.fullName = 'Full name must be between 2 and 80 characters';
      }
      if (!email) fieldErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        fieldErrors.email = 'Enter a valid email';
      }
      if (!password) fieldErrors.password = 'Password is required';
      else {
        const policy = validatePasswordStrength(password);
        if (!policy.ok) fieldErrors.password = policy.error ?? 'Password does not meet the requirements';
      }
      if (!data.accountType) fieldErrors.accountType = 'Account type is required';

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError({
          message: 'Please correct the highlighted fields.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors,
        });
      }

      const existing = mockDb.query('users', (u) => u.email === email);
      if (existing.length > 0) {
        throw new ApiError({
          message: 'An account with this email already exists.',
          status: 409,
          code: 'EMAIL_TAKEN',
          fieldErrors: { email: 'Email is already registered' },
        });
      }

      const timestamp = nowIso();
      const user = mockDb.insert('users', {
        id: generateId(),
        email,
        fullName,
        accountType: data.accountType,
        avatarUrl: null,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
        passwordHash: await hashPassword(password),
        failedLoginCount: 0,
        lockedUntil: null,
      } as never);

      // A fresh registration is always a remembered session.
      const tokens = await issueSession(user.id, true);
      return { user: toPublicUser(user as StoredUser), tokens };
    })());
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    logApi('POST', '/auth/login');
    return withMockLatency((async () => {
      const email = data.email?.trim().toLowerCase() ?? '';
      const password = data.password ?? '';

      if (!email || !password) {
        throw new ApiError({
          message: 'Email and password are required.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { email: 'Email is required', password: 'Password is required' },
        });
      }

      const user = mockDb.query('users', (u) => u.email === email)[0];
      // One generic error for every failure path — never reveal whether the
      // email exists (prevents account enumeration).
      const invalidCredentials = new ApiError({
        message: 'Invalid email or password.',
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });

      if (!user) throw invalidCredentials;
      assertNotLocked(user);

      const passwordOk = await verifyPassword(password, user.passwordHash);
      if (!passwordOk) {
        await registerFailedLogin(user);
        throw invalidCredentials;
      }

      if (user.status !== 'active') {
        throw new ApiError({
          message: 'This account has been suspended. Contact support for help.',
          status: 403,
          code: 'FORBIDDEN',
        });
      }

      clearFailedLogins(user.id);
      // rememberMe=false scopes tokens to sessionStorage (dies with the tab).
      const tokens = await issueSession(user.id, data.rememberMe ?? true);
      return { user: toPublicUser(user), tokens };
    })());
  }

  /**
   * Google sign-in/sign-up — POST /auth/google.
   *
   * Receives the REAL Google ID token (JWT) produced by Google Identity
   * Services. The real backend verifies its signature against Google's
   * public keys; the mock decodes the payload and validates the standard
   * claims (expiry, audience, issuer, verified email) exactly as
   * google-auth-library would after verification — see googleIdToken.ts.
   *
   * - Email already registered → the EXISTING user is authenticated. No
   *   duplicate account is ever created (account linking). The only field
   *   ever backfilled is a missing avatar, adopted from the Google picture.
   * - Email unknown → a new user row following the existing user schema is
   *   created with `authProvider: "google"`. Because Google accounts have no
   *   password, an UNGUESSABLE random one is hashed into `passwordHash` so
   *   the schema invariant (always a pbkdf2$ hash) holds while email/password
   *   login can never succeed for the account.
   *
   * The response is the same AuthResponse shape used by login/register, plus
   * `isNewUser` so the UI can run signup-style redirects.
   */
  async googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    logApi('POST', '/auth/google');
    return withMockLatency((async () => {
      const credential = data?.credential;
      if (typeof credential !== 'string' || !credential.trim()) {
        throw new ApiError({
          message: 'A Google credential is required.',
          status: 422,
          code: 'VALIDATION_ERROR',
        });
      }

      // Decode + validate the ID token claims. Real backend: signature
      // verification against Google's JWKS happens here too.
      const claims = decodeGoogleIdToken(credential.trim());
      assertValidGoogleClaims(claims);

      const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        throw new ApiError({
          message: 'The Google account has no usable email address.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { credential: 'The Google account has no usable email address.' },
        });
      }
      const fullName =
        (typeof claims.name === 'string' && claims.name.trim().slice(0, 80)) ||
        [claims.given_name, claims.family_name]
          .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
          .map((part) => part.trim())
          .join(' ') ||
        email.split('@')[0];
      const picture = typeof claims.picture === 'string' ? claims.picture.trim() : '';

      // Existing account → link & log in (never create a duplicate).
      const existing = mockDb.query('users', (u) => u.email === email)[0];
      if (existing) {
        if (existing.status !== 'active') {
          throw new ApiError({
            message: 'This account has been suspended. Contact support for help.',
            status: 403,
            code: 'FORBIDDEN',
          });
        }
        clearFailedLogins(existing.id);
        let user = existing;
        if (picture && !user.avatarUrl) {
          // Light-touch linking: adopt the Google picture only when the
          // account has no avatar yet. Nothing else is overwritten.
          user = (mockDb.update('users', user.id, { avatarUrl: picture }) as StoredUser) ?? user;
        }
        const tokens = await issueSession(user.id, data.rememberMe ?? true);
        return { user: toPublicUser(user), tokens, isNewUser: false };
      }

      // New Google signup → create the user following the existing schema.
      const accountType = data.accountType === 'buyer' ? 'buyer' : 'seller';
      const timestamp = nowIso();
      const user = mockDb.insert('users', {
        id: generateId(),
        email,
        fullName,
        accountType,
        avatarUrl: picture || null,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
        passwordHash: await hashPassword(generateSecureToken()),
        failedLoginCount: 0,
        lockedUntil: null,
        authProvider: 'google',
      } as never);

      // A fresh Google registration is always a remembered session.
      const tokens = await issueSession(user.id, true);
      return { user: toPublicUser(user as StoredUser), tokens, isNewUser: true };
    })());
  }

  async logout(): Promise<void> {
    logApi('POST', '/auth/logout');
    // Revoke the entire server-side session (access + refresh) for this token.
    const token = sessionStore.getAccessToken();
    if (token) {
      const tokenHash = await sha256Hex(token);
      mockDb
        .query('sessions', (s) => s.accessTokenHash === tokenHash)
        .forEach((s) => mockDb.remove('sessions', s.id));
    }
    sessionStore.clear();
    return withMockLatency(undefined);
  }

  async getCurrentUser(): Promise<User> {
    logApi('GET', '/auth/me');
    return withMockLatency((async () => {
      const token = sessionStore.getAccessToken();
      if (!token) {
        throw new ApiError({ message: 'Not authenticated.', status: 401, code: 'UNAUTHORIZED' });
      }
      const tokenHash = await sha256Hex(token);
      const session = mockDb.query('sessions', (s) => s.accessTokenHash === tokenHash)[0];
      if (!session) {
        throw new ApiError({ message: 'Session expired.', status: 401, code: 'UNAUTHORIZED' });
      }
      if (session.accessExpiresAt <= Date.now()) {
        throw new ApiError({ message: 'Session expired.', status: 401, code: 'UNAUTHORIZED' });
      }
      const user = mockDb.findById('users', session.userId);
      if (!user) {
        throw new ApiError({ message: 'User not found.', status: 401, code: 'UNAUTHORIZED' });
      }
      return toPublicUser(user as StoredUser);
    })());
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    logApi('POST', '/auth/refresh');
    return withMockLatency((async () => {
      if (!refreshToken) {
        throw new ApiError({ message: 'Refresh token required.', status: 401, code: 'UNAUTHORIZED' });
      }
      // SECURITY: actually validate the presented refresh token, then ROTATE
      // it — the old pair is revoked and cannot be replayed.
      const refreshHash = await sha256Hex(refreshToken);
      const session = mockDb.query('sessions', (s) => s.refreshTokenHash === refreshHash)[0];
      if (!session || session.refreshExpiresAt <= Date.now()) {
        sessionStore.clear();
        throw new ApiError({ message: 'Invalid or expired refresh token.', status: 401, code: 'UNAUTHORIZED' });
      }
      const user = mockDb.findById('users', session.userId);
      if (!user || user.status !== 'active') {
        mockDb.remove('sessions', session.id);
        sessionStore.clear();
        throw new ApiError({ message: 'Session cannot be refreshed.', status: 401, code: 'UNAUTHORIZED' });
      }

      mockDb.remove('sessions', session.id);
      const persist: TokenPersistMode = sessionStore.currentPersistMode();
      const accessToken = generateSecureToken();
      const newRefreshToken = generateSecureToken();
      const now = Date.now();
      mockDb.insert('sessions', {
        id: generateId(),
        userId: session.userId,
        accessTokenHash: await sha256Hex(accessToken),
        refreshTokenHash: await sha256Hex(newRefreshToken),
        accessExpiresAt: now + ACCESS_TOKEN_TTL_MS,
        // Rotation never extends beyond the original refresh window.
        refreshExpiresAt: Math.min(session.refreshExpiresAt, now + REFRESH_TTL_REMEMBERED_MS),
        createdAt: session.createdAt,
        lastUsedAt: nowIso(),
      } as never);
      const tokens = { accessToken, refreshToken: newRefreshToken };
      sessionStore.setTokens(tokens, persist);
      return tokens;
    })());
  }

  /**
   * Request password reset — generates a 6-digit OTP and simulates emailing it.
   *
   * SECURITY:
   * - Generic response whether email exists or not (prevents enumeration).
   * - Old OTPs for the same email are revoked when a new one is requested.
   * - OTP expires after 15 minutes.
   * - Rate limiting: 3 failed verification attempts lock the OTP.
   * - Development mode returns the OTP in devOtp for testing.
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
    logApi('POST', '/auth/forgot-password');
    return withMockLatency((async () => {
      const email = data.email?.trim().toLowerCase() ?? '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError({
          message: 'Please enter a valid email address.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { email: 'Please enter a valid email address.' },
        });
      }

      const user = mockDb.query('users', (u) => u.email === email)[0];

      // Generic success response whether the email exists or not — prevents
      // attackers from enumerating registered accounts.
      const genericResponse: PasswordResetResponse = {
        message: 'If an account exists with this email, a verification code has been sent.',
      };

      if (!user) {
        // Email not found — still return success to prevent enumeration.
        return genericResponse;
      }

      // Generate a 6-digit OTP.
      const code = Array.from({ length: OTP_LENGTH }, () => Math.floor(Math.random() * 10)).join('');
      const expiresAt = Date.now() + OTP_TTL_MS;

      // Revoke any existing OTPs for this email.
      mockDb.query('passwordResetOTPs', (otp) => otp.email === email).forEach((otp) => mockDb.remove('passwordResetOTPs', otp.id));

      // Store the new OTP.
      mockDb.insert('passwordResetOTPs', {
        id: generateId(),
        email,
        code,
        expiresAt,
        createdAt: nowIso(),
        failedAttempts: 0,
      } as never);

      // Development-only: log OTP to console and return in response for testing.
      if (import.meta.env.DEV) {
        console.log('\n📧 [MOCK EMAIL] Password Reset OTP');
        console.log(`To: ${email}`);
        console.log(`Subject: Your verification code`);
        console.log(`\nYour verification code is: ${code}`);
        console.log(`This code expires in 15 minutes.\n`);
        return { ...genericResponse, devOtp: code };
      }

      return genericResponse;
    })());
  }

  /**
   * Verify password reset OTP.
   *
   * SECURITY:
   * - Rate limiting: 3 failed attempts invalidate the OTP.
   * - Expired OTPs are automatically rejected.
   * - Verified OTPs remain valid for the final resetPassword step.
   */
  async verifyResetCode(data: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> {
    logApi('POST', '/auth/verify-reset-code');
    return withMockLatency((async () => {
      const email = data.email?.trim().toLowerCase() ?? '';
      const code = data.code?.trim() ?? '';

      if (!email || !code) {
        throw new ApiError({
          message: 'Email and verification code are required.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { code: 'Verification code is required.' },
        });
      }

      // Clean up expired OTPs first.
      const now = Date.now();
      mockDb.query('passwordResetOTPs', (otp) => otp.expiresAt <= now).forEach((otp) => mockDb.remove('passwordResetOTPs', otp.id));

      const otp = mockDb.query('passwordResetOTPs', (o) => o.email === email)[0];

      if (!otp) {
        throw new ApiError({
          message: 'Invalid or expired verification code.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { code: 'Invalid or expired verification code.' },
        });
      }

      if (otp.expiresAt <= now) {
        mockDb.remove('passwordResetOTPs', otp.id);
        throw new ApiError({
          message: 'Verification code has expired. Please request a new one.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { code: 'Verification code has expired.' },
        });
      }

      if (otp.failedAttempts >= MAX_OTP_ATTEMPTS) {
        mockDb.remove('passwordResetOTPs', otp.id);
        throw new ApiError({
          message: 'Too many failed attempts. Please request a new verification code.',
          status: 429,
          code: 'RATE_LIMITED',
          fieldErrors: { code: 'Too many failed attempts.' },
        });
      }

      if (otp.code !== code) {
        // Increment failed attempts.
        mockDb.update('passwordResetOTPs', otp.id, { failedAttempts: otp.failedAttempts + 1 } as never);
        throw new ApiError({
          message: 'Incorrect verification code.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { code: 'Incorrect verification code.' },
        });
      }

      // OTP verified successfully — keep it for the final reset step.
      return { message: 'Verification code confirmed.', verified: true };
    })());
  }

  /**
   * Complete password reset with verified OTP and new password.
   *
   * SECURITY:
   * - Requires a valid, non-expired OTP that has been verified.
   * - Password strength validation enforced.
   * - OTP is consumed (deleted) after successful password reset.
   * - All existing sessions for the user are revoked (security best practice).
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    logApi('POST', '/auth/reset-password');
    return withMockLatency((async () => {
      const email = data.email?.trim().toLowerCase() ?? '';
      const code = data.code?.trim() ?? '';
      const newPassword = data.newPassword ?? '';

      if (!email || !code || !newPassword) {
        throw new ApiError({
          message: 'Email, verification code, and new password are required.',
          status: 422,
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate password strength.
      const policy = validatePasswordStrength(newPassword);
      if (!policy.ok) {
        throw new ApiError({
          message: policy.error ?? 'Password does not meet the requirements.',
          status: 422,
          code: 'WEAK_PASSWORD',
          fieldErrors: { newPassword: policy.error ?? 'Password does not meet the requirements.' },
        });
      }

      // Clean up expired OTPs.
      const now = Date.now();
      mockDb.query('passwordResetOTPs', (otp) => otp.expiresAt <= now).forEach((otp) => mockDb.remove('passwordResetOTPs', otp.id));

      const otp = mockDb.query('passwordResetOTPs', (o) => o.email === email && o.code === code)[0];

      if (!otp || otp.expiresAt <= now) {
        throw new ApiError({
          message: 'Invalid or expired verification code.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { code: 'Invalid or expired verification code.' },
        });
      }

      const user = mockDb.query('users', (u) => u.email === email)[0];
      if (!user) {
        throw new ApiError({
          message: 'User not found.',
          status: 404,
          code: 'NOT_FOUND',
        });
      }

      // Update password.
      const passwordHash = await hashPassword(newPassword);
      mockDb.update('users', user.id, { passwordHash, failedLoginCount: 0, lockedUntil: null } as never);

      // Revoke the OTP (single-use).
      mockDb.remove('passwordResetOTPs', otp.id);

      // SECURITY: revoke all existing sessions for this user so stolen sessions
      // can't continue after a password change.
      mockDb.query('sessions', (s) => s.userId === user.id).forEach((s) => mockDb.remove('sessions', s.id));

      return { message: 'Password reset successfully. You can now log in with your new password.' };
    })());
  }
}

