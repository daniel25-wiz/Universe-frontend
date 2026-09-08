/**
 * Auth API contract + factory.
 *
 * Components/hooks only ever see this `authApi` object which satisfies the
 * AuthApi interface. Whether it currently resolves to the in-browser mock or
 * the real HTTP client depends ENTIRELY on VITE_API_MODE — nothing else.
 */
import type {
  AuthResponse,
  GoogleLoginRequest,
  LoginRequest,
  RefreshTokenResponse,
  RegisterRequest,
  User,
} from '../types';
import { apiConfig } from '../config';
import { MockAuthApi } from '../mock/auth.mock';
import { RealAuthApi } from '../real/auth.api';

export interface AuthApi {
  register(data: RegisterRequest): Promise<AuthResponse>;
  login(data: LoginRequest): Promise<AuthResponse>;
  /**
   * Google sign-in/sign-up. The credential is the simulated Google account
   * object in mock mode and the real Google ID token (JWT) string once the
   * real backend + Google Identity Services land — the signature never
   * changes, so callers stay backend-agnostic.
   */
  googleLogin(data: GoogleLoginRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
}

export const authApi: AuthApi = apiConfig.mode === 'real' ? new RealAuthApi() : new MockAuthApi();