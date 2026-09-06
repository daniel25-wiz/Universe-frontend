/**
 * Convenience re-export of the API contract types so the rest of the app can
 * import from a single `src/types` location without reaching into the api/
 * folder. The canonical definitions live in api/types.ts.
 */
export type {
  AccountType,
  UserStatus,
  User,
  UpdateUserRequest,
  ChangePasswordRequest,
  UpdateEmailRequest,
  DeleteAccountRequest,
  LoginRequest,
  RegisterRequest,
  TokenPair,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SellerProfile,
  UpdateSellerProfileRequest,
  ProductStatus,
  CreateProductRequest,
  UpdateProductRequest,
  Product,
  ProductQueryParams,
  PaginatedResponse,
  OrderStatus,
  Order,
  OrderQueryParams,
  ApiMessageResponse,
} from '../api/types';

export { ApiError, toApiError, isAuthError } from '../api/errors';
export type { ApiErrorCode } from '../api/errors';
