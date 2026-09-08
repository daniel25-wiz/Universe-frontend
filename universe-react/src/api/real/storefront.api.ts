/**
 * Real backend implementation of the storefront API.
 *
 * The storefront is a PUBLIC endpoint (buyers on a store domain are not
 * authenticated), so skipAuth is set — no Authorization header is attached
 * and a 401 can never cascade into a token refresh.
 */
import type { Storefront } from '../types';
import type { StorefrontApi } from '../services/storefront';
import { httpClient } from './client';

export class RealStorefrontApi implements StorefrontApi {
  async getStorefront(slug: string): Promise<Storefront> {
    return httpClient.get<Storefront>(`/storefront/${encodeURIComponent(slug)}`, true);
  }
}
