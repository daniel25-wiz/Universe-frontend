/**
 * Type declarations for lib/storeTemplates.js (intentionally plain JS so the
 * JSX views and the TS API layer share one registry) so TypeScript imports of
 * this module stay typed instead of implicitly `any`.
 */

/** One storefront template a seller can activate. */
export interface StorefrontTemplate {
  key: string;
  name: string;
  tagline: string;
  category: string;
  badge: string;
  icon: string;
  description: string;
}

/** Every registered storefront template. */
export declare const STOREFRONT_TEMPLATES: StorefrontTemplate[];

/** Canonical template keys, so callers never hard-code strings. */
export declare const STORE_TEMPLATE_KEYS: Readonly<{
  BOUTIQUE: string;
  QUICK_MART: string;
  TECH_PRO: string;
}>;

/** Alias of STORE_TEMPLATE_KEYS. */
export declare const STOREFRONT_TEMPLATE_KEYS: Readonly<{
  BOUTIQUE: string;
  QUICK_MART: string;
  TECH_PRO: string;
}>;

/** Accept only registered template keys. */
export declare function isKnownStoreTemplate(key?: string | null): boolean;

/** Resolve a stored template key (unknown/null -> null = classic render). */
export declare function getStoreTemplate(key?: string | null): StorefrontTemplate | null;

/** Display label for a stored template key ('' for none). */
export declare function getStoreTemplateLabel(key?: string | null): string;