/**
 * Mock Users API — implements the UsersApi contract against the mock DB.
 *
 * Security notes:
 * - Every method requires a valid session (requireSession() guard).
 * - updateCurrentUser() uses a strict field WHITELIST — client input can never
 *   touch email, passwordHash, accountType, status or role (mass-assignment
 *   protection).
 * - Sensitive operations (password change, email change, account deletion)
 *   require the CURRENT PASSWORD and feed failed confirmations into the same
 *   brute-force lockout as login.
 * - Account deletion cascades: products, seller profile and every session are
 *   removed with the user.
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
import { mockDb, generateId, nowIso } from './mockDatabase';
import type { StoredUser } from './mockDatabase';
import { withMockLatency } from './mockLatency';
import { ApiError } from '../errors';
import { logApi } from '../logger';
import { sessionStore } from '../session';
import { requireSession } from './sessionGuard';
import { hashPassword, validatePasswordStrength, verifyPassword } from './security';
import { isKnownStoreTemplate } from '../../lib/storeTemplates';

function toPublicUser(stored: StoredUser): User {
  const { passwordHash: _p, failedLoginCount: _f, lockedUntil: _l, ...publicUser } = stored;
  return publicUser;
}

/** Shared password confirmation with lockout for destructive operations. */
async function assertCurrentPassword(user: StoredUser, currentPassword: string): Promise<void> {
  const ok = await verifyPassword(currentPassword ?? '', user.passwordHash);
  if (!ok) {
    // Count toward brute-force lockout, same as a failed login.
    const count = (user.failedLoginCount ?? 0) + 1;
    const lockedUntil = count >= 5 ? Date.now() + 15 * 60 * 1000 : null;
    mockDb.update('users', user.id, { failedLoginCount: count, lockedUntil } as never);
    throw new ApiError({
      message: 'Your current password is incorrect.',
      status: 401,
      code: 'INVALID_CURRENT_PASSWORD',
      fieldErrors: { currentPassword: 'Incorrect password' },
    });
  }
}

/** Truncate helper — returns undefined for empty/undefined input. */
function optionalText(value: string | undefined | null, max: number): string | undefined | null {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/**
 * Image-field sanitizer (store logo / cover picture).
 * Accepts http(s) URLs or compressed data URLs only, with a hard size cap —
 * the same rules the products API applies to product images.
 */
function optionalImage(value: string | undefined | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^(https?:\/\/|data:image\/)/.test(trimmed)) return undefined;
  if (trimmed.length > 500_000) return undefined;
  return trimmed;
}

export class MockUsersApi implements UsersApi {
  async getSellerProfile(): Promise<SellerProfile> {
    logApi('GET', '/users/me/seller-profile');
    return withMockLatency((async () => {
      const { user } = await requireSession();
      const profiles = mockDb.query('sellerProfiles', (p) => p.userId === user.id);
      if (profiles.length === 0) {
        // Auto-create a profile on first read so the UI always has something.
        const timestamp = nowIso();
        return mockDb.insert('sellerProfiles', {
          id: generateId(),
          userId: user.id,
          storeName: null,
          phone: null,
          level: null,
          department: null,
          course: null,
          school: null,
          bio: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        } as never);
      }
      return profiles[0];
    })());
  }

  /**
   * PUBLIC seller profile — deliberately session-free (marketplace visitors are
   * anonymous). Read-only: only seller-PUBLISHED fields are returned, and an
   * unknown id or a buyer account is a real 404 so the UI can show "seller not
   * found" instead of an empty shell.
   */
  async getPublicSellerProfile(sellerId: string): Promise<PublicSellerProfile> {
    logApi('GET', `/users/${sellerId}/seller-profile`);
    return withMockLatency((async () => {
      const seller = mockDb.query('users', (u) => u.id === sellerId && u.accountType === 'seller')[0];
      if (!seller) {
        throw new ApiError({ message: 'Seller not found.', status: 404, code: 'NOT_FOUND' });
      }
      const profile = mockDb.query('sellerProfiles', (p) => p.userId === seller.id)[0];
      // Store name first, account name as the documented fallback — never a
      // prefilled demo value.
      return {
        userId: seller.id,
        name: profile?.storeName || seller.fullName || 'Campus Seller',
        email: seller.email || null,
        phone: profile?.phone ?? seller.phone ?? null,
        level: profile?.level ?? null,
        department: profile?.department ?? null,
        course: profile?.course ?? null,
        school: profile?.school ?? null,
        bio: profile?.bio ?? null,
        logoUrl: profile?.logoUrl ?? seller.avatarUrl ?? null,
      };
    })());
  }

  async updateSellerProfile(data: UpdateSellerProfileRequest): Promise<SellerProfile> {
    logApi('PATCH', '/users/me/seller-profile');
    return withMockLatency((async () => {
      const { user } = await requireSession();
      // Whitelist + sanitize every field (length caps, trimming). Values are
      // typed loosely because the patch mixes strings with the bannerImages
      // array (image fields are validated separately below).
      const patch: Record<string, unknown> = {};
      if (data.storeName !== undefined) patch.storeName = optionalText(data.storeName, 80) ?? null;
      if (data.phone !== undefined) patch.phone = optionalText(data.phone, 20) ?? null;
      if (data.level !== undefined) patch.level = optionalText(data.level, 10) ?? null;
      if (data.department !== undefined) patch.department = optionalText(data.department, 80) ?? null;
      if (data.course !== undefined) patch.course = optionalText(data.course, 120) ?? null;
      if (data.school !== undefined) patch.school = optionalText(data.school, 120) ?? null;
      if (data.bio !== undefined) patch.bio = optionalText(data.bio, 1000) ?? null;
      if (data.logoUrl !== undefined) patch.logoUrl = optionalImage(data.logoUrl) ?? null;
      if (data.bannerUrl !== undefined) patch.bannerUrl = optionalImage(data.bannerUrl) ?? null;
      if (data.bannerImages !== undefined) {
        const images = Array.isArray(data.bannerImages)
          ? data.bannerImages.map((image) => optionalImage(image)).filter((image): image is string => Boolean(image)).slice(0, 5)
          : [];
        patch.bannerImages = images.length ? images : null;
        if (data.bannerUrl === undefined) patch.bannerUrl = images[0] ?? null;
      }
      if (data.storeTemplate !== undefined) {
        // Whitelist against the registered storefront templates — unknown or
        // empty values reset to null (the classic boutique look).
        patch.storeTemplate =
          data.storeTemplate && isKnownStoreTemplate(data.storeTemplate) ? data.storeTemplate : null;
      }
      if (data.pickupLocation !== undefined) {
        patch.pickupLocation = optionalText(data.pickupLocation, 120) ?? null;
      }
      if (data.supportEmail !== undefined) {
        patch.supportEmail = optionalText(data.supportEmail, 120) ?? null;
      }

      const profiles = mockDb.query('sellerProfiles', (p) => p.userId === user.id);
      if (profiles.length === 0) {
        const timestamp = nowIso();
        return mockDb.insert('sellerProfiles', {
          id: generateId(),
          userId: user.id,
          ...patch,
          createdAt: timestamp,
          updatedAt: timestamp,
        } as never);
      }
      const updated = mockDb.update('sellerProfiles', profiles[0].id, patch as never);
      if (!updated) {
        throw new ApiError({ message: 'Profile not found.', status: 404, code: 'NOT_FOUND' });
      }
      return updated as SellerProfile;
    })());
  }


  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    logApi('PATCH', '/users/me');
    return withMockLatency((async () => {
      const { user } = await requireSession();
      // MASS-ASSIGNMENT PROTECTION: build the patch from a strict whitelist.
      // Email, password, accountType and status can NEVER be changed here.
      // Phone/avatar also accept null ("clear the value") even though
      // UpdateUserRequest only exposes string — the DB row stores nulls.
      const patch: Partial<Omit<UpdateUserRequest, 'phone' | 'avatarUrl'>> & {
        phone?: string | null;
        avatarUrl?: string | null;
      } = {};
      if (data.fullName !== undefined) {
        const fullName = data.fullName.trim();
        if (fullName && (fullName.length < 2 || fullName.length > 80)) {
          throw new ApiError({
            message: 'Please correct the highlighted fields.',
            status: 422,
            code: 'VALIDATION_ERROR',
            fieldErrors: { fullName: 'Full name must be between 2 and 80 characters' },
          });
        }
        if (fullName) patch.fullName = fullName;
      }
      if (data.phone !== undefined) {
        const phone = data.phone?.trim() ?? '';
        if (phone && !/^[+()\d\s-]{1,20}$/.test(phone)) {
          throw new ApiError({
            message: 'Please correct the highlighted fields.',
            status: 422,
            code: 'VALIDATION_ERROR',
            fieldErrors: { phone: 'Enter a valid phone number' },
          });
        }
        patch.phone = phone || null;
      }
      if (data.avatarUrl !== undefined) {
        const url = data.avatarUrl;
        if (url && !/^(https?:\/\/|data:image\/)/.test(url)) {
          throw new ApiError({
            message: 'Please correct the highlighted fields.',
            status: 422,
            code: 'VALIDATION_ERROR',
            fieldErrors: { avatarUrl: 'Avatar must be a http(s) or image data URL' },
          });
        }
        patch.avatarUrl = url && url.length <= 500_000 ? url : null;
      }

      const updated = mockDb.update('users', user.id, patch as never);
      if (!updated) {
        throw new ApiError({ message: 'User not found.', status: 404, code: 'NOT_FOUND' });
      }
      return toPublicUser(updated as StoredUser);
    })());
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    logApi('PATCH', '/users/me/password');
    return withMockLatency((async () => {
      const { user, session } = await requireSession();
      await assertCurrentPassword(user, data.currentPassword);

      const policy = validatePasswordStrength(data.newPassword ?? '');
      if (!policy.ok) {
        throw new ApiError({
          message: 'Please choose a stronger password.',
          status: 422,
          code: 'WEAK_PASSWORD',
          fieldErrors: { newPassword: policy.error ?? 'Password does not meet the requirements' },
        });
      }

      mockDb.update('users', user.id, {
        passwordHash: await hashPassword(data.newPassword),
        failedLoginCount: 0,
        lockedUntil: null,
      } as never);

      // SECURITY: revoke every OTHER session (e.g. an old laptop that is still
      // signed in) but keep the current device signed in.
      mockDb
        .query('sessions', (s) => s.userId === user.id && s.id !== session.id)
        .forEach((s) => mockDb.remove('sessions', s.id));
    })());
  }

  async updateEmail(data: UpdateEmailRequest): Promise<User> {
    logApi('POST', '/users/me/email');
    return withMockLatency((async () => {
      const { user } = await requireSession();
      await assertCurrentPassword(user, data.currentPassword);

      const newEmail = data.newEmail?.trim().toLowerCase() ?? '';
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || newEmail.length > 254) {
        throw new ApiError({
          message: 'Please enter a valid email address.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { newEmail: 'Enter a valid email' },
        });
      }
      const taken = mockDb.query('users', (u) => u.email === newEmail && u.id !== user.id);
      if (taken.length > 0) {
        throw new ApiError({
          message: 'That email is already in use.',
          status: 409,
          code: 'EMAIL_TAKEN',
          fieldErrors: { newEmail: 'Email is already registered' },
        });
      }

      const updated = mockDb.update('users', user.id, { email: newEmail } as never);
      if (!updated) {
        throw new ApiError({ message: 'User not found.', status: 404, code: 'NOT_FOUND' });
      }
      return toPublicUser(updated as StoredUser);
    })());
  }

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    logApi('DELETE', '/users/me');
    return withMockLatency((async () => {
      const { user } = await requireSession();
      await assertCurrentPassword(user, data.currentPassword);

      // CASCADE: remove everything the account owns, then the account itself.
      mockDb
        .query('products', (p) => p.sellerId === user.id)
        .forEach((p) => mockDb.remove('products', p.id));
      mockDb
        .query('sellerProfiles', (p) => p.userId === user.id)
        .forEach((p) => mockDb.remove('sellerProfiles', p.id));
      mockDb
        .query('sessions', (s) => s.userId === user.id)
        .forEach((s) => mockDb.remove('sessions', s.id));
      mockDb.remove('users', user.id);
      sessionStore.clear();
    })());
  }
}
