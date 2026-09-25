import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import GoogleSignInButton from './GoogleSignInButton';
import { useLogin, useGoogleLogin } from '../../hooks/useAuth';
import { ApiError } from '../../api/errors';

const LoginForm = ({ onSwitchToAccountSelection }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [serverError, setServerError] = useState(null);
  
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const formRef = useRef(null);

  const loginMutation = useLogin();
  const googleLogin = useGoogleLogin();
  const isLoading = loginMutation.isPending;
  // Busy while EITHER auth flow runs — the Google flow writes the same
  // session, so both must block each other to prevent double sign-in races.
  const isBusy = isLoading || googleLogin.isPending;

  // Focus management for accessibility
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    
    const newErrors = {};
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
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    loginMutation.mutate(
      { email: email.trim(), password, rememberMe },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            setErrors(error.fieldErrors);
          } else {
            setServerError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
          }
        },
      },
    );
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/auth/forgot-password');
  };

  // REAL Google flow: Google Identity Services hands back a signed ID token
  // (JWT) after the user picks an account in Google's own chooser. It runs
  // the SAME auth path as email/password login — useGoogleLogin ->
  // authApi.googleLogin() -> POST /auth/google -> shared session + cache.
  const handleGoogleCredential = (credential) => {
    if (isBusy) return;
    setServerError(null);
    setErrors({});
    googleLogin.mutate(
      { credential, rememberMe },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
            setServerError(String(Object.values(error.fieldErrors)[0]));
          } else {
            setServerError(error instanceof ApiError ? error.message : 'Google sign-in failed. Please try again.');
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
    padding: '16px 16px 16px 52px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: 'var(--color-gray-800)',
    backgroundColor: 'var(--color-white)',
    border: '1.5px solid var(--color-gray-200)',
    borderRadius: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === fieldName ? '0 0 0 4px rgba(37, 99, 235, 0.12)' : '0 2px 8px -2px rgba(15, 23, 42, 0.03)',
    '&:hover': {
      borderColor: 'var(--color-gray-300)',
    },
    '&:focus': {
      borderColor: 'var(--color-primary)',
      boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="auth-login-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Server error */}
      {serverError && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}
      {/* Email Field */}
      <div className="auth-field-wrapper" style={{ position: 'relative' }}>
        <div 
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            backgroundColor: 'var(--color-primary-light)',
            borderRadius: '6px',
            color: 'var(--color-primary)',
            zIndex: 2,
            pointerEvents: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
        </div>
        <input
          ref={emailRef}
          type="email"
          id="email"
          name="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          disabled={isBusy}
          style={{
            ...inputStyle('email'),
            paddingLeft: '52px',
          }}
          autoComplete="email"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p id="email-error" style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="auth-field-wrapper" style={{ position: 'relative' }}>
        <div 
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            backgroundColor: 'var(--color-primary-light)',
            borderRadius: '6px',
            color: 'var(--color-primary)',
            zIndex: 2,
            pointerEvents: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <input
          ref={passwordRef}
          type={showPassword ? 'text' : 'password'}
          id="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          disabled={isBusy}
          style={{
            ...inputStyle('password'),
            paddingLeft: '52px',
            paddingRight: '52px',
          }}
          autoComplete="current-password"
          aria-describedby={errors.password ? 'password-error' : undefined}
          aria-invalid={!!errors.password}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-gray-400)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            zIndex: 2,
          }}
          onMouseOver={(e) => e.target.style.color = 'var(--color-gray-600)'}
          onMouseOut={(e) => e.target.style.color = 'var(--color-gray-400)'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </button>
        {errors.password && (
          <p id="password-error" style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {errors.password}
          </p>
        )}
      </div>

        {/* Remember Me & Forgot Password */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isBusy}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '5px',
              border: '1.5px solid var(--color-gray-300)',
              appearance: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              backgroundColor: rememberMe ? 'var(--color-primary)' : 'transparent',
              borderColor: rememberMe ? 'var(--color-primary)' : 'var(--color-gray-300)',
              backgroundImage: rememberMe ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E\")" : 'none',
              backgroundSize: '14px 14px',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
            onMouseOver={(e) => !rememberMe && (e.target.style.borderColor = 'var(--color-primary)')}
            onMouseOut={(e) => !rememberMe && (e.target.style.borderColor = 'var(--color-gray-300)')}
          />
          <span style={{ userSelect: 'none' }}>Remember me</span>
        </label>
        <a 
          href="#" 
          onClick={handleForgotPassword}
          style={{ 
            color: 'var(--color-primary)', 
            fontSize: '0.9rem', 
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseOver={(e) => e.target.style.color = 'var(--color-primary-hover)'}
          onMouseOut={(e) => e.target.style.color = 'var(--color-primary)'}
        >
          Forgot password?
        </a>
      </div>

      {/* Sign In Button */}
      <Button
        type="submit"
        className="btn-primary auth-submit-btn"
        disabled={isBusy}
        style={{ 
          width: '100%', 
          padding: '16px 24px', 
          fontSize: '1rem',
          marginTop: '4px',
        }}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"></circle>
            </svg>
            Signing in...
          </>
        ) : (
          <>
            Sign In
            <ArrowIcon className="btn-icon" style={{ marginLeft: '8px' }} />
          </>
        )}
      </Button>

      {/* Divider */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginTop: '8px',
        marginBottom: '8px',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-gray-200)' }} />
        <span style={{ color: 'var(--color-gray-400)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-gray-200)' }} />
      </div>

      {/* Social Sign In Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Continue with Google — real Google Identity Services button. The
            returned ID token runs the SAME auth path as email/password
            login. */}
        <GoogleSignInButton
          onCredential={handleGoogleCredential}
          onError={handleGoogleError}
          loading={googleLogin.isPending}
          disabled={isLoading}
        />
      </div>

      {/* Sign Up Link */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid var(--color-gray-100)',
      }}>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '0.95rem' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToAccountSelection}
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              padding: 0,
              transition: 'color 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--color-primary-hover)'}
            onMouseOut={(e) => e.target.style.color = 'var(--color-primary)'}
          >
            Create Account
          </button>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </form>
  );
};

export default LoginForm;