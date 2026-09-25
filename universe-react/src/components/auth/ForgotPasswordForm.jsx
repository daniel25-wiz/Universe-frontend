import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { useRequestPasswordReset } from '../../hooks/useAuth';
import { ApiError } from '../../api/errors';

const ForgotPasswordForm = ({ onSuccess, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const emailRef = useRef(null);
  const formRef = useRef(null);

  const requestResetMutation = useRequestPasswordReset();
  const isLoading = requestResetMutation.isPending;

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
    setSuccessMessage(null);
    
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    requestResetMutation.mutate(
      { email: email.trim() },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          // Pass email and devOtp (in dev mode) to the parent
          onSuccess?.(email.trim(), data.devOtp);
        },
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
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="auth-forgot-password-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '8px' }}>
          Forgot Password?
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-gray-600)', lineHeight: '1.5' }}>
          No worries! Enter your email and we'll send you a verification code to reset your password.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          {successMessage}
        </div>
      )}

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
          id="reset-email"
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

      {/* Send Code Button */}
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
            Sending Code...
          </>
        ) : (
          <>
            Send Verification Code
            <ArrowIcon className="btn-icon" style={{ marginLeft: '8px' }} />
          </>
        )}
      </Button>

      {/* Back to Login */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '16px',
        paddingTop: '20px',
        borderTop: '1px solid var(--color-gray-100)',
      }}>
        <button
          type="button"
          onClick={onBackToLogin}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-gray-600)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
            e.currentTarget.style.color = 'var(--color-gray-800)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-gray-600)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Login
        </button>
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

export default ForgotPasswordForm;
