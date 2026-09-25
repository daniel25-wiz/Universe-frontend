import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { useResetPassword } from '../../hooks/useAuth';
import { ApiError } from '../../api/errors';

const ResetPasswordForm = ({ email, code, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [serverError, setServerError] = useState(null);
  
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const formRef = useRef(null);

  const resetMutation = useResetPassword();
  const isLoading = resetMutation.isPending;

  // Focus management for accessibility
  useEffect(() => {
    newPasswordRef.current?.focus();
  }, []);

  const validatePasswordStrength = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    
    const newErrors = {};
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      newErrors.newPassword = strengthError;
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    resetMutation.mutate(
      { email, code, newPassword },
      {
        onSuccess: (data) => {
          onSuccess?.(data.message);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            setErrors(error.fieldErrors);
          } else {
            setServerError(error instanceof ApiError ? error.message : 'Failed to reset password. Please try again.');
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
    <form ref={formRef} onSubmit={handleSubmit} className="auth-reset-password-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '8px' }}>
          Create New Password
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-gray-600)', lineHeight: '1.5' }}>
          Your new password must be different from your previous password.
        </p>
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

      {/* New Password Field */}
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
          ref={newPasswordRef}
          type={showNewPassword ? 'text' : 'password'}
          id="new-password"
          name="newPassword"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onFocus={() => setFocusedField('newPassword')}
          onBlur={() => setFocusedField(null)}
          disabled={isLoading}
          style={{
            ...inputStyle('newPassword'),
            paddingLeft: '52px',
            paddingRight: '52px',
          }}
          autoComplete="new-password"
          aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
          aria-invalid={!!errors.newPassword}
        />
        <button
          type="button"
          onClick={() => setShowNewPassword(!showNewPassword)}
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
          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
        >
          {showNewPassword ? (
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
        {errors.newPassword && (
          <p id="new-password-error" style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {errors.newPassword}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <input
          ref={confirmPasswordRef}
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirm-password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFocus={() => setFocusedField('confirmPassword')}
          onBlur={() => setFocusedField(null)}
          disabled={isLoading}
          style={{
            ...inputStyle('confirmPassword'),
            paddingLeft: '52px',
            paddingRight: '52px',
          }}
          autoComplete="new-password"
          aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
          aria-invalid={!!errors.confirmPassword}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? (
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
        {errors.confirmPassword && (
          <p id="confirm-password-error" style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Password Requirements */}
      <div style={{ 
        padding: '12px 16px', 
        borderRadius: '12px', 
        background: 'var(--color-gray-50)', 
        border: '1px solid var(--color-gray-200)',
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Password Requirements
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-gray-600)', lineHeight: '1.6' }}>
          <li>At least 8 characters long</li>
          <li>Contains uppercase and lowercase letters</li>
          <li>Contains at least one number</li>
        </ul>
      </div>

      {/* Reset Password Button */}
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
            Resetting Password...
          </>
        ) : (
          <>
            Reset Password
            <ArrowIcon className="btn-icon" style={{ marginLeft: '8px' }} />
          </>
        )}
      </Button>

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

export default ResetPasswordForm;
