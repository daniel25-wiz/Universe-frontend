/**
 * Google Identity Services (GIS) integration — the REAL Google sign-in flow.
 *
 * "Continue with Google" renders Google's OFFICIAL button (localized label
 * "Continue with Google"). Clicking it opens Google's own account chooser and
 * hands back a signed ID token (JWT), which is forwarded opaquely to
 * authApi.googleLogin() (POST /auth/google). The real backend verifies the
 * token server-side — the frontend never touches Google secrets.
 *
 * One-time setup (no extra dependencies):
 * 1. Google Cloud Console -> APIs & Services -> Credentials -> Create
 *    credentials -> OAuth client ID -> Web application.
 * 2. Add every origin the app runs on (e.g. http://localhost:5173 and your
 *    dev-tunnel URL) to "Authorized JavaScript origins".
 * 3. Put the client ID in .env as VITE_GOOGLE_CLIENT_ID and restart the dev
 *    server (see .env.example).
 */
import { apiConfig } from '../api/config';

/** Shown when the Google OAuth client id is missing from the environment. */
export const GOOGLE_SETUP_MESSAGE =
  'Google sign-in is not configured yet. Create an OAuth client ID (Web application) in Google Cloud Console, add this site to its authorized origins, and set VITE_GOOGLE_CLIENT_ID in your .env file (see .env.example), then restart the dev server.';

/** Credential response handed back by GIS after the user picks an account. */
interface GoogleCredentialResponse {
  credential?: string;
}

/** Error-callback payload (moment failures: popup closed, origin mismatch…). */
interface GoogleIdError {
  type?: string;
  message?: string;
}

/** The small slice of the GIS API this app uses. */
export interface GoogleIdApi {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    error_callback?: (error: GoogleIdError) => void;
    auto_select?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  prompt(): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

/** True when a Google OAuth client id is configured via VITE_GOOGLE_CLIENT_ID. */
export function isGoogleConfigured(): boolean {
  return Boolean(apiConfig.googleClientId);
}

let loaderPromise: Promise<GoogleIdApi> | null = null;

/** Load https://accounts.google.com/gsi/client exactly once. */
export function loadGoogleIdentity(): Promise<GoogleIdApi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      loaderPromise = null; // allow a retry on the next mount/click
      reject(new Error('Google sign-in took too long to load. Check your connection and try again.'));
    }, 15_000);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      const api = window.google?.accounts?.id;
      if (api) {
        resolve(api);
      } else {
        loaderPromise = null;
        reject(new Error('Google sign-in loaded but is unavailable in this browser.'));
      }
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      loaderPromise = null; // allow a retry on the next mount/click
      reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

/** Human messages for the GIS error-callback types we care about. */
const ERROR_MESSAGES: Record<string, string> = {
  popup_closed_by_user: 'The Google sign-in window was closed before finishing.',
  popup_failed_to_open: 'Google could not open its sign-in window. Allow popups for this site and try again.',
  access_denied: 'Google sign-in was cancelled.',
  origin_mismatch: 'This site’s address is not listed as an authorized origin in the Google Cloud OAuth client.',
  client_id_missing: GOOGLE_SETUP_MESSAGE,
  client_id_not_valid: 'The configured VITE_GOOGLE_CLIENT_ID is not a valid Google OAuth client ID.',
};

/**
 * Render Google's official sign-in button into `container` (replacing its
 * content). The button label is "Continue with Google" (localized by Google).
 * `onCredential` receives the signed Google ID token (JWT); `onError`
 * receives a human-readable message for any GIS moment failure.
 */
export async function renderGoogleButton(
  container: HTMLElement,
  onCredential: (credential: string) => void,
  onError?: (message: string) => void,
): Promise<void> {
  const googleId = await loadGoogleIdentity();

  // The container may have been unmounted while the script was loading
  // (e.g. the user navigated away) — never render into a detached node.
  if (!container.isConnected) return;

  // Re-rendering into the same container must replace, not stack, the button.
  // Also guards against React StrictMode's double effect run: once a Google
  // iframe has been rendered for this client id, skip (GIS replaces existing
  // buttons on re-initialize anyway, so this only prevents a wasted pass).
  if (container.dataset.googleRendered === apiConfig.googleClientId) return;

  container.innerHTML = '';

  googleId.initialize({
    client_id: apiConfig.googleClientId,
    // No One-Tap prompt on page load — the user explicitly clicked the button.
    auto_select: false,
    callback: (response) => {
      const credential = response?.credential;
      if (credential) onCredential(credential);
    },
    error_callback: (error) => {
      onError?.(error?.message || ERROR_MESSAGES[error?.type ?? ''] || 'Google sign-in failed. Please try again.');
    },
  });

  // GIS wants a numeric pixel width; clamp it to its supported range.
  const width = Math.min(400, Math.max(220, container.clientWidth || 350));
  googleId.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width,
  });
  // The iframe is now live for this client id.
  container.dataset.googleRendered = apiConfig.googleClientId;
}

/** Forget the Google-chosen account in this browser (used after sign-out). */
export function disableGoogleAutoSelect(): void {
  window.google?.accounts?.id.disableAutoSelect();
}
