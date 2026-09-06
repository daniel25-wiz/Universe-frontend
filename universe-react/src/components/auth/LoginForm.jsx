import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { useLogin } from '../../hooks/useAuth';
import { ApiError } from '../../api/errors';

const LoginForm = ({ onSwitchToAccountSelection }) => {
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
  const isLoading = loginMutation.isPending;

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
    console.log('Forgot password clicked');
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
          disabled={isLoading}
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
          disabled={isLoading}
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
            disabled={isLoading}
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
        disabled={isLoading}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          type="button"
          className="auth-social-btn"
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 20px',
            border: '1.5px solid var(--color-gray-200)',
            borderRadius: '14px',
            background: 'var(--color-white)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 500,
            fontSize: '0.95rem',
            color: 'var(--color-gray-700)',
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseOver={(e) => !isLoading && (e.target.style.borderColor = 'var(--color-primary)', e.target.style.backgroundColor = 'var(--color-primary-light)', e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 8px 24px -4px rgba(37, 99, 235, 0.15)')}
          onMouseOut={(e) => !isLoading && (e.target.style.borderColor = 'var(--color-gray-200)', e.target.style.backgroundColor = 'var(--color-white)', e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button
          type="button"
          className="auth-social-btn"
          disabled={loginMutation.isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 20px',
            border: '1.5px solid var(--color-gray-200)',
            borderRadius: '14px',
            background: 'var(--color-white)',
            cursor: loginMutation.isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 500,
            fontSize: '0.95rem',
            color: 'var(--color-gray-700)',
            opacity: loginMutation.isPending ? 0.6 : 1,
          }}
          onMouseOver={(e) => !loginMutation.isPending && (e.target.style.borderColor = 'var(--color-primary)', e.target.style.backgroundColor = 'var(--color-primary-light)', e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 8px 24px -4px rgba(37, 99, 235, 0.15)')}
          onMouseOut={(e) => !loginMutation.isPending && (e.target.style.borderColor = 'var(--color-gray-200)', e.target.style.backgroundColor = 'var(--color-white)', e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
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