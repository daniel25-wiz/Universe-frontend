/**
 * Real Auth API — implements the AuthApi contract against the real backend.
 *
 * Mirrors MockAuthApi's interface exactly. When VITE_API_MODE=real, the
 * factory in services/auth.ts swaps this in. The UI never knows the difference.
 *
 * STATUS: this adapter implements the DOCUMENTED contract (docs/API_CONTRACT.md
 * -> Auth). It is NOT yet validated against a live backend — the backend does
 * not exist yet. Google authentication in particular is only exercised against
 * the mock: the real backend must verify the Google ID token server-side.
 *
 * Responses are normalized (see ../normalize) so a backend that answers with
 * snake_case keys, an envelope, or `{ is_new_user: true }` still signs the
 * user in, and a contract-violating payload surfaces as a normal ApiError
 * instead of a crash or a half-written session.
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
import { ApiError } from '../errors';
import { extractTokenPair, httpClient } from './client';
import { sessionStore } from '../session';
import { isRecord, normalizeUser, pick, toBoolean, toNumber, toText, unwrapEnvelope } from '../normalize';

/** Envelopes a backend may wrap a user payload in. */
const USER_ENVELOPE = ['user', 'data', 'account'];

export class RealAuthApi implements AuthApi {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.persist(await httpClient.post<unknown>('/auth/register', data, true));
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.persist(await httpClient.post<unknown>('/auth/login', data, true));
  }

  /**
   * Google sign-in: POST /auth/google with the Google ID token (JWT) obtained
   * from Google Identity Services — see src/lib/googleIdentity.ts. The
   * backend verifies the signature against Google's public keys and answers
   * exactly like login/register (existing accounts link, new emails create +
   * onboard). The frontend does NOT verify the token; it only forwards it.
   */
  async googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    return this.persist(await httpClient.post<unknown>('/auth/google', data, true));
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post<void>('/auth/logout');
    } finally {
      // The local session dies even when the server call fails — the tokens
      // must never outlive an explicit sign-out.
      sessionStore.clear();
    }
  }

  async getCurrentUser(): Promise<User> {
    const raw = await httpClient.get<unknown>('/auth/me');
    return normalizeUser(unwrapEnvelope(isRecord(raw) ? raw : {}, USER_ENVELOPE));
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const raw = await httpClient.post<unknown>('/auth/refresh', { refresh: refreshToken });
    const tokens = extractTokenPair(raw, refreshToken);
    if (!tokens) {
      throw new ApiError({
        message: 'The authentication server did not return a session. Please try again.',
        status: 0,
        code: 'UNKNOWN_ERROR',
      });
    }
    sessionStore.setTokens(tokens);
    const expiresIn = readExpiresIn(raw);
    return expiresIn === null ? tokens : { ...tokens, expiresIn };
  }

  /**
   * Request password reset — POST /auth/forgot-password with email.
   *
   * The backend generates an OTP, stores it securely with expiration, and
   * emails it to the user. The frontend NEVER sees the OTP in production;
   * mock mode returns it in devOtp for testing only.
   *
   * Generic success response prevents email enumeration: same response whether
   * the email exists or not.
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
    const raw = await httpClient.post<unknown>('/auth/forgot-password', data, true);
    const body = isRecord(raw) ? raw : {};
    return {
      message: toText(body.message) ?? 'If an account exists with this email, a verification code has been sent.',
      devOtp: toText(body.devOtp),
    };
  }

  /**
   * Verify password reset OTP — POST /auth/verify-reset-code with email and code.
   *
   * The backend validates the OTP is correct, not expired, and under the
   * rate-limit threshold. Returns verified: true on success.
   */
  async verifyResetCode(data: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> {
    const raw = await httpClient.post<unknown>('/auth/verify-reset-code', data, true);
    const body = isRecord(raw) ? raw : {};
    return {
      message: toText(body.message) ?? 'Verification code confirmed.',
      verified: toBoolean(body.verified) ?? true,
    };
  }

  /**
   * Complete password reset — POST /auth/reset-password with email, code, and new password.
   *
   * The backend validates the OTP is still valid, enforces password strength,
   * updates the password hash, consumes the OTP (single-use), and revokes all
   * existing sessions for security.
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const raw = await httpClient.post<unknown>('/auth/reset-password', data, true);
    const body = isRecord(raw) ? raw : {};
    return {
      message: toText(body.message) ?? 'Password reset successfully. You can now log in with your new password.',
    };
  }

  /**
   * Validate + normalize an auth payload, then persist the session.
   *
   * A payload without a usable token pair fails loudly (the login forms show
   * the message) rather than writing `undefined` into storage.
   */
  private async persist(raw: unknown): Promise<AuthResponse> {
    const body = isRecord(raw) ? raw : {};
    const tokens = extractTokenPair(body);
    if (!tokens) {
      throw new ApiError({
        message: 'The authentication server did not return a session. Please try again.',
        status: 0,
        code: 'UNKNOWN_ERROR',
      });
    }
    sessionStore.setTokens(tokens);

    // SimpleJWT token views return only access/refresh. Custom Django auth
    // views may embed the user, so avoid an extra request when they do.
    let user = normalizeUser(unwrapEnvelope(body, USER_ENVELOPE));
    if (!user.id) user = await this.getCurrentUser();
    if (!user.id) {
      throw new ApiError({
        message: 'Unexpected response from the authentication server.',
        status: 0,
        code: 'UNKNOWN_ERROR',
      });
    }

    const response: AuthResponse = { user, tokens };
    const isNew = pick(body, ['isNewUser', 'isNew']);
    if (isNew !== undefined) response.isNewUser = toBoolean(isNew) === true;
    return response;
  }
}

/** Optional `expiresIn` (seconds) from `{ tokens: {...} }` or a flat body. */
function readExpiresIn(raw: unknown): number | null {
  if (!isRecord(raw)) return null;
  const source = isRecord(raw.tokens) ? raw.tokens : raw;
  return toNumber(pick(source, ['expiresIn', 'expires_in']));
}
