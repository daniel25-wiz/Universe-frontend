/**
 * Google ID token (JWT) handling for the mock backend.
 *
 * The REAL backend verifies the token's signature against Google's public
 * keys (JWKS) plus the aud/iss/exp claims. The mock cannot verify signatures
 * (it has no Google keys), so it performs the SAME claim validation after
 * decoding the payload — when Django lands, the missing piece inside
 * POST /auth/google is exactly one signature-verification step.
 */
import { apiConfig } from '../config';
import { ApiError } from '../errors';
import type { GoogleIdTokenPayload } from '../types';

/** Small clock-skew allowance, like real token libraries apply. */
const CLOCK_SKEW_SECONDS = 60;

function base64UrlToBytes(segment: string): Uint8Array {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Decode the payload of a Google ID token (JWT) without verifying it. */
export function decodeGoogleIdToken(credential: string): GoogleIdTokenPayload {
  if (credential.length > 5000) {
    throw new ApiError({ message: 'Invalid Google credential.', status: 422, code: 'VALIDATION_ERROR' });
  }
  const parts = credential.split('.');
  if (parts.length !== 3 || parts[1].length === 0) {
    throw new ApiError({
      message: 'Invalid Google credential. Expected a Google ID token.',
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  }
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))) as GoogleIdTokenPayload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Token payload is not an object.');
    }
    return payload;
  } catch {
    throw new ApiError({
      message: 'Invalid Google credential. The token payload could not be decoded.',
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  }
}

/**
 * Validate the standard ID-token claims the way the real backend will after
 * signature verification: expiry, audience, issuer, verified email.
 */
export function assertValidGoogleClaims(payload: GoogleIdTokenPayload): void {
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (typeof payload.exp !== 'number' || payload.exp < nowSeconds - CLOCK_SKEW_SECONDS) {
    throw new ApiError({
      message: 'Your Google session expired. Please try signing in again.',
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  if (apiConfig.googleClientId) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(apiConfig.googleClientId)) {
      throw new ApiError({
        message: 'This Google sign-in is not valid for this application (audience mismatch).',
        status: 401,
        code: 'UNAUTHORIZED',
      });
    }
  }

  const issuer = typeof payload.iss === 'string' ? payload.iss.replace(/\/+$/, '') : '';
  if (issuer !== 'https://accounts.google.com' && issuer !== 'accounts.google.com') {
    throw new ApiError({
      message: 'This Google sign-in did not come from Google (untrusted issuer).',
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  if (payload.email_verified === false) {
    throw new ApiError({
      message: 'Your Google account email is not verified. Verify it at accounts.google.com and try again.',
      status: 403,
      code: 'FORBIDDEN',
    });
  }
}
