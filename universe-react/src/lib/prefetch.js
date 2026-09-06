/**
 * Intent-based prefetching.
 *
 * The loaders below use EXACTLY the same import() specifiers as src/App.jsx,
 * so Rollup resolves them to the same modules → the same output chunks.
 * Calling prefetch(key) warms the browser cache so a later route click
 * resolves near-instantly. Importing a module never executes component code —
 * it only fetches + parses the chunk in the background.
 */

const loaders = {
  home: () => import('../pages/HomePage'),
  auth: () => import('../components/auth/AuthPage'),
  seller: () => import('../components/seller-dashboard/SellerDashboard'),
  'dashboard/overview': () => import('../components/seller-dashboard/views/DashboardOverview'),
  'dashboard/marketplace': () => import('../components/seller-dashboard/views/MyMarketplace'),
  'dashboard/public-marketplace': () => import('../components/seller-dashboard/views/PublicMarketplace'),
  'dashboard/sales': () => import('../components/seller-dashboard/views/SalesAnalytics'),
  'dashboard/settings': () => import('../components/seller-dashboard/views/SellerSettings'),
  'dashboard/profile': () => import('../components/seller-dashboard/views/SellerProfile'),
  'dashboard/add-product': () => import('../components/seller-dashboard/ui/AddProductPage'),
};

const prefetched = new Set();

export const prefetch = (key) => {
  const load = loaders[key];
  if (!load || prefetched.has(key)) return;
  prefetched.add(key);
  // Ignore failures (offline etc.) so the Set doesn't block a retry later.
  load().catch(() => prefetched.delete(key));
};

/** Map a route path to the prefetch keys its navigation needs. */
const pathToKeys = {
  '/': ['home'],
  '/auth': ['auth'],
  '/auth/login': ['auth'],
  '/auth/signup': ['auth'],
  '/seller': ['seller', 'dashboard/overview'],
  '/seller/marketplace': ['dashboard/marketplace'],
  '/seller/public-marketplace': ['dashboard/public-marketplace'],
  '/seller/sales': ['dashboard/sales'],
  '/seller/settings': ['dashboard/settings'],
  '/seller/profile': ['dashboard/profile'],
  '/seller/add-product': ['dashboard/add-product'],
};

/**
 * Signals the home page to begin loading its below-the-fold sections.
 * Used by in-page nav links (#marketplace, #dashboard, ...) so those sections
 * start loading the instant the user asks for them (before the scroll
 * observer would have kicked in).
 */
export const triggerHomeSectionsLoad = () => {
  try {
    window.dispatchEvent(new Event('universe:load-home-sections'));
  } catch (_) {
    /* no-op */
  }
};

/**
 * React event-handler factory: prefetch everything a Link needs the first time
 * the user hovers it or tab-focuses it, so the actual click is instant.
 * Attach via <Link {...prefetchPropsForPath('/seller')}>.
 */
export const prefetchPropsForPath = (path) => {
  const keys = pathToKeys[path] || [];
  const handle = () => keys.forEach(prefetch);
  return { onMouseEnter: handle, onFocus: handle };
};