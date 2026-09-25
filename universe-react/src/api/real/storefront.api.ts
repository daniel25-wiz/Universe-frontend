/**
 * Real backend implementation of the storefront API.
 *
 * Performs exactly ONE documented request: `GET /storefront/:slug`
 * (public — buyers on a store domain are not authenticated, so skipAuth is
 * set and a 401 can never cascade into a token refresh).
 *
 * RESPONSIBILITY BOUNDARY: this adapter never calls other API implementations
 * (no hidden products-API dependency). The backend is expected to EMBED the
 * store's catalog in the response; when it does not, the response still
 * carries `sellerId` and the documented product API (`GET /products?sellerId=`)
 * can be used SEPARATELY — composition happens in the hook/UI layer, never
 * inside this class. Nothing is fabricated to fill an empty catalog: the page
 * simply renders its empty state.
 */
import type { Storefront } from '../types';
import type { StorefrontApi } from '../services/storefront';
import { slugifyStoreName } from '../../lib/storeDomain';
import { httpClient } from './client';
import { isRecord, unwrapEnvelope } from '../normalize';
import { normalizeStorefront } from './storefront.normalize';

/** Envelopes a backend may wrap the storefront payload in. */
const STOREFRONT_ENVELOPE = ['storefront', 'store', 'data'];

export class RealStorefrontApi implements StorefrontApi {
  async getStorefront(slug: string): Promise<Storefront> {
    const raw = await httpClient.get<unknown>(`/storefront/${encodeURIComponent(slug)}`, true);
    const payload = unwrapEnvelope(isRecord(raw) ? raw : {}, STOREFRONT_ENVELOPE);
    return normalizeStorefront(payload, slugifyStoreName(slug) || slug);
  }
}
