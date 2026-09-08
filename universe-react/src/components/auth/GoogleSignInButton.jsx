/**
 * "Continue with Google" button — REAL Google Identity Services integration.
 *
 * When VITE_GOOGLE_CLIENT_ID is configured, Google's own official button is
 * rendered here (localized label "Continue with Google"). Clicking it opens
 * Google's account chooser and the signed ID token (JWT) is forwarded to
 * `onCredential` — the parent runs the SAME auth flow as email/password
 * login (useGoogleLogin -> POST /auth/google).
 *
 * Without a client id, the styled fallback button reports the setup steps
 * through `onError` instead of faking a sign-in.
 *
 * Loading: while `loading` is true the button is dimmed and ignores clicks;
 * if authentication fails the parent clears `loading` and the button is
 * restored.
 */
import { useEffect, useRef } from 'react';
import { GOOGLE_SETUP_MESSAGE, isGoogleConfigured, renderGoogleButton } from '../../lib/googleIdentity';

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GoogleSignInButton = ({ onCredential, onError, loading = false, disabled = false }) => {
  const containerRef = useRef(null);
  // Latest-callback refs: the GIS button renders ONCE per mount, so the
  // handlers it triggers must always run the parent's current closures.
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  const isDisabled = loading || disabled;
  const configured = isGoogleConfigured();

  useEffect(() => {
    if (!configured) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;
    let cancelled = false;
    renderGoogleButton(
      container,
      (credential) => {
        if (!cancelled) onCredentialRef.current(credential);
      },
      (message) => {
        if (!cancelled) onErrorRef.current?.(message);
      },
    ).catch((error) => {
      if (!cancelled) onErrorRef.current?.(error?.message || 'Could not load Google sign-in. Please try again.');
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  if (!configured) {
    // No OAuth client id configured — surface the setup steps instead of
    // faking a Google account.
    return (
      <>
        <button
          type="button"
          className="auth-social-btn"
          disabled={isDisabled}
          aria-busy={loading}
          title={GOOGLE_SETUP_MESSAGE}
          onClick={() => onErrorRef.current?.(GOOGLE_SETUP_MESSAGE)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '14px 20px',
            border: '1.5px solid var(--color-gray-200)',
            borderRadius: '14px',
            background: 'var(--color-white)',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 500,
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            color: 'var(--color-gray-700)',
            opacity: isDisabled ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (isDisabled) return;
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(37, 99, 235, 0.15)';
          }}
          onMouseOut={(e) => {
            if (isDisabled) return;
            e.currentTarget.style.borderColor = 'var(--color-gray-200)';
            e.currentTarget.style.backgroundColor = 'var(--color-white)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(37, 99, 235, 0.25)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'googleBtnSpin 0.8s linear infinite',
                  flexShrink: 0,
                }}
              />
              Signing in...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>
        <p
          style={{
            margin: 0,
            fontSize: '0.72rem',
            color: 'var(--color-gray-400)',
            textAlign: 'center',
          }}
        >
          Google sign-in is disabled — add <code>VITE_GOOGLE_CLIENT_ID</code> to your <code>.env</code> to
          enable the real Google button.
        </p>
        <style>{`
          @keyframes googleBtnSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  // Real Google button — Google renders and styles it; we just dim/block it
  // while an auth round-trip is in flight.
  return (
    <div
      ref={containerRef}
      aria-busy={loading}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '48px',
        opacity: isDisabled ? 0.6 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto',
        transition: 'opacity 0.2s ease',
      }}
    />
  );
};

export default GoogleSignInButton;
