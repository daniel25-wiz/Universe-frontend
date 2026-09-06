/**
 * Security primitives for the mock API layer.
 *
 * The mock backend simulates the security posture a REAL backend must have:
 *
 * - Passwords are hashed with PBKDF2-HMAC-SHA256 (120k iterations, per-user
 *   random salt) via the Web Crypto API — never stored or logged in plaintext.
 * - Session tokens are 256-bit CSPRNG values (crypto.getRandomValues) and are
 *   stored in the "database" only as SHA-256 hashes, exactly like a real
 *   backend would never persist raw token strings.
 * - Password verification is constant-time (timing-safe comparison).
 *
 * These functions are async because Web Crypto is async; the seed database
 * ships pre-computed hashes (generated with the identical PBKDF2 parameters)
 * so database loading stays synchronous.
 */

const PBKDF2_ITERATIONS = 120_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function subtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API is required for password hashing.');
  }
  return crypto.subtle;
}

/** Cryptographically secure, URL-safe opaque token (256-bit by default). */
export function generateSecureToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** SHA-256 hex digest — used to store/lookup session tokens without keeping raw values. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await subtle().digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lengthBytes: number,
): Promise<Uint8Array> {
  const keyMaterial = await subtle().importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    lengthBytes * 8,
  );
  return new Uint8Array(bits);
}

/** Hash a password for storage. Format: pbkdf2$<iterations>$<saltB64>$<hashB64>. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS, HASH_BYTES);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** Verify a password against a stored pbkdf2$ hash (constant-time comparison). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = Number.parseInt(parts[1], 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    const salt = fromBase64(parts[2]);
    const expected = fromBase64(parts[3]);
    const actual = await deriveBits(password, salt, iterations, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Length-independent, constant-time byte comparison. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Small blocklist of the most-broken passwords — checked on register/change. */
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'iloveyou1',
  'admin1234',
  'letmein12',
  'welcome1',
  'abc12345',
  '11111111',
  '12341234',
  'sunshine1',
  'princess1',
  'football1',
]);

export interface PasswordPolicyResult {
  ok: boolean;
  error?: string;
}

/**
 * Server-side password policy (defense in depth — the UI validates too, but
 * the API never trusts the client).
 */
export function validatePasswordStrength(password: string): PasswordPolicyResult {
  if (!password || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { ok: false, error: 'Password must be at most 128 characters' };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, error: 'Password must contain at least one letter and one number' };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, error: 'This password is too common. Please choose a stronger one' };
  }
  return { ok: true };
}
