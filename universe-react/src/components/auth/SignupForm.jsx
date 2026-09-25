import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton';
import { useRegister, useGoogleLogin } from '../../hooks/useAuth';
import { ApiError } from '../../api/errors';

const AccountTypeIcon = ({ buyer }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {buyer ? <><path d="M3 10h18l-1.5-6h-15L3 10Z" /><path d="M5 10v10h14V10M8 14h3v6M16 14h-3v6" /></> : <><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>}
  </svg>
);

// Shared eye / eye-off toggle icon used by the password and confirm-password
// fields so both show/hide buttons look identical.
const EyeIcon = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);


const SignupForm = ({ onBackToAccountSelection, accountType = 'buyer' }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [serverError, setServerError] = useState(null);

  const fullNameRef = useRef(null);
  const registerMutation = useRegister();
  const googleLogin = useGoogleLogin();
  const isSubmitting = registerMutation.isPending;
  // Busy while EITHER auth flow runs — the Google flow writes the same
  // session, so both must block each other to prevent double sign-in races.
  const isBusy = isSubmitting || googleLogin.isPending;

  useEffect(() => {
    fullNameRef.current?.focus();
  }, []);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const newErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Goes through: useRegister() -> authApi.register() -> mock/real API -> response
    registerMutation.mutate(
      { fullName: fullName.trim(), email: email.trim(), password, accountType },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
            setErrors(error.fieldErrors);
            if (error.fieldErrors._form) {
              setServerError(error.fieldErrors._form);
            }
          } else {
            setServerError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
          }
        },
      },
    );
  };

  // REAL Google flow: Google Identity Services hands back a signed ID token
  // (JWT) after the user picks an account in Google's own chooser. It runs
  // the SAME auth path as email registration — useGoogleLogin ->
  // authApi.googleLogin() -> POST /auth/google -> shared session + cache.
  const handleGoogleCredential = (credential) => {
    if (isBusy) return;
    setServerError(null);
    setErrors({});
    googleLogin.mutate(
      { credential, accountType },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
            setServerError(String(Object.values(error.fieldErrors)[0]));
          } else {
            setServerError(error instanceof ApiError ? error.message : 'Google sign-up failed. Please try again.');
          }
        },
      },
    );
  };

  // GIS setup/moment failures (script blocked, origin not authorized, popup
  // closed, ...) surface through the same server-error banner.
  const handleGoogleError = (message) => {
    setServerError(message);
  };

  const inputStyle = (fieldName) => ({
    width: '100%',
    padding: '16px 44px 16px 52px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: 'var(--color-gray-800)',
    backgroundColor: 'var(--color-white)',
    border: '1.5px solid var(--color-gray-200)',
    borderRadius: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === fieldName ? '0 0 0 4px rgba(37, 99, 235, 0.12)' : '0 2px 8px -2px rgba(15, 23, 42, 0.03)',
  });

  const iconStyle = {
    position: 'absolute',
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-gray-400)',
    pointerEvents: 'none',
    display: 'flex',
  };

  const toggleStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-gray-500)',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  };

  const errorStyle = {
    color: '#DC2626',
    fontSize: '0.8rem',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
    marginBottom: '8px',
  };

  const isSeller = accountType === 'seller';

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Back to account selection */}
      <button
        type="button"
        onClick={onBackToAccountSelection}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--color-gray-500)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '0',
          alignSelf: 'flex-start',
          fontFamily: 'inherit',
          transition: 'color 0.2s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-gray-900)', margin: '0 0 8px', fontFamily: 'inherit' }}>
          Create your account
        </h2>
        <p style={{ color: 'var(--color-gray-500)', fontSize: '0.95rem', margin: 0 }}>
          {isSeller
            ? 'Start selling your products to thousands of buyers.'
            : 'Join Universe and discover amazing products.'}
        </p>
      </div>

      {/* Account type badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: '14px',
          background: isSeller ? '#FFF7ED' : '#EFF6FF',
          border: `1px solid ${isSeller ? '#FED7AA' : '#BFDBFE'}`,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: isSeller ? '#C2410C' : '#1D4ED8' }}>
          <AccountTypeIcon buyer={!isSeller} />
          {isSeller ? 'Seller Account' : 'Buyer Account'}
        </span>
        <button
          type="button"
          onClick={onBackToAccountSelection}
          style={{
            background: 'none',
            border: 'none',
            color: isSeller ? '#C2410C' : '#1D4ED8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          Change
        </button>
      </div>

      {/* Server error */}
      {serverError && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}

      {/* Full name */}
      <div>
        <label htmlFor="signup-fullname" style={labelStyle}>Full name</label>
        <div style={{ position: 'relative' }}>
          <span style={iconStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            id="signup-fullname"
            ref={fullNameRef}
            type="text"
            value={fullName}
            placeholder="John Doe"
            autoComplete="name"
            disabled={isBusy}
            onChange={(e) => setFullName(e.target.value)}
            onFocus={() => setFocusedField('fullName')}
            onBlur={() => setFocusedField(null)}
            style={inputStyle('fullName')}
          />
        </div>
        {errors.fullName && <p style={errorStyle}>{errors.fullName}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="signup-email" style={labelStyle}>Email address</label>
        <div style={{ position: 'relative' }}>
          <span style={iconStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
          </span>
          <input
            id="signup-email"
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isBusy}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            style={inputStyle('email')}
          />
        </div>
        {errors.email && <p style={errorStyle}>{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="signup-password" style={labelStyle}>Password</label>
        <div style={{ position: 'relative' }}>
          <span style={iconStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={isBusy}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            style={inputStyle('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={toggleStyle}
            tabIndex={-1}
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
        {errors.password && <p style={errorStyle}>{errors.password}</p>}
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="signup-confirm" style={labelStyle}>Confirm password</label>
        <div style={{ position: 'relative' }}>
          <span style={iconStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            id="signup-confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            disabled={isBusy}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            style={inputStyle('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            style={toggleStyle}
            tabIndex={-1}
          >
            <EyeIcon off={showConfirmPassword} />
          </button>
        </div>
        {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
      </div>

      {/* Terms agreement */}
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            color: 'var(--color-gray-600)',
            lineHeight: 1.5,
          }}
        >
          <input
            type="checkbox"
            checked={agreeToTerms}
            disabled={isBusy}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer', flexShrink: 0 }}
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/terms" style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</Link>
          </span>
        </label>
        {errors.agreeToTerms && <p style={errorStyle}>{errors.agreeToTerms}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isBusy}
        style={{
          width: '100%',
          padding: '16px',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #3B82F6 100%)',
          color: 'var(--color-white)',
          border: 'none',
          borderRadius: '16px',
          fontSize: '1rem',
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'all 0.2s ease',
          boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.35)',
        }}
      >
        {isSubmitting ? (
          <>
            <span
              style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'authSpin 0.8s linear infinite',
              }}
            />
            Creating account...
          </>
        ) : (
          <>
            Create Account
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </button>

      {/* Divider + Continue with Google — real Google Identity Services
          button. The returned ID token runs the SAME auth path as email
          registration. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-gray-200)' }} />
        <span style={{ color: 'var(--color-gray-400)', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-gray-200)' }} />
      </div>

      <GoogleSignInButton
        onCredential={handleGoogleCredential}
        onError={handleGoogleError}
        loading={googleLogin.isPending}
        disabled={isSubmitting}
      />

      {/* Sign in link */}
      <div style={{ textAlign: 'center', marginTop: '4px', paddingTop: '16px', borderTop: '1px solid var(--color-gray-100)' }}>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '0.95rem', margin: 0 }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            Sign In
          </button>
        </p>
      </div>

      <style>{`
        @keyframes authSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default SignupForm;
