/**
 * Store domain helpers — every registered seller automatically gets a
 * private-marketplace domain in the form `storename.<app-domain>`
 * (e.g. `globalstore.universe.market`).
 *
 * The slug is derived from the seller's store name, so naming a store
 * "Global Store" during onboarding instantly reserves the domain
 * globalstore.universe.market, which serves that seller's private storefront.
 *
 * Routing strategy:
 * - Production: `*.universe.market` is a wildcard-DNS + reverse-proxy setup
 *   that points any store subdomain at this SPA.
 * - Local dev: browsers already resolve `*.localhost` to 127.0.0.1, so
 *   `globalstore.localhost:5173` works out of the box with Vite.
 * - Everywhere else (ngrok tunnels, preview deploys — hosts where wildcard
 *   subdomains cannot be guaranteed): the canonical path alias
 *   `/store/:storeSlug` is used instead.
 */

/** Base domain of the app. Override with VITE_APP_DOMAIN in the environment. */
export const APP_DOMAIN = String(
  (import.meta.env && import.meta.env.VITE_APP_DOMAIN) || 'universe.market',
).replace(/^https?:\/\//, '');

/** Subdomain labels that must never resolve to a store. */
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'mail', 'ftp']);

/**
 * "Global Store!" -> "globalstore"
 * Lowercase, strip accents, drop anything that is not a letter or digit.
 * Returns '' when nothing usable remains.
 */
export function slugifyStoreName(name) {
  if (!name) return '';
  return String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);
}

/** Pretty display form: "globalstore.universe.market" (no protocol). */
export function getPrettyStoreDomain(slug) {
  return `${slug || 'store'}.${APP_DOMAIN}`;
}

/** Full URL form: "https://globalstore.universe.market". */
export function getStoreDomainUrl(slug) {
  return `https://${getPrettyStoreDomain(slug)}`;
}

/**
 * Parse a hostname and return the store slug when the host is a store domain:
 * `slug.localhost` (dev) or `slug.<APP_DOMAIN>` (production wildcard).
 * Returns null for the apex/unknown hosts so normal deployments keep using
 * the `/store/:storeSlug` path form.
 */
export function parseStoreSubdomain(hostname) {
  if (!hostname) return null;
  const host = String(hostname).toLowerCase().split(':')[0].replace(/\.$/, '');
  if (!host) return null;

  const isLocalStore = host.endsWith('.localhost');
  const isAppStore = Boolean(APP_DOMAIN) && host.endsWith(`.${APP_DOMAIN}`);
  if (!isLocalStore && !isAppStore) return null;

  const suffix = isLocalStore ? '.localhost' : `.${APP_DOMAIN}`;
  const slug = host.slice(0, host.length - suffix.length);
  if (!slug || slug.includes('.') || RESERVED_SUBDOMAINS.has(slug)) return null;
  return slug;
}
