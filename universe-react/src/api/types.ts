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
  /** Contact number set through PATCH /users/me (optional — not every backend returns it). */
  phone?: string | null;
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

/* -------------------------- Password Reset -------------------------- */

/** Step 1: Request a password reset — generates and "emails" an OTP. */
export interface PasswordResetRequest {
  email: string;
}

/** Step 2: Verify the OTP sent to the user's email. */
export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

/** Step 3: Complete the password reset with the verified code. */
export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

/** Response to password reset request — includes OTP in mock mode only. */
export interface PasswordResetResponse {
  message: string;
  /** Development-only field: OTP for testing (NEVER in production). */
  devOtp?: string;
}

/** Response to OTP verification. */
export interface VerifyResetCodeResponse {
  message: string;
  verified: boolean;
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

/**
 * PUBLIC seller profile — what any visitor (signed in or not) may read about a
 * seller. Powers the public seller profile page reached from a product page.
 *
 * Everything here is seller-PUBLISHED data: the API returns only the fields the
 * seller actually filled in, so absent values stay null/undefined and the UI
 * renders its "—" placeholder instead of a fabricated default.
 *
 * PRIVACY: this is the one endpoint that exposes a seller's contact email/phone
 * to anonymous visitors — the backend must only return channels the seller
 * published on their own profile (never credentials or internal fields).
 */
export interface PublicSellerProfile {
  /** The seller's account id — the `sellerId` carried by every product of theirs. */
  userId: string;
  /** Public display name: the store name, falling back to the account name. */
  name: string;
  email?: string | null;
  /** Contact phone in a WhatsApp-compatible format. */
  phone?: string | null;
  /** Year of study, e.g. "400". */
  level?: string | null;
  department?: string | null;
  course?: string | null;
  school?: string | null;
  bio?: string | null;
  logoUrl?: string | null;
}

/* ------------------------------ Products ------------------------------- */

export type ProductStatus = 'active' | 'draft';

/**
 * How many active products ONE seller may feature in the shared public
 * marketplace catalog at the same time. Enforced by the mock products API on
 * every create/update; the workshop UI reads the same number to show the
 * seller how many listing slots they have left.
 */
export const MARKETPLACE_LISTING_LIMIT = 2;

/**
 * How many products (active + drafts combined) ONE seller may keep in their
 * workshop at the same time. Enforced by the products API (mock + real
 * backend contract) on create; the workshop UI reads the same number to
 * disable "Add Product" when the cap is reached.
 */
export const WORKSHOP_PRODUCT_LIMIT = 20;

/**
 * The ONE delivery hub every product is listed with (platform constant).
 *
 * The Add Product page no longer asks the seller for a location: a new product
 * is always delivered from this hub, and the public marketplace shows it on the
 * product card and on the product page. It is not fabricated seller data — a
 * product whose backend row carries no `deliveryLocation` falls back to this
 * documented default (see `resolveDeliveryLocation`).
 */
export const DEFAULT_DELIVERY_LOCATION = 'Motion Ground At DHL Building';

/**
 * The delivery location a buyer sees: the product's own stored value when the
 * backend has one, otherwise the platform default hub.
 */
export function resolveDeliveryLocation(deliveryLocation?: string | null): string {
  return (deliveryLocation ?? '').trim() || DEFAULT_DELIVERY_LOCATION;
}

/**
 * A product option group ("variant") — e.g. `{ name: 'Size', values: ['Small', 'Medium'] }`.
 *
 * Sellers add these on the Add/Edit Product pages; buyers pick one value per
 * group on the product pages of the public marketplace and the storefront.
 */
export interface ProductVariant {
  /** Option name shown to buyers, e.g. "Size", "Colour" or "Edition". */
  name: string;
  /** Selectable values for the option, e.g. ["Small", "Medium", "Large"]. */
  values: string[];
}

export interface CreateProductRequest {
  name: string;
  /** Nullable per the API contract — a backend may clear the description. */
  description?: string | null;
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
  /**
   * Variant option groups (e.g. Size / Colour) with their selectable values.
   * Null or empty means the product has no variants.
   */
  variants?: ProductVariant[] | null;
  /**
   * Physical condition the seller attests on the Add Product page —
   * "new" (Brand New) or "used" (Fairly Used). Null when the backend has no
   * data (legacy rows); the UI then shows "Condition unavailable".
   */
  condition?: 'new' | 'used' | null;
  /**
   * Where the product is handed over to the buyer. The Add Product page always
   * sends DEFAULT_DELIVERY_LOCATION (the seller does not type a location);
   * the public marketplace renders it on the card and the product page.
   */
  deliveryLocation?: string | null;
  /**
   * When true the product is listed in the shared public marketplace catalog.
   * Each seller may feature at most 2 active products — enforced by the API
   * on both create and update. Buyers can still open every active product via
   * the seller's shop page ("View all products from this seller").
   */
  featuredInMarketplace?: boolean | null;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface Product extends Omit<CreateProductRequest, 'price'> {
  id: string;
  sellerId: string;
  /** Denormalized display name of the owning store/seller. */
  seller?: string | null;
  /** Seller store logo shown beside the product and on the seller shop. */
  sellerLogo?: string | null;
  /** Seller contact number for buyer-to-seller WhatsApp messages. */
  sellerPhone?: string | null;
  /**
   * The seller's listed price. Null when the backend sent none — the UI
   * renders "—" instead of pretending the product is free.
   */
  price: number | null;
  /**
   * Review data the BACKEND owns. Null = the backend has no rating for this
   * product yet — the UI renders "no reviews" and must never display a
   * fabricated default.
   */
  rating: number | null;
  reviews: number | null;
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
  /**
   * Explicit "featured in the shared public marketplace" filter. When omitted
   * the backend applies its default visibility scoping (see API_CONTRACT.md).
   */
  featured?: boolean;
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

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled';

/**
 * One line item inside an order, as reported by the backend. `unitPrice` is
 * the price actually charged per unit (sale price when on sale) and
 * `lineTotal` is `quantity * unitPrice` — both BACKEND-computed. `sellerId`
 * attributes the line to the seller that owns the product, which is what lets
 * Sales Analytics compute each seller's exact revenue from an order
 * (docs/API_CONTRACT.md -> Orders).
 */
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
  sellerId?: string | null;
}

export interface Order {
  id: string;
  reference: string;
  buyerName: string;
  buyerInitials?: string;
  /** Backend-computed total. Null when the backend sent no amount. */
  amount: number | null;
  status: OrderStatus;
  createdAt: string;
  /**
   * Line items, when the backend includes them (required on /seller/orders,
   * optional elsewhere). Seller analytics are computed from these — the UI
   * never invents figures when they are missing.
   */
  items?: OrderItem[];
}

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  /**
   * Optional ISO 8601 window bounding `createdAt` — server-side period
   * filtering so Sales Analytics never downloads an entire order history.
   */
  since?: string;
  until?: string;
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
  /** Null when the backend sent no description — the UI renders nothing. */
  description: string | null;
  category: StorefrontCategory;
  categoryLabel: string;
  /** Null when the backend sent no usable price — the UI renders "—". */
  price: number | null;
  /** Backend-formatted label when provided, else derived from `price`. */
  priceLabel: string | null;
  oldPriceLabel?: string | null;
  rating: number | null;
  reviews: number | null;
  /**
   * Internal sort weight. Null when the backend provides none — sort controls
   * treat null as "unknown" instead of inventing a score.
   */
  popularity: number | null;
  stock?: number | null;
  /** Only ever a value the backend explicitly set. Never inferred from price. */
  badge?: 'flash' | 'bestseller' | null;
  campusPickup?: boolean | null;
  image: string;
  imageAlt: string;
  /** Gallery images, with `image` as the first/cover image. */
  images?: string[];
  /** Variant option groups carried over from the seller's product record. */
  variants?: ProductVariant[];
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
  storeId: string | null;
  /**
   * When the backend resolves a store to a seller account, its user id. Lets
   * the UI fetch the seller's catalog through the documented product API when
   * the storefront response does not embed products. Null when not provided.
   */
  sellerId: string | null;
  /** Seller-owned stats — null when the backend provides none. */
  rating: number | null;
  reviewCount: number | null;
  followers: number | null;
  /** Neutral "—" placeholder when the backend provides no label. */
  fulfillmentLabel: string | null;
  responseTimeLabel: string | null;
  memberSinceLabel: string | null;
  badgeLabel: string | null;
  campusTag: string | null;
  /** Seller assurance copy — null when the backend provides none. */
  stockNote: string | null;
  pickupNote: string | null;
  /** Active storefront template key — see src/lib/storeTemplates. Null = classic boutique look. */
  template: string | null;
  /** Seller's chosen campus pickup hub (rendered in delivery/contact strips). */
  pickupLocation: string | null;
  /** Pretty display domain, e.g. "globalstore.universe.market". */
  domain: string;
  whatsappUrl: string;
  phone: string | null;
  email: string | null;
  couponCode: string;
  announcementTitle: string | null;
  announcementLead: string | null;
  bannerImage: string | null;
  bannerImages: string[];
  bannerAlt?: string;
  avatarImage: string | null;
  avatarAlt?: string;
  bioLead: string | null;
  bioDetail: string | null;
  bioBadges: StorefrontBioBadge[];
  reviews: StorefrontReview[];
  reviewsNote: string | null;
  assurances: StorefrontAssurance[];
  catalogCounts: Record<StorefrontCategory | 'all', number>;
  products: StorefrontProduct[];
}

/* -------------------------------- Orders -------------------------------- */

/**
 * One purchased line item as the frontend submits it. `unitPrice` is the
 * price the buyer saw (sale price when on sale) — the BACKEND must recompute
 * the authoritative total against its own catalog prices; the frontend value
 * is informational only.
 */
export interface OrderItemRequest {
  productId: string;
  quantity: number;
  /** Selected variant values, e.g. { Size: "M" } (informational). */
  variantSelection?: Record<string, string>;
  unitPrice?: number | null;
}

/** Where/how the order should be delivered (submitted with the order). */
export interface DeliveryAddress {
  fullName: string;
  phone: string;
  /** Street / hall / hostel line. */
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  /** Campus pickup hub chosen instead of home delivery, when used. */
  pickupLocation?: string | null;
  notes?: string | null;
}

/**
 * Body of POST /orders. Payment happens BEFORE order creation (see
 * docs/API_CONTRACT.md): the buyer completes the Paystack transaction, the
 * frontend verifies it, and only then submits the order referencing the
 * payment. The backend must reject orders whose paymentReference is unknown,
 * unpaid, or already used.
 */
export interface CreateOrderRequest {
  items: OrderItemRequest[];
  deliveryAddress: DeliveryAddress;
  /** Paystack transaction reference verified via GET /payments/verify/:reference. */
  paymentReference?: string | null;
  /** Free-form note the buyer attached to the order. */
  note?: string | null;
}

/* ------------------------------- Payments ------------------------------- */

/** Body of POST /payments/initialize (Paystack, via the backend). */
export interface PaymentInitializationRequest {
  /** Amount in the currency's major unit (e.g. naira), NOT kobo/cents. */
  amount: number;
  email: string;
  currency?: string;
  /**
   * Cart digest the backend may embed in the Paystack metadata; opaque to the
   * frontend beyond echo-back.
   */
  metadata?: Record<string, unknown>;
}

/** Response of POST /payments/initialize. */
export interface PaymentInitializationResponse {
  /** Paystack checkout URL the frontend redirects the buyer to. */
  authorizationUrl: string;
  /** Backend-generated transaction reference (echoed by verification). */
  reference: string;
  /** True when Paystack accepted the initialization. */
  status: 'success' | 'failed';
}

/** Normalized result of GET /payments/verify/:reference. */
export interface PaymentVerificationResponse {
  reference: string;
  /** Authoritative payment state as reported by the backend. */
  status: 'success' | 'failed' | 'pending';
  amount?: number | null;
  currency?: string | null;
  /** Backend transaction/channel id, when exposed. */
  transactionId?: string | null;
  paidAt?: string | null;
  /** Order the backend linked to this payment, when already created. */
  orderId?: string | null;
}

/* -------------------------------- Uploads ------------------------------- */

/** Response of POST /uploads/images. */
export interface UploadedFile {
  /** URL the backend stored the file under (use this in product/profile fields). */
  url: string;
  /** Backend filename / id, when exposed. */
  name?: string | null;
  /** File size in bytes, when exposed. */
  size?: number | null;
}
