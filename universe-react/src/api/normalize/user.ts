/**
 * User & seller-profile normalizers — backend payload -> the UI contract.
 *
 * Privilege is never assumed: an unlabelled account resolves to "buyer" and
 * only an explicitly suspended account is "suspended" (the UI gates routes on
 * these, so the defaults are the SAFE direction — never more privilege than
 * the backend granted).
 */
import type {
  PublicSellerProfile,
  SellerProfile,
  User,
} from '../types';
import { isRecord, pick, toBoolean, toText, toStringArray } from './primitives';

/**
 * Normalize a user payload (GET /auth/me, login/register/google responses,
 * PATCH /users/me).
 */
export function normalizeUser(raw: unknown): User {
  const record = isRecord(raw) ? raw : {};
  const accountType = toText(pick(record, ['accountType', 'account_type', 'role', 'type'])) === 'seller'
    ? 'seller'
    : 'buyer';
  const status = toBoolean(pick(record, ['isActive', 'is_active'])) === false ? 'suspended' : 'active';
  const createdAt = toText(pick(record, ['createdAt', 'created', 'dateCreated'])) ?? '';

  return {
    id: toText(pick(record, ['id', 'uuid', 'userId', '_id'])) ?? '',
    email: toText(pick(record, ['email', 'emailAddress'])) ?? '',
    fullName: toText(pick(record, ['fullName', 'name', 'displayName'])) ?? '',
    accountType,
    authProvider: toText(pick(record, ['authProvider', 'provider'])) === 'google' ? 'google' : 'password',
    avatarUrl: toText(pick(record, ['avatarUrl', 'avatar', 'picture', 'photoUrl'])),
    phone: toText(pick(record, ['phone', 'phoneNumber'])),
    status,
    createdAt,
    updatedAt: toText(pick(record, ['updatedAt', 'updated', 'modifiedAt'])) ?? createdAt,
  };
}

/**
 * Normalize the seller profile (GET/PATCH /users/me/seller-profile).
 *
 * Includes the storefront customization fields the REAL backend is expected to
 * persist (`bannerImages`, `storeTemplate`, `pickupLocation`, `supportEmail`).
 * Anything the backend did not send stays null/undefined — a brand-new seller
 * normalizes to an all-empty profile, never to prefilled demo values.
 */
export function normalizeSellerProfile(raw: unknown): SellerProfile {
  const record = isRecord(raw) ? raw : {};
  const bannerImages = toStringArray(pick(record, ['bannerImages', 'banners', 'gallery', 'coverImages']));
  // DERIVED: the cover is denormalized from the gallery when the backend only
  // sends the array (the mock API stores the same redundancy), so `bannerUrl`
  // is never a stale null while images exist.
  const bannerUrl = toText(pick(record, ['bannerUrl', 'banner', 'coverImage', 'heroImage'])) ?? bannerImages[0] ?? null;

  return {
    id: toText(pick(record, ['id', 'uuid', '_id'])) ?? '',
    userId: toText(pick(record, ['userId', 'ownerId', 'user'])) ?? '',
    storeName: toText(pick(record, ['storeName', 'shopName', 'store'])) ?? undefined,
    phone: toText(pick(record, ['phone', 'phoneNumber', 'whatsapp'])) ?? undefined,
    level: toText(pick(record, ['level', 'studyLevel', 'year'])) ?? undefined,
    department: toText(pick(record, ['department', 'dept'])) ?? undefined,
    course: toText(pick(record, ['course', 'programme', 'program'])) ?? undefined,
    school: toText(pick(record, ['school', 'university', 'institution'])) ?? undefined,
    bio: toText(pick(record, ['bio', 'about', 'description'])) ?? undefined,
    logoUrl: toText(pick(record, ['logoUrl', 'logo', 'avatarUrl', 'avatar'])),
    bannerUrl,
    bannerImages: bannerImages.length > 0 ? bannerImages : (bannerUrl ? [bannerUrl] : null),
    storeTemplate: toText(pick(record, ['storeTemplate', 'template', 'theme'])),
    pickupLocation: toText(pick(record, ['pickupLocation', 'location', 'pickupHub'])),
    supportEmail: toText(pick(record, ['supportEmail', 'email', 'contactEmail'])),
  };
}

/**
 * Normalize a PUBLIC seller profile (GET /users/:userId/seller-profile).
 *
 * `name` resolves through the documented aliases with an empty-string-safe
 * chain, so a backend that sends only the store name, only the account name, or
 * both renders the same profile. Every other field stays undefined when absent
 * — the UI shows its "—" placeholder instead of an invented value.
 */
export function normalizePublicSellerProfile(raw: unknown): PublicSellerProfile {
  const record = isRecord(raw) ? raw : {};
  const name = toText(pick(record, ['sellerName', 'name', 'displayName']))
    ?? toText(pick(record, ['storeName', 'shopName', 'store']))
    ?? toText(pick(record, ['fullName']))
    ?? '';

  return {
    userId: toText(pick(record, ['userId', 'id', 'uuid', '_id'])) ?? '',
    name,
    email: toText(pick(record, ['email', 'emailAddress', 'supportEmail', 'contactEmail'])),
    phone: toText(pick(record, ['phone', 'phoneNumber', 'whatsapp'])),
    level: toText(pick(record, ['level', 'studyLevel', 'year'])),
    department: toText(pick(record, ['department', 'dept'])),
    course: toText(pick(record, ['course', 'programme', 'program'])),
    school: toText(pick(record, ['school', 'university', 'institution'])),
    bio: toText(pick(record, ['bio', 'about', 'description'])),
    logoUrl: toText(pick(record, ['logoUrl', 'logo', 'avatarUrl', 'avatar'])),
  };
}

/**
 * Blank profile for a seller who has not created one yet.
 *
 * Used ONLY by the isolated 404 handler in RealUsersApi.getSellerProfile()
 * (documented there): a 404 from THAT endpoint means "no profile row exists".
 * Every field is present-but-empty so forms bind cleanly and the first PATCH
 * creates the row server-side (PATCH upserts, per the contract).
 */
export function emptySellerProfile(): SellerProfile {
  return {
    id: '',
    userId: '',
    storeName: undefined,
    phone: undefined,
    level: undefined,
    department: undefined,
    course: undefined,
    school: undefined,
    bio: undefined,
    logoUrl: null,
    bannerUrl: null,
    bannerImages: null,
    storeTemplate: null,
    pickupLocation: null,
    supportEmail: null,
  };
}
