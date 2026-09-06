/**
 * Real Users API — implements the UsersApi contract against the real backend.
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
import type { UsersApi } from '../services/users';
import { httpClient } from './client';

export class RealUsersApi implements UsersApi {
  async getSellerProfile(): Promise<SellerProfile> {
    return httpClient.get<SellerProfile>('/users/me/seller-profile');
  }

  async updateSellerProfile(data: UpdateSellerProfileRequest): Promise<SellerProfile> {
    return httpClient.patch<SellerProfile>('/users/me/seller-profile', data);
  }

  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    return httpClient.patch<User>('/users/me', data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await httpClient.patch<void>('/users/me/password', data);
  }

  async updateEmail(data: UpdateEmailRequest): Promise<User> {
    return httpClient.post<User>('/users/me/email', data);
  }

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    await httpClient.delete<void>('/users/me', data);
  }
}
