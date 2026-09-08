/**
 * Centralized mock database.
 *
 * Single source of truth for every piece of mock-persisted data. Persists to
 * localStorage so data survives page refreshes. Components NEVER touch
 * localStorage — they go through the API services, and the services go through
 * this module.
 */
import type { Order, Product, SellerProfile, User } from '../types';
import { seedDatabase } from './seed';

export const MOCK_DB_KEY = 'universe.mockdb.v2';

/**
 * A mock "server-side" session record.
 *
 * SECURITY: raw tokens are never persisted — only their SHA-256 hashes are.
 * Access tokens are short-lived; refresh tokens are longer-lived and are
 * rotated (invalidated) on every refresh, so a stolen refresh token can't be
 * replayed forever.
 */
export interface MockSession {
  id: string;
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  createdAt: string;
  lastUsedAt: string;
}

/** Internal user row — includes fields the API responses strip out. */
export interface StoredUser extends User {
  /** PBKDF2 hash (pbkdf2$<iter>$<salt>$<hash>) — never returned to clients. */
  passwordHash: string;
  /** Brute-force protection: consecutive failed login attempts. */
  failedLoginCount?: number;
  /** Timestamp (ms) until which login attempts are locked out. */
  lockedUntil?: number | null;
  phone?: string | null;
  /**
   * How the account was created/authenticates. Google-created rows get
   * 'google'; password rows keep the default (undefined === 'password').
   */
  authProvider?: 'password' | 'google';
}

export interface MockDatabaseShape {
  users: StoredUser[];
  sessions: MockSession[];
  sellerProfiles: SellerProfile[];
  products: Product[];
  orders: Order[];
  /** Auto-increment counters used to generate stable numeric-looking ids. */
  counters: Record<string, number>;
}

/**
 * The record-array collections — every collection except `counters`, which is
 * bookkeeping metadata rather than a list. The list helpers below never touch
 * `counters`, and excluding it here keeps their generic types sound (a
 * `Record<string, number>` cannot be `.find()`-ed or `[number]`-indexed).
 */
type ArrayCollections = Omit<MockDatabaseShape, 'counters'>;
type CollectionName = keyof ArrayCollections;

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Load the DB (seeding from seed.ts on first run / if the stored schema is
 * missing/older than the current version).
 */
function readDb(): MockDatabaseShape {
  try {
    const raw = window.localStorage.getItem(MOCK_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabaseShape;
      // Validate the schema shape so an older/partial database is reseeded
      // instead of being trusted (e.g. passwords must be PBKDF2 hashes, and
      // sessions must store token hashes — never plaintext values).
      const usersOk =
        parsed &&
        Array.isArray(parsed.users) &&
        parsed.users.length > 0 &&
        typeof parsed.users[0].passwordHash === 'string' &&
        parsed.users[0].passwordHash.startsWith('pbkdf2$');
      const sessionsOk =
        parsed &&
        Array.isArray(parsed.sessions) &&
        (parsed.sessions.length === 0 || 'accessTokenHash' in parsed.sessions[0]);
      if (usersOk && sessionsOk && parsed.counters) {
        return parsed;
      }
    }
  } catch {
    /* corrupted storage — reseed */
  }
  const fresh = seedDatabase();
  writeDb(fresh);
  return fresh;
}

function writeDb(db: MockDatabaseShape): void {
  window.localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextId(db: MockDatabaseShape, collection: CollectionName): number {
  const next = (db.counters[collection] ?? 0) + 1;
  db.counters[collection] = next;
  return next;
}

export const mockDb = {
  /** Return a deep copy of a full collection. */
  getCollection<K extends CollectionName>(name: K): ArrayCollections[K] {
    return clone(readDb()[name]);
  },

  /** Replace a full collection. */
  setCollection<K extends CollectionName>(name: K, items: ArrayCollections[K]): void {
    const db = readDb();
    db[name] = clone(items) as MockDatabaseShape[K];
    writeDb(db);
  },

  findById<K extends CollectionName>(name: K, id: string): ArrayCollections[K][number] | null {
    const item = readDb()[name].find((entry) => (entry as { id: string }).id === id);
    return item ? clone(item) : null;
  },

  query<K extends CollectionName>(name: K, predicate: (item: ArrayCollections[K][number]) => boolean): ArrayCollections[K][number][] {
    return readDb()[name].filter(predicate).map((item) => clone(item)) as ArrayCollections[K][number][];
  },

  /** Insert a record; assigns id + createdAt when missing. */
  insert<K extends CollectionName>(name: K, item: ArrayCollections[K][number]): ArrayCollections[K][number] {
    const db = readDb();
    const entry = clone(item) as unknown as Record<string, unknown>;
    if (!entry.id) entry.id = generateId();
    if (!entry.createdAt) entry.createdAt = nowIso();
    if (!entry.updatedAt) entry.updatedAt = entry.createdAt;
    // The union of record arrays is not directly comparable to a mutable
    // Record list (interfaces carry no index signatures), hence the bridge.
    (db[name] as unknown as Array<Record<string, unknown>>).push(entry);
    writeDb(db);
    return clone(entry) as unknown as ArrayCollections[K][number];
  },

  /** Update a record by id; returns the updated record or null. */
  update<K extends CollectionName>(name: K, id: string, patch: Partial<ArrayCollections[K][number]>): ArrayCollections[K][number] | null {
    const db = readDb();
    // Same bridge as insert(): operate on the row as a plain record.
    const list = db[name] as unknown as Array<Record<string, unknown>>;
    const index = list.findIndex((entry) => entry.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...clone(patch as Record<string, unknown>), updatedAt: nowIso() };
    writeDb(db);
    return clone(list[index]) as unknown as ArrayCollections[K][number];
  },

  /** Remove a record by id; returns true if removed. */
  remove(name: CollectionName, id: string): boolean {
    const db = readDb();
    const list = db[name] as Array<{ id: string }>;
    const index = list.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    writeDb(db);
    return true;
  },

  /** Insert-scope id generator, useful for reference-style numeric ids. */
  getNextId(collection: CollectionName): number {
    const db = readDb();
    return nextId(db, collection);
  },

  /** Wipe everything and reseed — useful for "Reset demo data" style flows. */
  reset(): void {
    const fresh = seedDatabase();
    writeDb(fresh);
  },
};