/**
 * Users / seller-profile API contract + factory. Same interface for mock and real backends.
 */
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  SellerProfile,
  UpdateEmailRequest,
  UpdateSellerProfileRequest,
  UpdateUserRequest,
  User,
} from '../types';
import { apiConfig } from '../config';
import { MockUsersApi } from '../mock/users.mock';
import { RealUsersApi } from '../real/users.api';

export interface UsersApi {
  getSellerProfile(): Promise<SellerProfile>;
  updateSellerProfile(data: UpdateSellerProfileRequest): Promise<SellerProfile>;
  updateCurrentUser(data: UpdateUserRequest): Promise<User>;
  /** Change the password; revokes every OTHER session of the user. */
  changePassword(data: ChangePasswordRequest): Promise<void>;
  /** Password-confirmed email change (uniqueness enforced server-side). */
  updateEmail(data: UpdateEmailRequest): Promise<User>;
  /** Password-confirmed, permanent account deletion (cascades owned data). */
  deleteAccount(data: DeleteAccountRequest): Promise<void>;
}

export const usersApi: UsersApi = apiConfig.mode === 'real' ? new RealUsersApi() : new MockUsersApi();