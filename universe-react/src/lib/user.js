/**
 * Small user-related display helpers shared across the dashboard UI.
 */

/** "Ada Lovelace" -> "AL" (max 2 chars) for avatar chips. */
export function getUserInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Ada Lovelace" -> "Ada" for greetings. */
export function getFirstName(name) {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0] || 'there';
}

/** Best-effort display name for a store: store name, else the user's name. */
export function getStoreDisplayName(storeName, fullName) {
  return (storeName && storeName.trim()) || (fullName && fullName.trim()) || 'My Store';
}

/** ISO timestamp -> "just now" / "5 mins ago" / "3 hours ago" / "2 days ago". */
export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

/** "₦1,249.50" style formatting for money values (Nigerian Naira). */
export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(value);
}

