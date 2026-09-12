/**
 * Storefront templates — the storefront styles a seller can switch between.
 *
 * The seller picks one in My Workshop (MyMarketplace). The choice is persisted
 * on the seller profile (`storeTemplate`) and surfaced on the public
 * storefront payload (`Storefront.template`), where StorefrontPage dispatches
 * to the matching renderer. Everything here is shared by the mock API (which
 * validates/whitelists the value) and by the UI (workspace picker + the
 * storefront template dispatcher).
 */

export const STOREFRONT_TEMPLATES = [
  {
    key: 'modern-boutique',
    name: 'Modern Boutique',
    tagline: 'Curated drops · Minimalist editorial',
    category: 'Lifestyle & Fashion',
    badge: 'ACTIVE',
    icon: 'checkroom',
    description: 'Editorial boutique look with big imagery, wishlist hearts and dual USD / Naira pricing.',
  },
  {
    key: 'campus-quick-mart',
    name: 'Campus Quick-Mart',
    tagline: 'Flash sales · High-density grid',
    category: '2hr Campus Dispatch',
    badge: 'LIVE',
    icon: 'bolt',
    description: 'Dense flash-sale grid with a slide-in cart and a WhatsApp fast-order checkout.',
  },
  {
    key: 'tech-essentials-pro',
    name: 'Tech & Essentials Pro',
    tagline: 'Specs-driven · Escrow secured',
    category: 'Verified Hardware',
    badge: 'PRO',
    icon: 'computer',
    description: 'Spec-first catalog with escrow-secured ordering for technical hardware & certified gear.',
  },
];

/** Canonical keys, so callers never hard-code strings. */
export const STORE_TEMPLATE_KEYS = Object.freeze({
  BOUTIQUE: 'modern-boutique',
  QUICK_MART: 'campus-quick-mart',
  TECH_PRO: 'tech-essentials-pro',
});

export const STOREFRONT_TEMPLATE_KEYS = STORE_TEMPLATE_KEYS;

/** Accept only registered template keys (used by the mock API whitelist). */
export function isKnownStoreTemplate(key) {
  return Boolean(key) && STOREFRONT_TEMPLATES.some((tpl) => tpl.key === key);
}

/** Resolve a stored template key. Unknown/null values resolve to null (classic render). */
export function getStoreTemplate(key) {
  if (!key) return null;
  return STOREFRONT_TEMPLATES.find((tpl) => tpl.key === key) ?? null;
}

/** Display label for a stored template key ('' for none). */
export function getStoreTemplateLabel(key) {
  return getStoreTemplate(key)?.name ?? '';
}