/**
 * Real Users API — implements the UsersApi contract against the real backend.
 *
 * Payloads are normalized (see ../normalize) so the seller workspace, the
 * onboarding wizard and the storefront always receive complete camelCase
 * objects, even when the backend answers with snake_case keys or an envelope.
 *
 * 404 HANDLING POLICY: ONLY `getSellerProfile()` treats a 404 as "profile
 * does not exist yet" and resolves to a blank profile (the UI requires a
 * profile object). That rule lives in exactly one place and checks BOTH the
 * status and the NOT_FOUND code — a 404 from any other endpoint, or any other
 * error, is rethrown untouched.
 */
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  PublicSellerProfile,
  SellerProfile,
  UpdateEmailRequest,
  UpdateSellerProfileRequest,
  UpdateUserRequest,
  User,
} from '../types';
import type { UsersApi } from '../services/users';
import { ApiError } from '../errors';
import { httpClient } from './client';
import {
  emptySellerProfile,
  isRecord,
  normalizePublicSellerProfile,
  normalizeSellerProfile,
  normalizeUser,
  unwrapEnvelope,
} from '../normalize';

/** Envelopes a backend may wrap a profile/user payload in. */
const PROFILE_ENVELOPE = ['sellerProfile', 'profile', 'data'];
const PUBLIC_PROFILE_ENVELOPE = ['sellerProfile', 'profile', 'seller', 'data'];
const USER_ENVELOPE = ['user', 'data', 'account'];

export class RealUsersApi implements UsersApi {
  /**
   * PUBLIC seller profile (no session required).
   *
   * 404 POLICY: unlike `getSellerProfile()`, a 404 here is a REAL "no such
   * seller" — it is rethrown untouched so the profile page renders its
   * "seller not found" state instead of an empty profile shell.
   */
  async getPublicSellerProfile(sellerId: string): Promise<PublicSellerProfile> {
    const raw = await httpClient.get<unknown>(
      `/users/${encodeURIComponent(sellerId)}/seller-profile`,
    );
    return normalizePublicSellerProfile(unwrapEnvelope(raw, PUBLIC_PROFILE_ENVELOPE));
  }

  /**
   * Read the seller profile.
   *
   * A seller who has not filled anything in yet may have no row at all. The
   * mock API auto-creates one on first read and the workspace expects a
   * profile object — so a 404 from THIS endpoint resolves to a blank profile
   * and the first PATCH creates the row server-side (PATCH upserts, per the
   * contract).
   *
   * ISOLATION: this conversion applies only to `GET /users/me/seller-profile`.
   * Other 404s (products, storefront, orders...) must NEVER be swallowed into
   * an empty profile — they are rethrown as ApiError(NOT_FOUND).
   */
  async getSellerProfile(): Promise<SellerProfile> {
    try {
      const raw = await httpClient.get<unknown>('/users/me/seller-profile');
      return normalizeSellerProfile(unwrapEnvelope(raw, PROFILE_ENVELOPE));
    } catch (error) {
      if (
        error instanceof ApiError
        && error.status === 404
        && error.code === 'NOT_FOUND'
      ) {
        return emptySellerProfile();
      }
      throw error;
    }
  }

  /**
   * Update the profile. The backend MUST return the updated profile; when it
   * answers 204/empty the adapter re-reads the authoritative record. The
   * submitted payload is NEVER echoed back as if the backend had returned it
   * — that would silently pretend unsaved values were saved.
   */
  async updateSellerProfile(data: UpdateSellerProfileRequest): Promise<SellerProfile> {
    const raw = await httpClient.patch<unknown>('/users/me/seller-profile', data);
    const body = unwrapEnvelope(isRecord(raw) ? raw : {}, PROFILE_ENVELOPE);
    if (isRecord(body)) return normalizeSellerProfile(body);
    // 204/empty body — fetch the row the backend just wrote (or, for a brand
    // new seller whose GET 404s, an all-empty profile). Never merge `data`.
    return this.getSellerProfile();
  }

  /** Update the account fields (name, phone, avatar). */
  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    const raw = await httpClient.patch<unknown>('/users/me', data);
    const body = unwrapEnvelope(isRecord(raw) ? raw : {}, USER_ENVELOPE);
    if (isRecord(body)) return normalizeUser(body);
    // 204 with no body — the canonical user comes from GET /auth/me.
    const me = await httpClient.get<unknown>('/auth/me');
    return normalizeUser(unwrapEnvelope(isRecord(me) ? me : {}, USER_ENVELOPE));
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await httpClient.patch<void>('/users/me/password', data);
  }

  async updateEmail(data: UpdateEmailRequest): Promise<User> {
    const raw = await httpClient.post<unknown>('/users/me/email', data);
    const body = unwrapEnvelope(isRecord(raw) ? raw : {}, USER_ENVELOPE);
    if (isRecord(body)) return normalizeUser(body);
    // 204/empty — re-read the authoritative user.
    const me = await httpClient.get<unknown>('/auth/me');
    return normalizeUser(unwrapEnvelope(isRecord(me) ? me : {}, USER_ENVELOPE));
  }

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    await httpClient.delete<void>('/users/me', data);
  }
}
