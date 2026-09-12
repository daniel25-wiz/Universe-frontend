/**
 * Mock Storefront API — implements the StorefrontApi contract.
 *
 * Serves the content of seller_private_market_storefront.html as live data:
 * every string, image, badge and metric below is ported 1:1 from that mockup.
 *
 * Store resolution (public — no session required):
 * - The slug "globalstore" (or "demo"/"store") resolves to the DEMO store so
 *   the mockup experience is always available.
 * - A slug that matches a registered seller's store name (slugified) resolves
 *   to that seller: their identity, contact channels and active products are
 *   used, with the demo catalog as fallback imagery. Sellers who never set a
 *   store name get their domain from their full name (see getStoreDisplayName
 *   in src/lib/user.js), so the owner's full name is matched as a fallback.
 * - Any other slug still resolves to a public storefront fallback in mock
 *   mode, so visitors never get blocked by authentication or local mock data.
 */
import type {
  Storefront,
  StorefrontCategory,
  StorefrontProduct,
} from '../types';
import type { StorefrontApi } from '../services/storefront';
import { mockDb } from './mockDatabase';
import { withMockLatency } from './mockLatency';
import { logApi } from '../logger';
import { slugifyStoreName, getPrettyStoreDomain } from '../../lib/storeDomain';

/* --------------------------------- Images -------------------------------- */

const IMG_BANNER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDsU5F19e9BXoCzc3oFuNZwEDGnKRAmgJO4cCrCAM6qBDg-RA9N4r8_9-ziu7m3h30cxZDZ4sur2r5LYocLnWF7Uv36b75RyRDuVPYgHZaFAwFt5vNDi-G8T6jjoRkvodiKPX0Zf6DyWQeUbuLTwnHQ9_X3fde9iwsAqjetZeYIKesLu9mgRQG613MG59-oSNrHu4Uq-MTGu0wZPLLgrYTbjwKwsmfsh5FKew8vIC3gj2k0esDp16bF';
const IMG_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCV-OyoDMB9cNW7TRar4Tpi3rjnOyF9MLl1bdI0aGysVEGye_nUuspS0Kad6Lv6p6NF7NE26a-A3hYx8_6g0xW9RGKS9Y2G6QrG67XCLHIdfwqc4-Sjz_csLcTxQqWLFsmmPJFwl2Cel4XskqpOjI6dSPdWY7MgCXJPuhWb0kCBNWuFsOjKNymtsHIWlELu_dmfQScSPwNkA6IuAQD35N1QhaJ-gdPgG4xXFxih7ygAF2GEclI-KbDU';
const IMG_MUG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC-4Jw14PcJQEKQRR80_oKSf4ZRG9sXmyP_smaCPfMNR8gm27CczrrP-qxfaZkN_BBEM5dd7k_Cj3YwhUuYGxLwFmUmcawQmj7ShIfbP7lgO0UhIvN3-0LBMEd0Q8fxAiB8GEz9TqSR0iR7GadVyUyr1ZJaEfbArxGAknPHTIPGN_5htawOCe9OYyrQa5ZQEphXY8Bf50tgvpEn254G5o1Kgkxo9z8KANdv4bO_6J3wF95DJ7RhoHZS';
const IMG_WALLET =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAIGaUR3E2SNZR-ub273D0T7pk1aypuxBPlV1O7d1F8zb4_pOoRNFVWT3tTNJ-fl7bjbeRuKFvKR224KfrTHS3kyXHSlc3lm0CUq3Cfy36vmHU9Wdna_MGETA2Ff0xW6cz5ZjtcwLzfeEAYJNZsD2B2HmbY5loaVP3jO6NkCkqoUGFmxqfziO4K1Ud5NlwY9a-rXjKy147V6YdzZwW0M6iH_pLM9Sv-dsEV8Qk2J4AZPGZmsloelhF2';
const IMG_LAMP =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIv2CHYZVO5MF4XKNkqt0Xu3pl9N_D-rN8uwd5ixCH4MphY-CUYbLovGSbcDQJXCeAVLZTGMeO-UTXntssVY2CK5FELABHyn_HXJ5UTaUYOUuWwNCY1oli6FFkUM8etdaE1hIZI2EZYM4fcFQPzQVkvXro0E-SeugPxQ4GCabU1fAtDVBNibaCMg-_ZBmf-Ix9YUJ-T_x07AMrOx7DLAyS-jHKGny5hCdjMqsHvf8ZXDcTZvz21CC_';
const IMG_HEADPHONES =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDvkAfdHfBLKPUJEWccoLtVa7X-LybT2P-xauUxZfqV8SSr-80BvTLimV9BIbCJ2n3lGwUo1kA7coxRLJsZ1OJXQm8GFCgdZd8m3KzWuptN4DEc_EvQ-IpdlhKj-njs4lcH3ebB7M-9aRpfsnIiSMF1VlP6iB9ft5zkUHDXCgAqN-XA9H2AswNkyO_FawFRDvSDDJBrznyAAls1FmD5-ef4XWZdznYet2WRowD9QjgSL1wpYjFLGDlg';
const IMG_SLEEVE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDrAZqctvXwDe1DTmv9BN00h9fROZTuxtwWa076Av9iAjxblFfMoMlJ-FxfImUFnuKl3Q-_1CPKioJeCFpsytqP99bV7_c2txhw-dR0AMsOan45pRd-Eh9UQlS5bEcd8F0sGLjKGaVvCWdXLk8QVIuX6dJBWjQehi6VC0ADWFulRvGi5R3oH4rvxrTM1BBevIpVDvavhdYd6ne30k3JdkbOiqVP65V6f8O1tvzjl6bVquzOrtTmLaQc';
const IMG_CUSHION =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBIfUPVEiEKGIKDKcHwjGPyVfR9lTqknQ7xAfDb1Hfybqg6onPxPMD8F1CLwNcoVlh5acrM7kpZSXstaBaZiBOLXub3ue3sMmA-ZqUQALu2vRCP6mKvHY8uVneZpkZhtzZgVAxPqYqi2_5TZr5UEcEv7KrrkZBcjMLOHM1SvJlll6SI7-dBFytnQ8-2tlf6JxJXG7tcbojThRX05XCv0sTPRKMg9FQHtqYfSSk8zKX4YDAPPT-YInsE';

/** Cycle-through images for personalized products without their own photo. */
const FALLBACK_IMAGES = [IMG_MUG, IMG_WALLET, IMG_LAMP, IMG_HEADPHONES, IMG_SLEEVE, IMG_CUSHION];

const CATEGORY_LABELS: Record<StorefrontCategory, string> = {
  tech: 'Tech & Gadgets',
  campus: 'Campus Essentials',
  lifestyle: 'Lifestyle & Accessories',
};

/* ------------------------------- Demo catalog ----------------------------- */

const DEMO_PRODUCTS: StorefrontProduct[] = [
  {
    id: 'sf-mug',
    name: 'Minimalist Ceramic Mug',
    description: 'Durable double-glazed 350ml cup. Perfect for late-night study sessions in hostel or campus dorms.',
    category: 'campus',
    categoryLabel: CATEGORY_LABELS.campus,
    price: 37200,
    priceLabel: '₦37,200',
    rating: 4.9,
    reviews: 128,
    popularity: 128,
    stock: 45,
    campusPickup: true,
    image: IMG_MUG,
    imageAlt:
      'Modern artisanal minimalist ceramic coffee mug in matte stone gray glaze, placed on a contemporary wooden study table with study notebook, soft morning window lighting, studio product photography.',
  },
  {
    id: 'sf-wallet',
    name: 'Classic Leather Wallet',
    description: 'Slim RFID-blocking genuine leather wallet with dedicated student ID window and cash pocket.',
    category: 'lifestyle',
    categoryLabel: CATEGORY_LABELS.lifestyle,
    price: 74400,
    priceLabel: '₦74,400',
    rating: 4.8,
    reviews: 85,
    popularity: 85,
    stock: 12,
    badge: 'bestseller',
    image: IMG_WALLET,
    imageAlt:
      'High quality top-grain handcrafted brown leather bifold wallet lying flat on dark oak texture, showcasing clean stitching and multiple card slots, luxurious warm directional lighting.',
  },
  {
    id: 'sf-lamp',
    name: 'Brushed Steel Desk Lamp',
    description: 'Touch-sensitive 3-tone eye protection lamp with built-in rechargeable 24hr battery backup.',
    category: 'campus',
    categoryLabel: CATEGORY_LABELS.campus,
    price: 131750,
    priceLabel: '₦131,750',
    rating: 5.0,
    reviews: 64,
    popularity: 64,
    stock: 12,
    image: IMG_LAMP,
    imageAlt:
      'Architectural brushed steel LED desk lamp with adjustable neck on minimal workspace desk with textbooks and laptop, warm ambient glow illuminating table surface, high end interior design lighting.',
  },
  {
    id: 'sf-headphones',
    name: 'Wireless Noise Cancelling Headphones - Studio Edition',
    description: 'Active 40dB hybrid ANC, 45-hour battery life, low-latency audio for study and coding sprints.',
    category: 'tech',
    categoryLabel: CATEGORY_LABELS.tech,
    price: 309985,
    priceLabel: '₦309,985',
    oldPriceLabel: '₦387,485',
    rating: 4.9,
    reviews: 210,
    popularity: 210,
    stock: 8,
    badge: 'flash',
    image: IMG_HEADPHONES,
    imageAlt:
      'High-end matte black over-ear noise cancelling studio headphones resting on sleek minimalist metal stand, dramatic moody studio rim lighting, premium consumer electronics photography.',
  },
  {
    id: 'sf-sleeve',
    name: 'Laptop Sleeve & Tech Organizer Case',
    description: 'Shock-absorbent fleece lining for 13"-16" MacBooks and PC laptops with dedicated cable straps.',
    category: 'tech',
    categoryLabel: CATEGORY_LABELS.tech,
    price: 49600,
    priceLabel: '₦49,600',
    rating: 4.7,
    reviews: 92,
    popularity: 92,
    stock: 30,
    image: IMG_SLEEVE,
    imageAlt:
      'Weatherproof canvas slate blue laptop sleeve bag with front tech accessory organizer pockets unzipped showing cables, charger, mouse, clean flatlay arrangement on stone surface.',
  },
  {
    id: 'sf-cushion',
    name: 'Ergonomic Memory Foam Seat Cushion',
    description: 'Relieves tailbone pressure during extended study hours and lecture hall seated work. Washable cover.',
    category: 'lifestyle',
    categoryLabel: CATEGORY_LABELS.lifestyle,
    price: 65875,
    priceLabel: '₦65,875',
    rating: 4.9,
    reviews: 140,
    popularity: 140,
    stock: 19,
    image: IMG_CUSHION,
    imageAlt:
      'Ergonomic contoured memory foam orthopedic seat cushion with breathable mesh cover fitted onto a modern ergonomic office chair in a bright dorm study room.',
  },
];
/* ------------------------------ Demo store data --------------------------- */

function buildDemoStore(): Storefront {
  return {
    slug: 'globalstore',
    name: 'Global Store',
    owner: 'Jane Doe',
    school: 'Olabisi Onabanjo University',
    storeId: '#GS-9021',
    rating: 4.9,
    reviewCount: 2104,
    followers: 2400,
    fulfillmentLabel: '99.4%',
    responseTimeLabel: '< 10 mins',
    memberSinceLabel: 'Since 2024',
    badgeLabel: 'Top Rated Campus Merchant',
    campusTag: 'OOU Campus Merchant',
    stockNote: 'All listings physically stocked on Ago-Iwoye campus',
    pickupNote: 'Campus Pickup: Ago-Iwoye Main Gate',
    template: 'modern-boutique',
    pickupLocation: 'Ago-Iwoye Main Gate',
    domain: getPrettyStoreDomain('globalstore'),
    whatsappUrl: 'https://wa.me/2347051917468',
    phone: '07051917468',
    email: 'support@globalstore.com',
    couponCode: 'OOUCAMPUS',
    announcementTitle: 'Semester Clearance & New Tech Arrivals',
    announcementLead: 'Get an instant 10% discount on all checkout totals using student code:',
    bannerImage: IMG_BANNER,
    bannerImages: [IMG_BANNER],
    bannerAlt:
      'A clean, stylish campus entrepreneur workstation with laptop, sleek stationery, minimalist desk accessories, natural daylight streaming through loft windows, calm modern aesthetic featuring slate blue and neutral white tones.',
    avatarImage: IMG_AVATAR,
    avatarAlt:
      'Close up professional portrait of a friendly female African computer science student merchant named Jane Doe, smiling confidently in modern college library setting, warm natural lighting, high quality corporate modern headshot.',
    bioLead:
      'Run by Jane Doe, a final-year Computer Science student at Olabisi Onabanjo University (OOU), Ago-Iwoye. Global Store was launched to eliminate the hassle of waiting days for Lagos deliveries.',
    bioDetail:
      'Every product is hand-tested, stocked directly within Ago-Iwoye, and backed with peer escrow verification. We prioritize verified campus distribution points for zero shipping stress.',
    bioBadges: [
      { icon: 'done_all', tone: 'success', label: 'Physical In-Hand Inventory' },
      { icon: 'pin_drop', tone: 'primary', label: 'Ago-Iwoye Local Hub' },
      { icon: 'sync', tone: 'tertiary', label: '24hr Defect Replacement' },
    ],
    reviews: [
      {
        id: 'rev-1',
        initials: 'TA',
        name: 'Tunde Adeyemi',
        meta: 'Faculty of Law • Picked up at Main Gate',
        text: '"Bought the Studio Headphones. Jane had them ready in under 40 minutes at the Law Pavilion. I tested them right there before releasing the UNIVERSE escrow balance. 10/10 service!"',
        avatarTone: 'primary',
      },
      {
        id: 'rev-2',
        initials: 'CO',
        name: 'Chidinma Okon',
        meta: 'Biochemistry • Delivered to Mini Campus Hostel',
        text: '"The Ceramic Mug and Desk Lamp are authentic and exactly as shown. Really glad we have trusted verified peer sellers like Jane on campus."',
        avatarTone: 'secondary',
      },
    ],
    reviewsNote: 'All 2,104 reviews verified with on-chain campus pickup receipts',
    assurances: [
      { icon: 'local_shipping', tone: 'primary', title: 'Campus Delivery & Pickup', sub: 'Daily hubs at Ago-Iwoye Main Gate' },
      { icon: 'verified', tone: 'success', title: '100% Genuine Gear', sub: 'Vetted tech & original accessories' },
      { icon: 'shield_with_heart', tone: 'primary', title: 'Escrow Buyer Protection', sub: 'Inspect before release of funds' },
      { icon: 'bolt', tone: 'tertiary', title: 'Fast Dispatch', sub: 'Packaged and ready within 2 hours' },
    ],
    catalogCounts: { all: 56, tech: 24, campus: 18, lifestyle: 14 },
    products: DEMO_PRODUCTS,
  };
}
/* --------------------------- Personalization layer ------------------------ */

/** Map a free-form product category string to a storefront bucket. */
function toBucket(category?: string | null): StorefrontCategory {
  const c = (category ?? '').toLowerCase();
  if (/tech|electronic|gadget|phone|laptop|computer|device|accessor/.test(c)) return 'tech';
  if (/campus|school|book|station|study|supplie/.test(c)) return 'campus';
  return 'lifestyle';
}

/** Stable pseudo-number from a string (for demo store IDs). */
function hashish(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) % 1000000;
  return h;
}

/** "07051917468" -> "https://wa.me/2347051917468" */
function toWhatsappUrl(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return 'https://wa.me/2347051917468';
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return `https://wa.me/234${local}`;
}

/** "₦1,249.50" style — the marketplace prices in Nigerian Naira. */
function ngn(value: number): string {
  return `₦${Math.round(value).toLocaleString('en-US')}`;
}

/**
 * Build the storefront for a REGISTERED seller whose store-name slug matches.
 * Their active products become the catalog; demo imagery/annotations fill any
 * gaps so the layout of the original mockup is always fully represented.
 */
function buildPersonalizedStore(
  slug: string,
  profile: {
    storeName?: string | null; school?: string | null; phone?: string | null;
    logoUrl?: string | null; bannerUrl?: string | null; userId: string; id: string;
    storeTemplate?: string | null; bannerImages?: string[] | null; pickupLocation?: string | null; supportEmail?: string | null;
  },
  ownerName: string,
  ownerEmail: string,
  memberSinceIso?: string | null,
  ownerProducts?: Array<{
    id: string; name: string; description?: string | null; price: number; salePrice?: number | null;
    stock?: number | null; category?: string | null; imageUrl?: string | null; imageAlt?: string | null; images?: string[] | null;
    rating: number; reviews: number;
  }>,
): Storefront {
  const name = (profile.storeName || ownerName || 'My Store').trim();
  const products = (ownerProducts ?? []).map((p, index) => {
    const bucket = toBucket(p.category);
    const onSale = p.salePrice != null && p.salePrice < p.price;
    const images = p.images?.length ? p.images : (p.imageUrl ? [p.imageUrl] : [FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]]);
    return {
      id: `sf-${p.id}`,
      name: p.name,
      description: p.description || p.name,
      category: bucket,
      categoryLabel: CATEGORY_LABELS[bucket],
      price: Math.round(onSale ? p.salePrice! : p.price),
      priceLabel: ngn(onSale ? p.salePrice! : p.price),
      oldPriceLabel: onSale ? ngn(p.price) : null,
      rating: p.rating || 4.9,
      reviews: p.reviews || 0,
      popularity: p.reviews || Math.round((p.rating || 4.9) * 20),
      stock: p.stock ?? null,
      badge: onSale ? ('flash' as const) : null,
      campusPickup: bucket === 'campus',
      image: images[0],
      imageAlt: p.imageAlt || p.name,
      images,
    } satisfies StorefrontProduct;
  });

  const rated = products.filter((p) => p.reviews > 0);
  const avgRating = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 4.9;
  const totalReviews = products.reduce((s, p) => s + p.reviews, 0);
  const counts = {
    all: products.length,
    tech: products.filter((p) => p.category === 'tech').length,
    campus: products.filter((p) => p.category === 'campus').length,
    lifestyle: products.filter((p) => p.category === 'lifestyle').length,
  };
  const year = memberSinceIso ? new Date(memberSinceIso).getFullYear() : new Date().getFullYear();
  // Branding uploaded by the seller — null means the storefront renders the
  // store NAME as its logo and cover until the seller uploads real artwork.
  const logoImage = profile.logoUrl || null;
  const bannerImage = profile.bannerUrl || null;
  const bannerImages = profile.bannerImages?.length ? profile.bannerImages : (bannerImage ? [bannerImage] : []);

  return {
    ...buildDemoStore(),
    slug,
    name,
    owner: ownerName || 'Seller',
    school: profile.school || 'Olabisi Onabanjo University',
    storeId: `#${(slugifyStoreName(name).slice(0, 2) || 'ST').toUpperCase()}-${9000 + (hashish(profile.userId) % 999)}`,
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: Math.max(totalReviews, 1),
    domain: getPrettyStoreDomain(slug),
    whatsappUrl: toWhatsappUrl(profile.phone),
    phone: profile.phone || '07051917468',
    email: profile.supportEmail || ownerEmail,
    template: profile.storeTemplate ?? null,
    pickupLocation: profile.pickupLocation ?? null,
    memberSinceLabel: `Since ${year}`,
    bioLead: `Run by ${ownerName || 'an independent seller'}, a student merchant at ${profile.school || 'Olabisi Onabanjo University'}. ${name} was launched to eliminate the hassle of waiting days for Lagos deliveries.`,
    bioDetail:
      'Every product is hand-tested, stocked directly on campus, and backed with peer escrow verification. We prioritize verified campus distribution points for zero shipping stress.',
    bannerImage,
    bannerImages,
    bannerAlt: profile.bannerUrl ? `${name} storefront cover` : undefined,
    avatarImage: logoImage,
    avatarAlt: profile.logoUrl ? `${name} logo` : undefined,
    reviewsNote: `All ${Math.max(totalReviews, 1).toLocaleString('en-US')} reviews verified with on-chain campus pickup receipts`,
    catalogCounts: counts,
    products,
  };
}
/* ------------------------------- Mock API --------------------------------- */

export class MockStorefrontApi implements StorefrontApi {
  async getStorefront(slugRaw: string): Promise<Storefront> {
    logApi('GET', `/storefront/${slugRaw || 'globalstore'}`);
    return withMockLatency((async () => {
      const slug = slugifyStoreName(slugRaw);
      if (!slug || slug === 'globalstore' || slug === 'demo' || slug === 'store') {
        return buildDemoStore();
      }

      // Find a registered seller whose domain slugifies to this slug. The
      // dashboard derives the domain from storeName when set, else the owner's
      // full name (getStoreDisplayName), so both are matched here.
      const byStoreName = mockDb.query('sellerProfiles', (p) => slugifyStoreName(p.storeName ?? '') === slug);
      const byOwnerName = mockDb.query('sellerProfiles', (p) => {
        if (p.storeName && p.storeName.trim()) return false; // storeName takes priority
        const owners = mockDb.query('users', (u) => u.id === p.userId);
        return slugifyStoreName(owners[0]?.fullName ?? '') === slug;
      });
      const profiles = [...byStoreName, ...byOwnerName];
      if (profiles.length === 0) {
        // Public mock mode must remain viewable even when a seller was created
        // outside this browser's local mock database.
        const fallback = buildDemoStore();
        return {
          ...fallback,
          slug,
          domain: getPrettyStoreDomain(slug),
        };
      }

      const profile = profiles[0];
      const owners = mockDb.query('users', (u) => u.id === profile.userId);
      const owner = owners[0];
      const products = mockDb.query('products', (p) => p.sellerId === profile.userId && p.status === 'active');

      if (!owner || products.length === 0) {
        // Registered but nothing published yet → demo store with their identity.
        return buildPersonalizedStore(slug, profile, owner?.fullName ?? 'Seller', owner?.email ?? 'seller@universe.market', owner?.createdAt ?? null, []);
      }

      return buildPersonalizedStore(slug, profile, owner.fullName, owner.email, owner.createdAt, products);
    })());
  }
}


