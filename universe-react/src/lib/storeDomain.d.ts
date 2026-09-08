/**
 * Type declarations for lib/storeDomain.js (intentionally plain JS, shared
 * with non-TS code) so TypeScript imports of this module stay typed.
 */

/** Base domain of the app (VITE_APP_DOMAIN override applied). */
export declare const APP_DOMAIN: string;

/** "Global Store!" -> "globalstore" ("" when nothing usable remains). */
export declare function slugifyStoreName(name: unknown): string;

/** Pretty display form: "globalstore.universe.market" (no protocol). */
export declare function getPrettyStoreDomain(slug?: string): string;

/** Full URL form: "https://globalstore.universe.market". */
export declare function getStoreDomainUrl(slug?: string): string;

/** Store slug for a store-domain host, else null for apex/unknown hosts. */
export declare function parseStoreSubdomain(hostname?: string | null): string | null;