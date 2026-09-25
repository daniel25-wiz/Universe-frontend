/**
 * Real Products API — implements the ProductsApi contract against the real
 * backend through the DOCUMENTED server-side pagination endpoint
 * `GET /products` (docs/API_CONTRACT.md).
 *
 * DESIGN RULE: the backend owns filtering, searching, sorting and paging. One
 * `getProducts()` call performs exactly ONE HTTP request — the adapter never
 * downloads the catalog page-by-page and filters locally. When the backend
 * caps `pageSize` it simply returns its own page size; the UI then either
 * accepts the smaller page or uses explicit pagination.
 *
 * `getAllProducts()` is the ONLY multi-request path: an explicit, opt-in
 * aggregation helper (max 20 requests) for callers that genuinely need every
 * matching item (e.g. export/backfill tooling). No UI code uses it today.
 *
 * Every payload passes through the normalizers in ../normalize, so the whole
 * marketplace keeps working whatever dialect the backend speaks: snake_case
 * keys, DRF pagination (`{ count, results }`), string numbers, or
 * `{ data: ... }` envelopes.
 */
import type {
  CreateProductRequest,
  Product,
  ProductQueryParams,
  PaginatedResponse,
  UpdateProductRequest,
} from '../types';
import type { ProductsApi } from '../services/products';
import { ApiError } from '../errors';
import { httpClient } from './client';
import {
  isRecord,
  normalizeProduct,
  toPaginatedResponse,
  unwrapEnvelope,
} from '../normalize';

/**
 * Safety valve for `getAllProducts` ONLY: one aggregation never fires more
 * HTTP requests than this, however the backend chooses to paginate.
 */
const MAX_PAGE_REQUESTS = 20;
/** Prevent a normal UI list call from requesting an unbounded catalog page. */
const MAX_NORMAL_PAGE_SIZE = 50;

/** Build the query string exactly as documented in docs/API_CONTRACT.md. */
export function buildProductQuery(values: ProductQueryParams): string {
  const sp = new URLSearchParams();
  if (values.sellerId) sp.set('seller_id', values.sellerId);
  if (values.status) sp.set('status', values.status);
  if (values.category) sp.set('category', values.category);
  if (values.search) sp.set('search', values.search);
  if (values.featured !== undefined) sp.set('featured', String(values.featured));
  if (values.page) sp.set('page', String(values.page));
  if (values.pageSize) sp.set('page_size', String(values.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/** Contract-violating 2xx response (no usable product id) -> explicit error. */
function productShapeError(): ApiError {
  return new ApiError({
    message: 'The server returned an unexpected product response.',
    status: 0,
    code: 'UNKNOWN_ERROR',
  });
}

export class RealProductsApi implements ProductsApi {
  /**
   * List products — ONE server request, server-side pagination.
   *
   * The workshop, buyer search, seller shop and storefront pages may ask for
  * large page sizes; this adapter caps normal requests at 50 and the backend
  * may apply a lower maximum. The frontend NEVER walks remaining pages here —
   * see `getAllProducts()` for the explicit opt-in aggregation.
   */
  async getProducts(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    const requested = {
      page: Math.max(1, params.page ?? 1),
      pageSize: Math.min(MAX_NORMAL_PAGE_SIZE, Math.max(1, params.pageSize ?? 40)),
    };
    const response = toPaginatedResponse(
      await httpClient.get<unknown>(`/products${buildProductQuery({ ...params, ...requested })}`),
      requested,
    );
    return response;
  }

  /**
   * OPT-IN aggregation: fetch EVERY matching product by walking pages, capped
   * at MAX_PAGE_REQUESTS requests. Explicit by design — a caller that runs
   * this accepts up to 20 HTTP round-trips. Nothing in the UI uses it today.
   */
  async getAllProducts(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    const requested = {
      page: Math.max(1, params.page ?? 1),
      pageSize: Math.max(1, params.pageSize ?? 40),
    };
    const first = toPaginatedResponse(
      await httpClient.get<unknown>(`/products${buildProductQuery({ ...params, ...requested })}`),
      requested,
    );
    const collected = [...first.items];
    const seen = new Set(collected.map((product) => product.id));
    const backendPageSize = first.pageSize > 0 ? first.pageSize : requested.pageSize;

    for (let request = 1; request < MAX_PAGE_REQUESTS; request += 1) {
      if (collected.length >= first.total) break;
      const cursor = requested.page + request;
      const next = toPaginatedResponse(
        await httpClient.get<unknown>(
          `/products${buildProductQuery({ ...params, page: cursor, pageSize: backendPageSize })}`,
        ),
        { page: cursor, pageSize: backendPageSize },
      );
      const added = next.items.filter((product) => !seen.has(product.id));
      if (added.length === 0) break; // exhausted / backend ignored `page`
      added.forEach((product) => seen.add(product.id));
      collected.push(...added);
    }

    return { items: collected, page: requested.page, pageSize: requested.pageSize, total: first.total };
  }

  async getProduct(id: string): Promise<Product> {
    const raw = await httpClient.get<unknown>(`/products/${encodeURIComponent(id)}`);
    const product = normalizeProduct(unwrapEnvelope(raw, ['product', 'data', 'item']));
    if (!product.id) throw productShapeError();
    return product;
  }

  /**
   * Create a product. The backend MUST return the created product (200/201).
   * The adapter never merges the REQUEST into the response — that would
   * pretend the backend stored exactly what the client sent.
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const raw = await httpClient.post<unknown>('/products', data);
    const product = normalizeProduct(unwrapEnvelope(isRecord(raw) ? raw : {}, ['product', 'data', 'item']));
    if (!product.id) throw productShapeError();
    return product;
  }

  /**
   * Update a product. The backend MUST return the updated product; when it
   * answers 204/empty the adapter re-reads the authoritative record instead
   * of echoing the submitted patch back as if it were server truth.
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const raw = await httpClient.patch<unknown>(`/products/${encodeURIComponent(id)}`, data);
    const body = unwrapEnvelope(isRecord(raw) ? raw : {}, ['product', 'data', 'item']);
    if (isRecord(body) && normalizeProduct(body).id) {
      return normalizeProduct(body);
    }
    return this.getProduct(id);
  }

  async deleteProduct(id: string): Promise<void> {
    return httpClient.delete<void>(`/products/${encodeURIComponent(id)}`);
  }
}
