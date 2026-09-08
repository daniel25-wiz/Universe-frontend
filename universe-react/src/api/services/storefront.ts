/**
 * Storefront API contract + factory. Same interface for mock and real backends.
 *
 * The storefront is the seller's PRIVATE MARKETPLACE served on their own
 * domain (storename.<app-domain>). It is a PUBLIC endpoint — buyers visiting
 * a store domain are not authenticated, so no session is required.
 */
import type { Storefront } from '../types';
import { apiConfig } from '../config';
import { MockStorefrontApi } from '../mock/storefront.mock';
import { RealStorefrontApi } from '../real/storefront.api';

export interface StorefrontApi {
  /** Resolve a store by its domain slug, e.g. "globalstore". */
  getStorefront(slug: string): Promise<Storefront>;
}

export const storefrontApi: StorefrontApi =
  apiConfig.mode === 'real' ? new RealStorefrontApi() : new MockStorefrontApi();
