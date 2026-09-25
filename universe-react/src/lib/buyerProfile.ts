/**
 * Buyer-specific profile extras (level / department / school).
 *
 * The API contract (docs/API_CONTRACT.md -> Users) exposes only fullName,
 * phone and avatarUrl on PATCH /users/me — academic details are not part of
 * it. They are therefore persisted client-side so the Buyer Profile form
 * keeps its values across reloads in BOTH mock and real API modes, while the
 * fields that ARE in the contract (full name) go through usersApi.
 */

const BUYER_PROFILE_KEY = 'universe.buyerProfile.v1';

export interface BuyerProfileExtras {
  level: string;
  department: string;
  school: string;
}

const EMPTY_EXTRAS: BuyerProfileExtras = { level: '', department: '', school: '' };

/** Read the persisted buyer extras; corrupted values fall back to blanks. */
export function loadBuyerExtras(): BuyerProfileExtras {
  try {
    const raw = window.localStorage.getItem(BUYER_PROFILE_KEY);
    if (!raw) return { ...EMPTY_EXTRAS };
    const parsed = JSON.parse(raw);
    return {
      level: typeof parsed?.level === 'string' ? parsed.level : '',
      department: typeof parsed?.department === 'string' ? parsed.department : '',
      school: typeof parsed?.school === 'string' ? parsed.school : '',
    };
  } catch {
    return { ...EMPTY_EXTRAS };
  }
}

/** Best-effort write; private mode or full quota must never break the UI. */
export function saveBuyerExtras(extras: BuyerProfileExtras): void {
  try {
    window.localStorage.setItem(BUYER_PROFILE_KEY, JSON.stringify(extras));
  } catch {
    /* storage unavailable — in-memory state still works for this session */
  }
}
