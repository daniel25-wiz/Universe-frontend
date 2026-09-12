/**
 * User / seller-profile hooks — consume the usersApi service with TanStack Query.
 * Includes the account-security mutations: password change, email change and
 * permanent account deletion (all password-confirmed server-side).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/services/users';
import { ApiError } from '../api/errors';
import { sessionStore } from '../api/session';
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  SellerProfile,
  UpdateEmailRequest,
  UpdateSellerProfileRequest,
  UpdateUserRequest,
  User,
} from '../api/types';

const SELLER_PROFILE_KEY = ['sellerProfile'];
const CURRENT_USER_KEY = ['currentUser'];

/** Fetch the current user's seller profile. */
export function useSellerProfile() {
  return useQuery<SellerProfile, ApiError>({
    queryKey: SELLER_PROFILE_KEY,
    queryFn: () => usersApi.getSellerProfile(),
  });
}

/** Update the seller profile — refetches on success. */
export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation<SellerProfile, ApiError, UpdateSellerProfileRequest>({
    mutationFn: (data) => usersApi.updateSellerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_PROFILE_KEY });
      // The public storefront derives from the profile (template, pickup hub,
      // support email, logo...) — bust its cache so changes show up at once.
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    },
  });
}

/** Update the current user's account fields (name, phone, avatar). */
export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateUserRequest>({
    mutationFn: (data) => usersApi.updateCurrentUser(data),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user);
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}

/** Change the password (server also revokes every other session). */
export function useChangePassword() {
  return useMutation<void, ApiError, ChangePasswordRequest>({
    mutationFn: (data) => usersApi.changePassword(data),
  });
}

/** Password-confirmed email change; refreshes the cached user on success. */
export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateEmailRequest>({
    mutationFn: (data) => usersApi.updateEmail(data),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user);
    },
  });
}

/**
 * Permanently delete the account. Clears every trace of the session locally
 * and navigates home — the data itself is cascade-deleted server-side.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, ApiError, DeleteAccountRequest>({
    mutationFn: (data) => usersApi.deleteAccount(data),
    onSuccess: () => {
      sessionStore.clear();
      queryClient.clear();
      navigate('/', { replace: true });
    },
    onError: () => {
      // A failed deletion attempt must never leave a half-cleared session,
      // but if the server says unauthorized the local session is stale.
    },
  });
}
