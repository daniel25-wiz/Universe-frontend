/**
 * Shared primitive normalizers for the REAL backend adapter.
 *
 * This is the ONE place where "backend dialect" differences are translated:
 *
 * - snake_case / kebab-case keys  -> camelCase (`sale_price` -> `salePrice`)
 * - `{ data: ... }` envelopes     -> unwrapped
 * - numeric strings               -> numbers where the contract type needs one
 * - empty strings / null          -> null (never a fabricated default)
 *
 * SCOPE GUARANTEE: these helpers only reshape data the backend actually sent.
 * None of them invent business values — every field the backend omits stays
 * `null`/`undefined` and the UI renders its missing-data state.
 */

/** True for a JSON object (never for arrays or null). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** "featured_in_marketplace" -> "featuredInMarketplace" (camel keys pass through). */
export function camelizeKey(key: string): string {
  if (!/[_-]/.test(key)) return key;
  const [head, ...rest] = key.split(/[_-]+/).filter(Boolean);
  if (head === undefined) return key;
  return head + rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

/** Deep key transform. Object keys are camelized; values are never modified. */
export function camelizeDeep<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) return value.map((entry) => camelizeDeep(entry)) as T;
  if (!isRecord(value)) return value as T;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) out[camelizeKey(key)] = camelizeDeep(entry);
  return out as T;
}

/**
 * First present alias for a field, so a backend that names things slightly
 * differently (`title` vs `name`, `image` vs `imageUrl`) still works.
 *
 * This leniency is limited to documented aliases per endpoint in
 * docs/API_CONTRACT.md — it is not an invitation to accept arbitrary shapes.
 */
export function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

/** Unwrap `{ data: X }` / `{ product: X }` / `{ user: X }` style envelopes. */
export function unwrapEnvelope(raw: unknown, keys: string[]): unknown {
  if (!isRecord(raw)) return raw;
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null) return value;
  }
  return raw;
}

/**
 * Lenient numeric parse — accepts 12, "12", "309985.00", "₦1,249.50".
 *
 * DERIVATION RULE: converting a numeric STRING the backend sent into a number
 * is normalization. Returning a number the backend never sent is fabrication —
 * callers must use `null` for that instead.
 */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Trimmed non-empty string, or null. */
export function toText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

/** Lenient boolean parse ("true" / 1 / "yes" -> true). Null when absent. */
export function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off', ''].includes(normalized)) return false;
  }
  return null;
}

/** Array of trimmed non-empty strings (never null). */
export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toText(entry)).filter((entry): entry is string => Boolean(entry));
}
