/**
 * Auth hooks — consume the authApi service so components never know whether
 * data comes from mock or real backend. Handles login, register, logout, and
 * current-user fetching with TanStack Query.
 *
 * Security behaviors:
 * - useCurrentUser() silently refreshes ONE time on a 401 before giving up,
 *   so an expired access token never logs the user out mid-session while a
 *   valid refresh token exists.
 * - useLogin/useRegister wipe the whole query cache on success so data that
 *   belonged to a PREVIOUS account can never leak into the new session
 *   (shared-computer safety).
 * - Login/register return the user to the page they originally wanted
 *   (location.state.from) instead of a hard-coded landing page.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/services/auth';
import { ApiError, isAuthError } from '../api/errors';
import { sessionStore } from '../api/session';
import type { LoginRequest, RegisterRequest, User } from '../api/types';

const CURRENT_USER_KEY = ['currentUser'];

/** Fetch the currently authenticated user (skipped when no token exists). */
export function useCurrentUser() {
  return useQuery<User, ApiError>({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (error) {
        // Access token expired — attempt exactly one silent refresh, then retry.
        if (isAuthError(error) && sessionStore.getRefreshToken()) {
          try {
            await authApi.refreshToken(sessionStore.getRefreshToken()!);
            return await authApi.getCurrentUser();
          } catch {
            // Refresh failed — clear stale tokens so guards redirect to login.
            sessionStore.clear();
            throw error;
          }
        }
        throw error;
      }
    },
    enabled: sessionStore.hasTokens(),
    retry: false,
    staleTime: 60 * 1000,
  });
}

/** Login mutation — on success, caches the user and honors the return URL. */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from;

  return useMutation<User, ApiError, LoginRequest>({
    mutationFn: async (data) => {
      const res = await authApi.login(data);
      return res.user;
    },
    onSuccess: (user) => {
      // Clear any data cached under the previous account, then seed this one.
      queryClient.clear();
      queryClient.setQueryData(CURRENT_USER_KEY, user);
      const fallback = user.accountType === 'seller' ? '/seller' : '/';
      const returnTo = from?.pathname && from.pathname !== '/auth' ? from : null;
      navigate(returnTo ? `${returnTo.pathname}${location.state?.from?.search ?? ''}` : fallback);
    },
  });
}

/** Register mutation — on success, stores sessions and redirects. */
export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<User, ApiError, RegisterRequest>({
    mutationFn: async (data) => {
      const res = await authApi.register(data);
      return res.user;
    },
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(CURRENT_USER_KEY, user);
      navigate(user.accountType === 'seller' ? '/seller/onboarding' : '/');
    },
  });
}

/** Logout mutation — clears tokens and resets the query cache. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, ApiError, void>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      navigate('/');
    },
    onError: () => {
      // Even if the server logout fails, clear local state.
      queryClient.clear();
      sessionStore.clear();
      navigate('/');
    },
  });
}
