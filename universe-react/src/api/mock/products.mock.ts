/**
 * Mock Products API — implements the ProductsApi contract against the mock DB.
 *
 * SECURITY MODEL (ownership & privacy):
 * - createProduct requires a session — products are always owned by the
 *   authenticated seller, never "unknown".
 * - updateProduct / deleteProduct require BOTH a session AND ownership of the
 *   product. A non-owned id returns 404 (not 403) so attackers cannot use the
 *   error to enumerate other sellers' product ids.
 * - Draft products are private: they are hidden from listings and cannot be
 *   fetched by anyone except their owner.
 * - The public catalog (no sellerId) only ever returns active products.
 * - Every write is validated & sanitized server-side (length caps, numeric
 *   bounds, enum whitelists, URL scheme checks).
 */
import type {
  CreateProductRequest,
  Product,
  ProductQueryParams,
  PaginatedResponse,
  UpdateProductRequest,
} from '../types';
import type { ProductsApi } from '../services/products';
import { mockDb, generateId, nowIso } from './mockDatabase';
import { withMockLatency } from './mockLatency';
import { ApiError } from '../errors';
import { logApi } from '../logger';
import { requireSession, getSessionUserSafe } from './sessionGuard';

/** Whitelist of allowed product categories (mirrors the UI select). */
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home',
  'Beauty',
  'Sports',
  'Books',
  'Toys',
  'Other',
] as const;

function failField(fieldErrors: Record<string, string>): never {
  throw new ApiError({
    message: 'Please correct the highlighted fields.',
    status: 422,
    code: 'VALIDATION_ERROR',
    fieldErrors,
  });
}

function checkText(value: string | undefined, field: string, max: number, errors: Record<string, string>): void {
  if (value !== undefined && value !== null && value.trim().length > max) {
    errors[field] = `Must be ${max} characters or fewer`;
  }
}

function checkPrice(value: number | null | undefined, field: string, errors: Record<string, string>): void {
  if (value === undefined || value === null) return;
  if (!Number.isFinite(value) || value < 0) {
    errors[field] = 'Price must be a positive number';
  } else if (value > 10_000_000) {
    errors[field] = 'Price is too large';
  }
}

/** Validate + normalize a create/update payload. Returns only known fields. */
function sanitizeProductInput(
  data: CreateProductRequest,
  partial: boolean,
  errors: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (!partial || data.name !== undefined) {
    const name = data.name?.trim() ?? '';
    if (!name || name.length > 120) errors.name = name ? 'Must be 120 characters or fewer' : 'Product name is required';
    else out.name = name;
  }
  if (data.description !== undefined) {
    checkText(data.description, 'description', 2000, errors);
    out.description = data.description?.trim() || null;
  }
  if (!partial || data.price !== undefined) {
    if (data.price === undefined || data.price === null) errors.price = 'Price is required';
    else checkPrice(data.price, 'price', errors);
    if (!errors.price) out.price = Math.round((data.price as number) * 100) / 100;
  }
  if (data.salePrice !== undefined) {
    checkPrice(data.salePrice, 'salePrice', errors);
    if (!errors.salePrice) out.salePrice = data.salePrice === null ? null : Math.round(data.salePrice * 100) / 100;
  }
  if (data.stock !== undefined) {
    if (data.stock === null) out.stock = null;
    else if (!Number.isInteger(data.stock) || data.stock < 0 || data.stock > 1_000_000) {
      errors.stock = 'Stock must be a whole number of 0 or more';
    } else out.stock = data.stock;
  }
  if (data.sku !== undefined) {
    checkText(data.sku, 'sku', 40, errors);
    out.sku = data.sku?.trim() || null;
  }
  if (data.category !== undefined) {
    const category = data.category?.trim() || null;
    if (category && !(PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
      errors.category = 'Unknown category';
    } else out.category = category;
  }
  if (data.status !== undefined) {
    if (data.status !== 'active' && data.status !== 'draft') errors.status = 'Status must be active or draft';
    else out.status = data.status;
  }
  if (data.imageUrl !== undefined) {
    const url = data.imageUrl;
    if (url && !/^(https?:\/\/|data:image\/)/.test(url)) {
      errors.imageUrl = 'Image must be an http(s) URL or an uploaded image';
    } else if (url && url.length > 500_000) {
      errors.imageUrl = 'Image is too large — use one under 5MB';
    } else out.imageUrl = url || null;
  }
  if (data.imageAlt !== undefined) {
    checkText(data.imageAlt, 'imageAlt', 200, errors);
    out.imageAlt = data.imageAlt?.trim() || null;
  }

  if (Object.keys(errors).length > 0) failField(errors);
  return out;
}

/** Sale price must undercut the regular price (checks the merged result). */
function validateSalePrice(product: Record<string, unknown>): void {
  const price = product.price as number | undefined;
  const salePrice = product.salePrice as number | null | undefined;
  if (price !== undefined && salePrice !== null && salePrice !== undefined && salePrice >= price) {
    failField({ salePrice: 'Sale price must be lower than the regular price' });
  }
}

export class MockProductsApi implements ProductsApi {
  async getProducts(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    logApi('GET', '/products');
    return withMockLatency((async () => {
      const viewer = await getSessionUserSafe();
      let items = mockDb.getCollection('products');

      if (params.sellerId) {
        items = items.filter((p) => p.sellerId === params.sellerId);
        // Full visibility ONLY for the owner's own workshop view; everyone
        // else (including anonymous visitors) sees just active products.
        const isOwnShop = viewer !== null && params.sellerId === viewer.id;
        if (!isOwnShop) items = items.filter((p) => p.status === 'active');
      } else {
        // Public catalog — drafts of ANY seller never leak.
        items = items.filter((p) => p.status === 'active');
      }
      if (params.status) items = items.filter((p) => p.status === params.status);
      if (params.category) items = items.filter((p) => p.category === params.category);
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
        );
      }

      const page = Math.max(1, params.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 12));
      const total = items.length;
      const start = (page - 1) * pageSize;
      const paginated = items.slice(start, start + pageSize);

      return { items: paginated, total, page, pageSize };
    })());
  }

  async getProduct(id: string): Promise<Product> {
    logApi('GET', `/products/${id}`);
    return withMockLatency((async () => {
      const product = mockDb.findById('products', id);
      if (!product) {
        throw new ApiError({ message: 'Product not found.', status: 404, code: 'NOT_FOUND' });
      }
      if (product.status === 'draft') {
        // Drafts are private to their owner — hide even their existence.
        const viewer = await getSessionUserSafe();
        if (!viewer || viewer.id !== product.sellerId) {
          throw new ApiError({ message: 'Product not found.', status: 404, code: 'NOT_FOUND' });
        }
      }
      return product;
    })());
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    logApi('POST', '/products');
    return withMockLatency((async () => {
      // Authentication REQUIRED — no more anonymous "unknown seller" products.
      const { user } = await requireSession();
      const clean = sanitizeProductInput(data, false, {});
      validateSalePrice(clean);
      const timestamp = nowIso();
      return mockDb.insert('products', {
        id: generateId(),
        sellerId: user.id,
        seller: user.fullName,
        ...clean,
        rating: 0,
        reviews: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as never);
    })());
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    logApi('PATCH', `/products/${id}`);
    return withMockLatency((async () => {
      const { user } = await requireSession();
      const existing = mockDb.findById('products', id);
      if (!existing || existing.sellerId !== user.id) {
        // OWNERSHIP ENFORCEMENT — 404 (not 403) to prevent id enumeration.
        throw new ApiError({ message: 'Product not found.', status: 404, code: 'NOT_FOUND' });
      }
      const clean = sanitizeProductInput(data as CreateProductRequest, true, {});
      const merged = { ...existing, ...clean };
      validateSalePrice(merged);
      const updated = mockDb.update('products', id, clean);
      if (!updated) {
        throw new ApiError({ message: 'Product not found.', status: 404, code: 'NOT_FOUND' });
      }
      return updated as Product;
    })());
  }

  async deleteProduct(id: string): Promise<void> {
    logApi('DELETE', `/products/${id}`);
    return withMockLatency((async () => {
      const { user } = await requireSession();
      const existing = mockDb.findById('products', id);
      if (!existing || existing.sellerId !== user.id) {
        // OWNERSHIP ENFORCEMENT — nobody can delete another seller's product.
        throw new ApiError({ message: 'Product not found.', status: 404, code: 'NOT_FOUND' });
      }
      mockDb.remove('products', id);
    })());
  }
}
