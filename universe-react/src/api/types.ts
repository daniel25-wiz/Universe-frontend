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

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Optional — real backends may add an expiresIn (seconds) field. */
  expiresIn?: number;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
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
}

export interface UpdateSellerProfileRequest {
  storeName?: string;
  phone?: string;
  level?: string;
  department?: string;
  course?: string;
  school?: string;
  bio?: string;
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
  imageUrl?: string | null;
  imageAlt?: string | null;
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