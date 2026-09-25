/**
 * Support / contact helpers shared across the dashboard UI.
 *
 * The Universe support desk is reachable on WhatsApp — the same number shown
 * as the "Direct Support Desk" on the Terms page and the "Contact On
 * WhatsApp" button on the seller profile.
 */

/** Support WhatsApp number in international format without "+" (wa.me format). */
export const SUPPORT_WHATSAPP_NUMBER = '2347051917468';

/** Direct WhatsApp support URL for Universe desk. */
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;

/**
 * Support contact email — the same address used on the seller/buyer profiles.
 */
export const SUPPORT_EMAIL = 'universe26@gmail.com';

/** Build a wa.me deep link with an optional pre-filled message. */
export function buildWhatsAppUrl(text) {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Feedback entry point — opens WhatsApp with a pre-filled feedback message. */
export const FEEDBACK_WHATSAPP_URL = buildWhatsAppUrl(
  "Hello Universe Support, I'd like to share some feedback about my seller dashboard experience:"
);

