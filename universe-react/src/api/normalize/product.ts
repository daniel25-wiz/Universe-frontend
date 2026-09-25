/**
 * Product normalizers — backend payload -> the UI's `Product` contract.
 *
 * FABRICATION RULES (see docs/API_CONTRACT.md):
 * - `price`, `salePrice`, `stock` are only ever numbers the backend sent.
 *   A missing price is `null` (rendered as "—" by the UI), never 0 — 0 would
 *   present the product as free.
 * - `rating` / `reviews` are review data the backend owns. The frontend never
 *   invents them; a product without reviews is `null`, not 4.9.
 * - `status` is the ONE documented display default: when the backend returns a
 *   product row from a list/detail endpoint it is meant to be visible, so a
 *   missing `status` is treated as "active". The real backend must always send
 *   `status` (contract requirement); this default only protects rendering.
 */
import type {
  PaginatedResponse,
  Product,
  ProductStatus,
  ProductVariant,
} from '../types';
import {
  isRecord,
  pick,
  toBoolean,
  toNumber,
  toText,
  toStringArray,
} from './primitives';

const MAX_VARIANTS = 10;
const MAX_VARIANT_VALUES = 20;

/**
 * Normalize the seller-attested physical condition. Accepts the documented
 * values plus the common spellings a backend might send ("brand_new",
 * "fairly_used", "pre-owned"); anything unrecognized is `null` — the UI then
 * shows "Condition unavailable" rather than inventing a state.
 */
export function normalizeCondition(value: unknown): 'new' | 'used' | null {
  const text = toText(value);
  if (!text) return null;
  const key = text.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (key === 'new' || key === 'brand_new' || key === 'brandnew') return 'new';
  if (key === 'used' || key === 'fairly_used' || key === 'fairlyused' || key === 'preowned' || key === 'pre_owned' || key === 'second_hand') return 'used';
  return null;
}

/** Normalize variant option groups (Size → Small/Medium). Null when there are none. */
export function normalizeVariants(value: unknown): ProductVariant[] | null {
  if (!Array.isArray(value)) return null;
  const groups: ProductVariant[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const name = toText(pick(entry, ['name', 'option', 'label', 'title']));
    if (!name) continue;
    const values = toStringArray(pick(entry, ['values', 'options', 'choices', 'items']));
    if (values.length === 0) continue;
    groups.push({ name, values: values.slice(0, MAX_VARIANT_VALUES) });
    if (groups.length >= MAX_VARIANTS) break;
  }
  return groups.length > 0 ? groups : null;
}

/** Normalize category values returned either as text or as a related object. */
function normalizeCategory(value: unknown): string | undefined {
  const text = toText(value);
  if (text) return text;
  if (!isRecord(value)) return undefined;
  return toText(pick(value, ['name', 'label', 'title', 'value', 'category'])) ?? undefined;
}

/**
 * Normalize one product payload into the UI's `Product` shape.
 *
 * Guarantees everything the marketplace reads without null checks:
 * - numeric `salePrice` / `stock` (backends commonly serialize decimals as
 *   strings — that conversion is normalization, not fabrication),
 * - a real boolean `featuredInMarketplace` (absent = false: the seller has not
 *   opted in, which is the honest default and the conservative one),
 * - `images[0]` mirrored into `imageUrl` so cards and galleries never render
 *   empty when the backend only sends the gallery array (documented
 *   denormalization, the mock API stores the same redundancy).
 */
export function normalizeProduct(raw: unknown): Product {
  const record = isRecord(raw) ? raw : {};
  const images = toStringArray(pick(record, ['images', 'gallery', 'photos', 'imageUrls']));
  const explicitCover = toText(pick(record, ['imageUrl', 'image', 'coverImage', 'thumbnail', 'photo']));
  const cover = explicitCover ?? images[0] ?? null;
  const status: ProductStatus = toText(pick(record, ['status', 'state'])) === 'draft' ? 'draft' : 'active';
  const createdAt = toText(pick(record, ['createdAt', 'created', 'dateCreated'])) ?? '';
  const gallery = cover && !images.includes(cover) ? [cover, ...images] : images;

  return {
    id: toText(pick(record, ['id', 'uuid', 'productId', '_id'])) ?? '',
    sellerId: toText(pick(record, ['sellerId', 'ownerId', 'userId', 'storeId'])) ?? '',
    seller: toText(pick(record, ['seller', 'sellerName', 'storeName', 'shopName'])),
    sellerLogo: toText(pick(record, ['sellerLogo', 'sellerLogoUrl', 'storeLogo', 'storeLogoUrl', 'logoUrl', 'logo', 'avatarUrl'])),
    sellerPhone: toText(pick(record, ['sellerPhone', 'seller_phone', 'phone', 'phoneNumber', 'whatsapp'])),
    name: toText(pick(record, ['name', 'title'])) ?? 'Untitled product',
    description: toText(pick(record, ['description', 'details', 'summary'])),
    price: toNumber(pick(record, ['price', 'amount', 'unitPrice'])),
    salePrice: toNumber(pick(record, ['salePrice', 'discountedPrice', 'discountPrice'])),
    stock: toNumber(pick(record, ['stock', 'quantity', 'inventory', 'stockCount'])),
    sku: toText(pick(record, ['sku', 'code', 'reference'])) ?? undefined,
    // Handover hub shown to buyers. Null when the backend sent none — the UI
    // then renders the platform default (DEFAULT_DELIVERY_LOCATION) rather than
    // inventing a seller-specific address.
    deliveryLocation: toText(pick(record, ['deliveryLocation', 'delivery_location', 'deliveryHub'])),
    category: normalizeCategory(pick(record, ['category', 'categoryName', 'productCategory'])) ,
    status,
    imageUrl: cover,
    imageAlt: toText(pick(record, ['imageAlt', 'imageDescription', 'alt'])),
    images: gallery.length > 0 ? gallery : null,
    variants: normalizeVariants(pick(record, ['variants', 'options'])),
    condition: normalizeCondition(pick(record, ['condition', 'productCondition', 'product_condition', 'itemCondition', 'item_condition'])),
    featuredInMarketplace: toBoolean(pick(record, ['featuredInMarketplace', 'isFeatured', 'featured'])) === true,
    rating: toNumber(pick(record, ['rating', 'averageRating', 'ratingAverage'])),
    reviews: toNumber(pick(record, ['reviews', 'reviewCount', 'reviewsCount'])),
    createdAt,
    updatedAt: toText(pick(record, ['updatedAt', 'updated', 'modifiedAt'])) ?? createdAt,
  };
}

/** Normalize a product list, dropping entries the backend sent without an id. */
export function normalizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => normalizeProduct(entry)).filter((product) => Boolean(product.id));
}

/* ------------------------------ Pagination -------------------------------- */

/**
 * Adapt a list response into the `PaginatedResponse` the hooks expect.
 *
 * Accepted shapes (documented in docs/API_CONTRACT.md):
 * - `{ items, total, page, pageSize }` (frontend contract),
 * - `{ count, results }` / `{ count, next, previous, results }` (DRF),
 * - `{ data: [...] }`, `{ products: [...] }` envelopes,
 * - a bare array.
 *
 * When the backend omits `total`, the honest value is the number of items on
 * THIS page — callers must not guess a larger total.
 */
export function toPaginatedResponse(
  raw: unknown,
  requested: { page: number; pageSize: number },
): PaginatedResponse<Product> {
  const source = Array.isArray(raw)
    ? raw
    : pick(isRecord(raw) ? raw : {}, ['items', 'results', 'data', 'products', 'records', 'rows']);
  const items = normalizeProducts(source);
  const record = isRecord(raw) ? raw : {};
  const total = toNumber(pick(record, ['total', 'count', 'totalCount', 'totalItems'])) ?? items.length;
  const page = toNumber(pick(record, ['page', 'currentPage', 'pageNumber'])) ?? requested.page;
  const pageSize = toNumber(pick(record, ['pageSize', 'perPage', 'limit', 'size'])) ?? requested.pageSize;
  return { items, total, page, pageSize };
}
