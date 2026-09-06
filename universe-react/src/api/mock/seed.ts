/**
 * Seed data for the mock database.
 *
 * Runs on first load (or after localStorage corruption) so the app has
 * realistic data to show. Mirrors the kind of data the real backend would
 * return, so the UI is exercised against realistic shapes from day one.
 */
import type { MockDatabaseShape } from './mockDatabase';
import type { Order, Product, SellerProfile, User } from '../types';

function uuid(seed: string): string {
  // Deterministic-ish unique id without crypto (seed data is static).
  return `seed-${seed}`;
}

const now = '2026-09-05T08:00:00.000Z';
const earlier = '2026-09-04T10:00:00.000Z';

const users: (User & { passwordHash: string; failedLoginCount: number; lockedUntil: null })[] = [
  {
    id: uuid('user-1'),
    email: 'demo@universe.app',
    fullName: 'Demo Seller',
    accountType: 'seller',
    avatarUrl: null,
    status: 'active',
    createdAt: earlier,
    updatedAt: now,
    // PBKDF2-SHA256, 120k iterations — identical parameters to
    // api/mock/security.ts so seed users log in through the same verify path
    // as real registrations. NEVER store plaintext passwords.
    passwordHash:
      'pbkdf2$120000$5aHA97LZToqcHT9bfpocPQ==$c3cYDViqMAijKjhKHXafh3+s5hdG9Lk/4NdSdLH1SJA=',
    failedLoginCount: 0,
    lockedUntil: null,
  },
  {
    id: uuid('user-2'),
    email: 'buyer@universe.app',
    fullName: 'Demo Buyer',
    accountType: 'buyer',
    avatarUrl: null,
    status: 'active',
    createdAt: earlier,
    updatedAt: now,
    passwordHash:
      'pbkdf2$120000$fzudHlx6L0ttjgosT2uNDg==$sje15Xx48sRZf2vFxriyUNW4d1IZzH6DFynlgcEBL7M=',
    failedLoginCount: 0,
    lockedUntil: null,
  },
];

const sessions: MockDatabaseShape['sessions'] = [];

const sellerProfiles: SellerProfile[] = [
  {
    id: uuid('profile-1'),
    userId: uuid('user-1'),
    storeName: 'Universe Demo Store',
    phone: '07051917468',
    level: '400',
    department: 'Computer Science',
    course: 'B.Sc. Computer Science',
    school: 'Olabisi Onabanjo University',
    bio: 'Selling premium tech and lifestyle products.',
  },
];

const products: Product[] = [
  {
    id: uuid('prod-1'),
    sellerId: uuid('user-1'),
    seller: 'Universe Demo Store',
    name: 'Premium Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones with 30h battery life.',
    price: 199.99,
    salePrice: 149.99,
    stock: 45,
    sku: 'ELEC-HP-001',
    category: 'Electronics',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5frr_1zYp3aISI9xcW1doII1_rsRu-whdcY-t-tmxK6xV1paBHOxrRGrL0H9SY1Rh15vZljoqRdEW980kPnjB9ZdBzpoDJrgiRHwzus3Lft1lxzBiV8EZsNkIxSOU92x1upf6mI95CLlxfM809LoI3wslBGpAzy93fX83_nIBxm4N6IMNkKSkuk3dvdsPJTYGE0mNMtR0OoCNvBlSBb7kx1955h7P79P4awYS17NBVYs492Ei8xNe',
    imageAlt: 'Premium wireless noise-cancelling headphones in matte black.',
    rating: 4.5,
    reviews: 128,
    createdAt: earlier,
    updatedAt: now,
  },
  {
    id: uuid('prod-2'),
    sellerId: uuid('user-1'),
    seller: 'Universe Demo Store',
    name: 'Minimalist Ceramic Mug',
    description: 'Hand-crafted ceramic mug with a matte finish.',
    price: 24.0,
    salePrice: null,
    stock: 120,
    sku: 'HOME-CM-002',
    category: 'Home',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjh81Qmmt90nqCzxc5YGlmAI90cBmkFJytnbMNU2lux1qBBgSKbQkiRbkeZ3CyHbLf6EB3t021y6NwVK95sPuNWWA7IYQBJV1ShJGaPRskxfOW64FXanNFhK1VkH08y48YrhouvWUkzQP49tiftv0Ij_HhRWeBN7PLYByto4pM4I9HAYET3x-10WXAf10sL29pGeoXrBii4nBUnsUHFwt5aKpriFzUJErzzHQMMOQFoH8NW35uniBy',
    imageAlt: 'Minimalist ceramic mug on a light slate background.',
    rating: 4.8,
    reviews: 56,
    createdAt: earlier,
    updatedAt: now,
  },
  {
    id: uuid('prod-3'),
    sellerId: uuid('user-1'),
    seller: 'Universe Demo Store',
    name: 'Classic Leather Wallet',
    description: 'Genuine full-grain leather wallet with a slim profile.',
    price: 48.0,
    salePrice: 38.0,
    stock: 30,
    sku: 'FASH-LW-003',
    category: 'Fashion',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaclE2t1cNJVCuDqR2Z3IhRUFnx5kpd4yWmbY2oHOqHNojBLzbdgEBGiIk4V9ITIdP9V25qDrmBX_xEzUYdnWPwFMGvDIIvitJx6_XWZJ6XCWmeZtCKYKIlXMC41VtNk_KzoTKVT1QAieZjLedYObn4RJd-eGr2L3nMYIJ2WHmOSjQeB1A3F85dzMhZZ7O6UO8r1nlVDLpBwBPUuSys3LQz-fs9QdHcMNdpn3BphWg4lfL2njKJDEg',
    imageAlt: 'Sleek leather wallet on a clean light gray surface.',
    rating: 4.6,
    reviews: 89,
    createdAt: earlier,
    updatedAt: now,
  },
  {
    id: uuid('prod-4'),
    sellerId: uuid('user-1'),
    seller: 'Universe Demo Store',
    name: 'Brushed Steel Desk Lamp',
    description: 'Adjustable LED desk lamp with dimmable settings.',
    price: 85.0,
    salePrice: null,
    stock: 12,
    sku: 'HOME-DL-004',
    category: 'Home',
    status: 'draft',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvb_57BM1dTHXtBnhxJfZoy8pjnj8_0yxNef9QVn9PCZy4Lv6wWgLCslx_CsPjUzufUHIFravcRP5Obp_w-w7NxUpInT5cd7foE4qF_44xuJsf-ikZ7cV3bgBbdsBtC9BEEZwUOcfG9YmerfMdM4jyeBTKs4Q85hUAuDrqNGDTNdykeyHcvJYYyYU98CntrSG_D118pG5kEi3H-xKYyL2cIaBSCX7SO-MJs8bFrof1VV4rUPTt3Rldf',
    imageAlt: 'Modern brushed steel desk lamp against a soft slate background.',
    rating: 4.3,
    reviews: 21,
    createdAt: earlier,
    updatedAt: now,
  },
];

const orders: Order[] = [
  {
    id: uuid('order-1'),
    reference: 'GS-2041',
    buyerName: 'Jane Doe',
    buyerInitials: 'JD',
    amount: 124.0,
    status: 'processing',
    createdAt: now,
  },
  {
    id: uuid('order-2'),
    reference: 'GS-2040',
    buyerName: 'Samuel Okafor',
    buyerInitials: 'SM',
    amount: 89.5,
    status: 'shipped',
    createdAt: earlier,
  },
  {
    id: uuid('order-3'),
    reference: 'GS-2039',
    buyerName: 'Aisha Bello',
    buyerInitials: 'AK',
    amount: 349.0,
    status: 'delivered',
    createdAt: earlier,
  },
];

export function seedDatabase(): MockDatabaseShape {
  return {
    users,
    sessions: [...sessions],
    sellerProfiles: [...sellerProfiles],
    products: [...products],
    orders: [...orders],
    counters: {
      users: users.length,
      sessions: sessions.length,
      sellerProfiles: sellerProfiles.length,
      products: products.length,
      orders: orders.length,
    },
  };
}
