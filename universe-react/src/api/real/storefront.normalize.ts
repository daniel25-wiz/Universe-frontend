/**
 * Storefront normalizer for GET /storefront/:slug (REAL backend).
 *
 * PURPOSE: convert the backend payload into the shape StorefrontPage renders.
 * StorefrontPage reads ~40 fields and calls `.toFixed()`, `.toLocaleString()`
 * and `.map()` on several of them, so every field must exist — but existence
 * is achieved with NULL for unknown business data, never with invented values.
 *
 * FABRICATION RULES (docs/API_CONTRACT.md -> Storefront):
 * - rating / reviewCount / followers are SELLER-OWNED stats: pass through or
 *   null. They are never derived from the product catalog, never defaulted to
 *   4.9/2104 — the UI renders "—" / "No reviews yet" for null.
 * - badge (flash/bestseller) is set ONLY when the backend sends it. It is
 *   never inferred from a salePrice — a discount is not a flash sale.
 * - campusPickup is pass-through only; it is never inferred from a category.
 * - popularity is pass-through only; never synthesized from ratings.
 * - assurances (stockNote, pickupNote, badgeLabel, campusTag, bioLead,
 *   reviewsNote) are the seller's words: pass-through or null.
 * - prices are passed through as numbers; a formatted `priceLabel` is derived
 *   ONLY from a real price (display formatting, not new data).
 *
 * The cosmetic values below are the ONLY derivations allowed, all documented:
 * - `slug`/`domain` are routing/display values derived from the requested slug,
 * - `whatsappUrl` built from the seller's real phone,
 * - `catalogCounts` counted from the catalog the response actually contains
 *   (backend-sent counts win when present),
 * - `memberSinceLabel` from the backend's real member-since/createdAt date,
 * - `pickupNote` naming the backend's real pickupLocation,
 * - `imageAlt` from the product name (accessibility),
 * - `/logo.png` placeholder where an <img> would otherwise break.
 */
import type {
  ProductVariant,
  Storefront,
  StorefrontAssurance,
  StorefrontBioBadge,
  StorefrontCategory,
  StorefrontProduct,
  StorefrontReview,
} from '../types';
import { getPrettyStoreDomain } from '../../lib/storeDomain';
import {
  isRecord,
  pick,
  toBoolean,
  toNumber,
  toText,
  toStringArray,
} from '../normalize';

/** Category buckets shown on the storefront tab bar. */
const CATEGORY_LABELS: Record<StorefrontCategory, string> = {
  tech: 'Tech & Gadgets',
  campus: 'Campus Essentials',
  lifestyle: 'Lifestyle & Accessories',
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as StorefrontCategory[];

/** Last-resort cover so an `<img src>` never renders a broken-image icon. */
const PLACEHOLDER_IMAGE = '/logo.png';

/**
 * Free-form category text -> storefront bucket.
 *
 * DERIVED: bucketing is a UI routing concern (which tab a product appears
 * under); the backend's own category text is never modified.
 */
export function storefrontCategory(value: unknown): StorefrontCategory {
  const text = (toText(value) ?? '').toLowerCase();
  if (CATEGORY_KEYS.includes(text as StorefrontCategory)) return text as StorefrontCategory;
  if (/tech|electronic|gadget|phone|laptop|computer|device|accessor/.test(text)) return 'tech';
  if (/campus|school|book|station|study|supplie/.test(text)) return 'campus';
  return 'lifestyle';
}

/** "₦1,249" style — storefront prices are formatted in Nigerian Naira. */
function ngn(value: number): string {
  return `₦${Math.round(value).toLocaleString('en-US')}`;
}

/** "07051917468" -> "https://wa.me/2347051917468" (empty when no phone). */
function toWhatsappUrl(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return `https://wa.me/234${local}`;
}

/** Year from an ISO date; null when the value is not a usable date. */
function yearOf(value: unknown): number | null {
  const text = toText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

/* --------------------------- Storefront products -------------------------- */

/** Normalize variant option groups (null when there are none). */
function normalizeStorefrontVariants(value: unknown): ProductVariant[] | null {
  if (!Array.isArray(value)) return null;
  const groups: ProductVariant[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const name = toText(pick(entry, ['name', 'label', 'option']));
    const values = toStringArray(pick(entry, ['values', 'options', 'choices']));
    if (name && values.length > 0) groups.push({ name, values });
  }
  return groups.length > 0 ? groups : null;
}

/**
    announcementTitle: toText(pick(record, ['announcementTitle'])),
    announcementLead: toText(pick(record, ['announcementLead'])),
 * `StorefrontProduct` (`priceLabel` + `image`).
 *
 * Entries without an id are DROPPED (they cannot be opened, saved to a cart,
 * or keyed by React) — never given a synthetic identity.
 */
export function normalizeStorefrontProduct(raw: unknown): StorefrontProduct | null {
  const record = isRecord(raw) ? raw : {};
  const id = toText(pick(record, ['id', 'uuid', '_id']));
  if (!id) return null;
  const name = toText(pick(record, ['name', 'title'])) ?? 'Untitled product';

  const images = toStringArray(pick(record, ['images', 'gallery', 'photos']));
  const cover = toText(pick(record, ['image', 'imageUrl', 'coverImage', 'photo', 'thumbnail']));
  const gallery = cover && !images.includes(cover) ? [cover, ...images] : images;
  // DERIVED (placeholder): an <img> with no src breaks the grid — fall back
  // to the app logo instead of inventing product imagery.
  if (gallery.length === 0) gallery.push(PLACEHOLDER_IMAGE);

  const price = toNumber(pick(record, ['price', 'amount']));
  const salePrice = toNumber(pick(record, ['salePrice', 'discountedPrice', 'discountPrice']));
  // DERIVED: when the backend sends both prices, buyers see the sale price and
  // the regular price becomes the strikethrough. Both come from the backend.
  const onSale = salePrice !== null && price !== null && salePrice < price;
  const displayPrice = onSale ? (salePrice as number) : price;

  const category = storefrontCategory(pick(record, ['category', 'categoryLabel', 'bucket']) ?? name);
  const badgeText = toText(pick(record, ['badge']));
  const variants = normalizeStorefrontVariants(pick(record, ['variants', 'options']));

  return {
    id,
    name,
    description: toText(pick(record, ['description', 'details', 'summary'])),
    category,
    // DERIVED: display label for the backend's category bucket.
    categoryLabel: toText(pick(record, ['categoryLabel'])) ?? CATEGORY_LABELS[category],
    price: displayPrice,
    // DERIVED: format the real price; a backend-formatted label wins as-is.
    priceLabel: toText(pick(record, ['priceLabel'])) ?? (displayPrice !== null ? ngn(displayPrice) : null),
    // DERIVED: strikethrough of the real regular price during a real sale.
    oldPriceLabel: onSale ? ngn(price as number) : (toText(pick(record, ['oldPriceLabel', 'oldPrice'])) ?? null),
    rating: toNumber(pick(record, ['rating', 'averageRating'])),
    reviews: toNumber(pick(record, ['reviews', 'reviewCount', 'reviewsCount'])),
    popularity: toNumber(pick(record, ['popularity', 'sold', 'sales'])),
    stock: toNumber(pick(record, ['stock', 'quantity', 'inventory'])),
    badge: badgeText === 'flash' || badgeText === 'bestseller' ? badgeText : null,
    campusPickup: toBoolean(pick(record, ['campusPickup'])),
    image: gallery[0],
    // DERIVED: accessibility label from the real product name.
    imageAlt: toText(pick(record, ['imageAlt', 'imageDescription', 'alt'])) ?? name,
    images: gallery,
    variants: variants ?? undefined,
  };
}

/* ----------------------------- Storefront tabs ---------------------------- */

function normalizeAssurances(value: unknown): StorefrontAssurance[] {
  if (!Array.isArray(value)) return [];
  const tones = ['primary', 'success', 'tertiary'] as const;
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const icon = toText(pick(entry, ['icon']));
    const title = toText(pick(entry, ['title']));
    if (!icon || !title) return [];
    const tone = toText(pick(entry, ['tone']));
    return [{
      icon,
      tone: (tones as readonly string[]).includes(tone ?? '') ? (tone as StorefrontAssurance['tone']) : 'primary',
      title,
      sub: toText(pick(entry, ['sub', 'subtitle', 'description'])) ?? '',
    }];
  });
}

function normalizeBioBadges(value: unknown): StorefrontBioBadge[] {
  if (!Array.isArray(value)) return [];
  const tones = ['success', 'primary', 'tertiary'] as const;
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const icon = toText(pick(entry, ['icon']));
    const label = toText(pick(entry, ['label', 'text', 'title']));
    if (!icon || !label) return [];
    const tone = toText(pick(entry, ['tone']));
    return [{
      icon,
      tone: (tones as readonly string[]).includes(tone ?? '') ? (tone as StorefrontBioBadge['tone']) : 'primary',
      label,
    }];
  });
}

function normalizeReviews(value: unknown): StorefrontReview[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    if (!isRecord(entry)) return [];
    const name = toText(pick(entry, ['name', 'author', 'buyerName']));
    const text = toText(pick(entry, ['text', 'body', 'comment']));
    if (!name || !text) return [];
    const tone = toText(pick(entry, ['avatarTone', 'tone']));
    return [{
      id: toText(pick(entry, ['id', 'uuid'])) ?? `rev-${index}`,
      initials: toText(pick(entry, ['initials'])) ?? name.trim().charAt(0).toUpperCase(),
      name,
      meta: toText(pick(entry, ['meta', 'subtitle', 'context'])) ?? '',
      text,
      avatarTone: tone === 'secondary' ? 'secondary' : 'primary',
    }];
  });
}

/**
 * Catalog tab counts.
 *
 * Backend-sent counts win when present. Otherwise the tabs count the catalog
 * ACTUALLY INCLUDED in this response — an honest tally of real data, never an
 * estimate of a larger catalog. When no catalog is present every count is 0.
 */
function normalizeCatalogCounts(
  value: unknown,
  products: StorefrontProduct[],
): Record<StorefrontCategory | 'all', number> {
  const record = isRecord(value) ? value : {};
  const countIn = (bucket: StorefrontCategory) => products.filter((p) => p.category === bucket).length;
  const zero = toNumber(pick(record, ['all', 'total']));
  return {
    all: zero ?? products.length,
    tech: toNumber(pick(record, ['tech'])) ?? countIn('tech'),
    campus: toNumber(pick(record, ['campus'])) ?? countIn('campus'),
    lifestyle: toNumber(pick(record, ['lifestyle'])) ?? countIn('lifestyle'),
  };
}

/* ------------------------------- Storefront ------------------------------- */

/**
 * Build a renderable `Storefront` from the backend payload.
 *
 * @param raw  Whatever `GET /storefront/:slug` returned (already unwrapped).
 * @param slug Slug used to resolve the store — authoritative for the URL,
 *             the display domain and the cosmetic store code.
 */
export function normalizeStorefront(raw: unknown, slug: string): Storefront {
  const record = isRecord(raw) ? raw : {};
  const embedded = pick(record, ['products', 'catalog', 'items', 'storeProducts']);
  const catalog = Array.isArray(embedded) ? embedded : [];
  const products = catalog
    .map((entry) => normalizeStorefrontProduct(entry))
    .filter((entry): entry is StorefrontProduct => entry !== null);

  const name = toText(pick(record, ['name', 'storeName', 'title'])) ?? slug;
  const owner = toText(pick(record, ['owner', 'ownerName', 'sellerName', 'fullName'])) ?? '';
  const school = toText(pick(record, ['school', 'university', 'institution'])) ?? '';
  const phone = toText(pick(record, ['phone', 'phoneNumber', 'whatsapp'])) ?? '';
  const bannerImages = toStringArray(pick(record, ['bannerImages', 'banners']));
  // DERIVED: the hero image mirrors the first gallery image when only the
  // array is sent (the mock API denormalizes the same way).
  const bannerImage = toText(pick(record, ['bannerImage', 'bannerUrl', 'banner'])) ?? bannerImages[0] ?? null;
  const avatarImage = toText(pick(record, ['avatarImage', 'logoUrl', 'logo']));
  const pickupLocation = toText(pick(record, ['pickupLocation', 'location']));

  // DERIVED: "Since <year>" from the backend's real membership date only —
  // when no date exists the label is null, never the current year.
  const sinceYear = yearOf(pick(record, ['memberSince', 'createdAt']));
  const memberSinceLabel = toText(pick(record, ['memberSinceLabel']))
    ?? (sinceYear !== null ? `Since ${sinceYear}` : null);

  return {
    slug: toText(pick(record, ['slug'])) ?? slug,
    name,
    owner,
    school,
    // Backend-owned identifier. Missing means the backend did not provide one.
    storeId: toText(pick(record, ['storeId'])),
    sellerId: toText(pick(record, ['sellerId', 'userId', 'ownerId', 'sellerUserId'])),
    // SELLER STATS: pass through or null. Never derived from the catalog.
    rating: toNumber(pick(record, ['rating', 'averageRating'])),
    reviewCount: toNumber(pick(record, ['reviewCount', 'reviewsCount'])),
    followers: toNumber(pick(record, ['followers', 'followerCount'])),
    // Seller metrics are backend-owned; absence stays null.
    fulfillmentLabel: toText(pick(record, ['fulfillmentLabel'])),
    responseTimeLabel: toText(pick(record, ['responseTimeLabel'])),
    memberSinceLabel,
    badgeLabel: toText(pick(record, ['badgeLabel'])),
    campusTag: toText(pick(record, ['campusTag'])),
    stockNote: toText(pick(record, ['stockNote'])),
    // DERIVED: name the backend's real pickup hub; null when there is none.
    pickupNote: toText(pick(record, ['pickupNote']))
      ?? (pickupLocation ? `Campus Pickup: ${pickupLocation}` : null),
    template: toText(pick(record, ['template', 'storeTemplate', 'theme'])),
    pickupLocation,
    // DERIVED: pretty display domain from the requested slug (routing aid).
    domain: toText(pick(record, ['domain'])) ?? getPrettyStoreDomain(slug),
    // DERIVED: deep-link built from the seller's real phone; '' when none.
    whatsappUrl: toText(pick(record, ['whatsappUrl'])) ?? toWhatsappUrl(phone),
    phone,
    email: toText(pick(record, ['email', 'supportEmail'])),
    couponCode: toText(pick(record, ['couponCode'])) ?? '',
    announcementTitle: toText(pick(record, ['announcementTitle'])),
    announcementLead: toText(pick(record, ['announcementLead'])),
    bannerImage,
    bannerImages: bannerImages.length > 0 ? bannerImages : (bannerImage ? [bannerImage] : []),
    bannerAlt: toText(pick(record, ['bannerAlt'])) ?? undefined,
    avatarImage,
    avatarAlt: toText(pick(record, ['avatarAlt'])) ?? undefined,
    bioLead: toText(pick(record, ['bioLead', 'bio'])),
    bioDetail: toText(pick(record, ['bioDetail'])),
    bioBadges: normalizeBioBadges(pick(record, ['bioBadges'])),
    reviews: normalizeReviews(pick(record, ['reviews', 'reviewList'])),
    reviewsNote: toText(pick(record, ['reviewsNote'])),
    assurances: normalizeAssurances(pick(record, ['assurances'])),
    catalogCounts: normalizeCatalogCounts(pick(record, ['catalogCounts', 'counts']), products),
    products,
  };
}
