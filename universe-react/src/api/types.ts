/**
 * Shared API contract types.
 *
 * These types are the single source of truth for the shape of every request
 * and response. BOTH the mock API and the real HTTP client are bound to these
 * same types, which is what makes swapping the backend a zero-code-change
 * operation. Also re-exported from src/types for convenience.
 */

/* ------------------------------ Accounts ------------------------------ */

export type AccountType = 'buyer' | 'seller';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  /** How the account authenticates. Absent on rows created before Google auth existed (treated as "password"). */
  authProvider?: 'password' | 'google';
  avatarUrl?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/** Data the client may send when updating the logged-in user. */
export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
}

/** Password change — always requires confirming the current password. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Email change — password-confirmed so a stolen tab can't hijack the account. */
export interface UpdateEmailRequest {
  currentPassword: string;
  newEmail: string;
}

/** Permanent account deletion — requires the current password. */
export interface DeleteAccountRequest {
  currentPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Hint for the backend/auth provider; the frontend always keeps the session in localStorage. */
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  accountType: AccountType;
}

/* ------------------------------- Google -------------------------------- */

/**
 * Standard claims carried by a Google ID token — the signed JWT that Google
 * Identity Services hands back after the user picks an account in Google's
 * own chooser. The REAL backend verifies the signature against Google's
 * public keys (JWKS) and then reads these claims; the mock backend decodes
 * and validates the claims without signature verification (see
 * api/mock/googleIdToken.ts).
 */
export interface GoogleIdTokenPayload {
  /** Token issuer — always accounts.google.com (with or without https://). */
  iss?: string;
  /** Intended audience(s) — must contain this app's OAuth client ID. */
  aud?: string | string[];
  /** Google's stable account id. */
  sub?: string;
  email?: string;
  /** Google only issues tokens whose email is verified. */
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  /** Expiry time (seconds since epoch). */
  exp?: number;
  /** Issued-at time (seconds since epoch). */
  iat?: number;
}

/** Body of POST /auth/google. */
export interface GoogleLoginRequest {
  /** Google ID token (JWT) obtained from Google Identity Services. */
  credential: string;
  rememberMe?: boolean;
  /**
   * Only consulted when the Google email has never signed up before (it is
    * ignored for existing accounts).
   */
  accountType?: AccountType;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Optional — real backends may add an expiresIn (seconds) field. */
  expiresIn?: number;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
  /**
   * True when this request CREATED the account (e.g. first Google sign-in for
   * an email the backend has never seen). Lets the UI run signup-style
   * redirects (onboarding) without a second endpoint.
   */
  isNewUser?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type RefreshTokenResponse = TokenPair;

/* ---------------------------- Seller profile --------------------------- */

export interface SellerProfile {
  id: string;
  userId: string;
  storeName?: string;
  phone?: string;
  level?: string;
  department?: string;
  course?: string;
  school?: string;
  bio?: string;
  /** Store logo shown on the private marketplace (http(s) URL or data URL). */
  logoUrl?: string | null;
  /** Cover picture shown as the storefront hero banner. */
  bannerUrl?: string | null;
  /** Seller-managed storefront gallery, shown as a scrollable image rail. */
  bannerImages?: string[] | null;
  /** Storefront template key — see src/lib/storeTemplates. Null = classic look. */
  storeTemplate?: string | null;
  /** Campus pickup hub selected in the workspace (shown on the storefront). */
  pickupLocation?: string | null;
  /** Support email shown to buyers on the storefront contact strip. */
  supportEmail?: string | null;
}

export interface UpdateSellerProfileRequest {
  storeName?: string;
  phone?: string;
  level?: string;
  department?: string;
  course?: string;
  school?: string;
  bio?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  bannerImages?: string[] | null;
  storeTemplate?: string | null;
  pickupLocation?: string | null;
  supportEmail?: string | null;
}

/* ------------------------------ Products ------------------------------- */

export type ProductStatus = 'active' | 'draft';

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  stock?: number | null;
  sku?: string;
  category?: string;
  status?: ProductStatus;
  /**
   * Primary/cover image — the first entry of `images`, kept denormalized so
   * list views (marketplace cards, storefront) never need to read the array.
   */
  imageUrl?: string | null;
  imageAlt?: string | null;
  /**
   * Up to 5 gallery images (http(s) URLs or uploaded data URLs). The first
   * entry is the cover image.
   */
  images?: string[] | null;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface Product extends CreateProductRequest {
  id: string;
  sellerId: string;
  /** Denormalized display name of the owning store/seller. */
  seller?: string | null;
  rating: number;
  reviews: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  /** When present, only products owned by this user id are returned (workshop). */
  sellerId?: string;
  status?: ProductStatus;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/* ----------------------------- Pagination ------------------------------ */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* -------------------------------- Orders ------------------------------- */

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  reference: string;
  buyerName: string;
  buyerInitials?: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
}

/* -------------------------------- Misc --------------------------------- */

/** Generic empty/success response used by endpoints that return no body. */
export interface ApiMessageResponse {
  message: string;
}

/* ----------------------------- Storefront ------------------------------ */

/**
 * The seller's PRIVATE MARKETPLACE storefront — the page served on each
 * seller's own domain (storename.<app-domain>). Public data only: buyers
 * visiting a store domain are never authenticated.
 */

export type StorefrontCategory = 'tech' | 'campus' | 'lifestyle';

export interface StorefrontProduct {
  id: string;
  name: string;
  description: string;
  category: StorefrontCategory;
  categoryLabel: string;
  price: number;
  priceLabel: string;
  oldPriceLabel?: string | null;
  rating: number;
  reviews: number;
  popularity: number;
  stock?: number | null;
  badge?: 'flash' | 'bestseller' | null;
  campusPickup?: boolean;
  image: string;
  imageAlt: string;
  /** Gallery images, with `image` as the first/cover image. */
  images?: string[];
}

export interface StorefrontReview {
  id: string;
  initials: string;
  name: string;
  meta: string;
  text: string;
  avatarTone: 'primary' | 'secondary';
}

export interface StorefrontAssurance {
  icon: string;
  tone: 'primary' | 'success' | 'tertiary';
  title: string;
  sub: string;
}

export interface StorefrontBioBadge {
  icon: string;
  tone: 'success' | 'primary' | 'tertiary';
  label: string;
}

export interface Storefront {
  slug: string;
  name: string;
  owner: string;
  school: string;
  storeId: string;
  rating: number;
  reviewCount: number;
  followers: number;
  fulfillmentLabel: string;
  responseTimeLabel: string;
  memberSinceLabel: string;
  badgeLabel: string;
  campusTag: string;
  stockNote: string;
  pickupNote: string;
  /** Active storefront template key — see src/lib/storeTemplates. Null = classic boutique look. */
  template: string | null;
  /** Seller's chosen campus pickup hub (rendered in delivery/contact strips). */
  pickupLocation: string | null;
  /** Pretty display domain, e.g. "globalstore.universe.market". */
  domain: string;
  whatsappUrl: string;
  phone: string;
  email: string;
  couponCode: string;
  announcementTitle: string;
  announcementLead: string;
  bannerImage: string | null;
  bannerImages: string[];
  bannerAlt?: string;
  avatarImage: string | null;
  avatarAlt?: string;
  bioLead: string;
  bioDetail: string;
  bioBadges: StorefrontBioBadge[];
  reviews: StorefrontReview[];
  reviewsNote: string;
  assurances: StorefrontAssurance[];
  catalogCounts: Record<StorefrontCategory | 'all', number>;
  products: StorefrontProduct[];
}