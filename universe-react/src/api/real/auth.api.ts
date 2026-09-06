/**
 * Real Auth API — implements the AuthApi contract against the real backend.
 *
 * Mirrors MockAuthApi's interface exactly. When VITE_API_MODE=real, the
 * factory in services/auth.ts swaps this in. The UI never knows the difference.
 */
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenResponse,
  RegisterRequest,
  User,
} from '../types';
import type { AuthApi } from '../services/auth';
import { httpClient } from './client';
import { sessionStore } from '../session';

export class RealAuthApi implements AuthApi {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await httpClient.post<AuthResponse>('/auth/register', data, true);
    sessionStore.setTokens(res.tokens);
    return res;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await httpClient.post<AuthResponse>('/auth/login', data, true);
    sessionStore.setTokens(res.tokens);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post<void>('/auth/logout');
    } finally {
      sessionStore.clear();
    }
  }

  async getCurrentUser(): Promise<User> {
    return httpClient.get<User>('/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const res = await httpClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    sessionStore.setTokens(res);
    return res;
  }
}
