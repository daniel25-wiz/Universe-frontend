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
 * - The public catalog (no sellerId) only ever returns active products that
 *   the seller has FEATURED — at most MARKETPLACE_LISTING_LIMIT (2) per seller.
 * - Every write is validated & sanitized server-side (length caps, numeric
 *   bounds, enum whitelists, URL scheme checks).
 */
import type {
  CreateProductRequest,
  Product,
  ProductQueryParams,
  PaginatedResponse,
  ProductVariant,
  UpdateProductRequest,
} from '../types';
import { MARKETPLACE_LISTING_LIMIT, WORKSHOP_PRODUCT_LIMIT } from '../types';
import type { ProductsApi } from '../services/products';
import { mockDb, generateId, nowIso } from './mockDatabase';
import { withMockLatency } from './mockLatency';
import { ApiError } from '../errors';
import { logApi } from '../logger';
import { requireSession, getSessionUserSafe } from './sessionGuard';

/** Whitelist of allowed product categories (mirrors the UI select). */
export const PRODUCT_CATEGORIES = [
  'Fashion',
  'Electronics',
  'Gadgets',
  'Books',
  'Others',
] as const;

/** Caps for the seller-entered variant option groups. */
const MAX_VARIANTS = 10;
const MAX_VARIANT_VALUES = 20;
const MAX_VARIANT_TEXT = 40;

/**
 * Default listing order — newest first.
 *
 * The mock stores rows in insertion order, so without this a seller's brand-new
 * product is appended behind every older row and silently falls off the first
 * page of any paginated listing (the marketplace's catalog is paginated). Order
 * is the backend's job (docs/API_CONTRACT.md), so the mock mirrors the "Newest
 * first" default the workshop UI offers, keeping fresh listings discoverable.
 */
function byNewestFirst(a: Product, b: Product): number {
  return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
}

function withSellerProfile(product: Product): Product {
  const profile = mockDb.query('sellerProfiles', (entry) => entry.userId === product.sellerId)[0];
  return {
    ...product,
    seller: profile?.storeName || product.seller,
    sellerLogo: profile?.logoUrl ?? null,
    sellerPhone: profile?.phone ?? null,
  };
}

/** Count the seller's OTHER active products currently featured in the marketplace. */
function countOtherFeatured(
  sellerId: string,
  excludeProductId: string | null,
): number {
  return mockDb.query('products', (p) => (
    p.sellerId === sellerId
    && p.id !== excludeProductId
    && p.status === 'active'
    && p.featuredInMarketplace === true
  )).length;
}

/**
 * Enforce the listing cap when a product would become featured. Throws a 422
 * with a clear message when the seller already has the maximum number of
 * active products featured in the marketplace.
 */
function enforceListingLimit(
  sellerId: string,
  productId: string | null,
  willBeFeatured: boolean,
): void {
  if (!willBeFeatured) return;
  const otherFeatured = countOtherFeatured(sellerId, productId);
  if (otherFeatured >= MARKETPLACE_LISTING_LIMIT) {
    throw new ApiError({
      message: `You can list at most ${MARKETPLACE_LISTING_LIMIT} products in the public marketplace. Remove one first, then try again.`,
      status: 422,
      code: 'MARKETPLACE_LIMIT_REACHED',
    });
  }
}

/**
 * Enforce the workshop product cap (WORKSHOP_PRODUCT_LIMIT, active + drafts
 * combined) when creating a new product. Throws a 422 with a clear message
 * when the seller has already filled every slot.
 */
function enforceWorkshopLimit(sellerId: string): void {
  const ownedCount = mockDb.query('products', (p) => p.sellerId === sellerId).length;
  if (ownedCount >= WORKSHOP_PRODUCT_LIMIT) {
    throw new ApiError({
      message: `Your workshop is full — you can store up to ${WORKSHOP_PRODUCT_LIMIT} products. Remove one first, then try again.`,
      status: 422,
      code: 'WORKSHOP_LIMIT_REACHED',
    });
  }
}

function failField(fieldErrors: Record<string, string>): never {
  throw new ApiError({
    message: 'Please correct the highlighted fields.',
    status: 422,
    code: 'VALIDATION_ERROR',
    fieldErrors,
  });
}

function checkText(value: string | null | undefined, field: string, max: number, errors: Record<string, string>): void {
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

/**
 * Validate + normalize the seller-entered variant option groups.
 * Every group needs a unique name and at least one value; values are trimmed
 * and de-duplicated case-insensitively (first spelling wins).
 */
function normalizeVariants(
  variants: ProductVariant[],
  errors: Record<string, string>,
): ProductVariant[] {
  const out: ProductVariant[] = [];
  const seenNames = new Set<string>();

  for (const variant of variants) {
    const name = typeof variant?.name === 'string' ? variant.name.trim() : '';
    if (!name) {
      errors.variants = 'Every variant needs a name (for example "Size")';
      return out;
    }
    if (name.length > MAX_VARIANT_TEXT) {
      errors.variants = `Variant names must be ${MAX_VARIANT_TEXT} characters or fewer`;
      return out;
    }
    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) {
      errors.variants = `"${name}" is repeated — each variant name must be unique`;
      return out;
    }
    seenNames.add(nameKey);

    const rawValues = Array.isArray(variant.values) ? variant.values : [];
    const values: string[] = [];
    for (const raw of rawValues) {
      const value = typeof raw === 'string' ? raw.trim() : '';
      if (!value) continue;
      if (value.length > MAX_VARIANT_TEXT) {
        errors.variants = `Values for "${name}" must be ${MAX_VARIANT_TEXT} characters or fewer`;
        return out;
      }
      if (!values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
        values.push(value);
      }
    }
    if (values.length === 0) {
      errors.variants = `Add at least one value for "${name}" (for example "Small")`;
      return out;
    }
    if (values.length > MAX_VARIANT_VALUES) {
      errors.variants = `Each variant can have up to ${MAX_VARIANT_VALUES} values`;
      return out;
    }

    out.push({ name, values });
  }

  return out;
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
  // Delivery hub the product ships from. The Add Product page always sends the
  // platform default; `null` is accepted so a backend row can clear it, and the
  // UI then falls back to DEFAULT_DELIVERY_LOCATION when rendering.
  if (data.deliveryLocation !== undefined) {
    checkText(data.deliveryLocation, 'deliveryLocation', 120, errors);
    out.deliveryLocation = data.deliveryLocation?.trim() || null;
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
  if (data.images !== undefined) {
    if (data.images === null) {
      out.images = null;
    } else if (!Array.isArray(data.images)) {
      errors.images = 'Images must be a list of URLs';
    } else if (data.images.length > 5) {
      errors.images = 'You can add up to 5 images';
    } else {
      const images = data.images.map((u) => u?.trim() || null);
      for (const url of images) {
        if (url && !/^(https?:\/\/|data:image\/)/.test(url)) {
          errors.images = 'Each image must be an http(s) URL or an uploaded image';
          break;
        }
        if (url && url.length > 500_000) {
          errors.images = 'An image is too large — use files under 5MB';
          break;
        }
      }
      if (!errors.images) {
        const cleanImages = images.filter((u): u is string => Boolean(u));
        out.images = cleanImages.length ? cleanImages : null;
      }
    }
  }
  if (data.imageAlt !== undefined) {
    checkText(data.imageAlt ?? undefined, 'imageAlt', 200, errors);
    out.imageAlt = data.imageAlt?.trim() || null;
  }
  if (data.variants !== undefined) {
    if (data.variants === null) {
      out.variants = null;
    } else if (!Array.isArray(data.variants)) {
      errors.variants = 'Variants must be a list of option groups';
    } else if (data.variants.length > MAX_VARIANTS) {
      errors.variants = `You can add up to ${MAX_VARIANTS} variants`;
    } else {
      const variants = normalizeVariants(data.variants, errors);
      if (!errors.variants) out.variants = variants.length ? variants : null;
    }
  }
  // Physical condition chosen by the seller ("Brand New" -> new, "Fairly
  // Used" -> used). Unknown values are rejected so the marketplace badge can
  // only ever render the two documented states.
  if (data.condition !== undefined) {
    if (data.condition !== null && data.condition !== 'new' && data.condition !== 'used') {
      errors.condition = 'Condition must be new or used';
    } else {
      out.condition = data.condition;
    }
  }
  // Marketplace featuring flag. `undefined` = field untouched (partial updates);
  // `null` is normalized to `false` so lists can filter with a plain boolean.
  if (data.featuredInMarketplace !== undefined) {
    if (data.featuredInMarketplace !== null && typeof data.featuredInMarketplace !== 'boolean') {
      errors.featuredInMarketplace = 'Featured must be true or false';
    } else {
      out.featuredInMarketplace = data.featuredInMarketplace === true;
    }
  }

  // Keep the denormalized cover in sync with the gallery: when the caller
  // provides `images` (but not an explicit `imageUrl`), the first image
  // becomes the cover.
  if (Array.isArray(out.images) && out.images.length > 0 && out.imageUrl === undefined) {
    out.imageUrl = out.images[0];
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
        // Public catalog — drafts of ANY seller never leak, and only products
        // the seller chose to feature are listed (at most 2 per seller).
        // Everything else stays reachable via the seller's shop page.
        items = items.filter((p) => p.status === 'active');
        items = items.filter((p) => p.featuredInMarketplace === true);
      }
      items = [...items].sort(byNewestFirst);
      if (params.status) items = items.filter((p) => p.status === params.status);
      if (params.category) items = items.filter((p) => p.category === params.category);
      // Explicit featured filter (ProductQueryParams.featured). When omitted
      // the default visibility scoping above stays in charge.
      if (params.featured !== undefined) {
        items = items.filter((p) => p.featuredInMarketplace === params.featured);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
        );
      }

      const page = Math.max(1, params.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 40));
      const total = items.length;
      const start = (page - 1) * pageSize;
      const paginated = items.slice(start, start + pageSize).map(withSellerProfile);

      return { items: paginated, total, page, pageSize };
    })());
  }

  /**
   * Opt-in aggregation — trivial for the mock (everything is in-memory), it
   * exists to satisfy the shared ProductsApi interface. Mirrors the real
   * adapter's contract: returns every matching item in one response.
   */
  async getAllProducts(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    logApi('GET', '/products?all');
    return withMockLatency((async () => {
      const viewer = await getSessionUserSafe();
      let items = mockDb.getCollection('products');

      if (params.sellerId) {
        items = items.filter((p) => p.sellerId === params.sellerId);
        const isOwnShop = viewer !== null && params.sellerId === viewer.id;
        if (!isOwnShop) items = items.filter((p) => p.status === 'active');
      } else {
        items = items.filter((p) => p.status === 'active');
        items = items.filter((p) => p.featuredInMarketplace === true);
      }
      items = [...items].sort(byNewestFirst);
      if (params.status) items = items.filter((p) => p.status === params.status);
      if (params.category) items = items.filter((p) => p.category === params.category);
      if (params.featured !== undefined) {
        items = items.filter((p) => p.featuredInMarketplace === params.featured);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
        );
      }

      return {
        items: items.map(withSellerProfile),
        total: items.length,
        page: Math.max(1, params.page ?? 1),
        pageSize: items.length,
      };
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
      return withSellerProfile(product);
    })());
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    logApi('POST', '/products');
    return withMockLatency((async () => {
      // Authentication REQUIRED — no more anonymous "unknown seller" products.
      const { user } = await requireSession();
      const clean = sanitizeProductInput(data, false, {});
      validateSalePrice(clean);
      // The cap only applies to ACTIVE products — a featured draft can be
      // created freely; publishing it later re-runs the check (updateProduct).
      const createdIsActive = clean.status !== 'draft';
      // The workshop cap applies to ALL products (active + drafts combined).
      enforceWorkshopLimit(user.id);
      enforceListingLimit(user.id, null, clean.featuredInMarketplace === true && createdIsActive);
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
      // Cap applies whenever the MERGED product is a featured active product
      // and it was not already counted as one (so un-featuring stays allowed).
      const alreadyFeaturedActive = existing.featuredInMarketplace === true && existing.status === 'active';
      const willBeFeatured = merged.featuredInMarketplace === true && merged.status === 'active';
      if (willBeFeatured && !alreadyFeaturedActive) {
        enforceListingLimit(user.id, id, true);
      }
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
