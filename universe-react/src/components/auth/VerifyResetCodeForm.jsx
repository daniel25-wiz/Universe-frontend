import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { useVerifyResetCode, useRequestPasswordReset } from '../../hooks/useAuth';
import { ApiError } from '../../api/errors';

const VerifyResetCodeForm = ({ email, onSuccess, onBackToEmail }) => {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  const codeRef = useRef(null);
  const formRef = useRef(null);

  const verifyMutation = useVerifyResetCode();
  const resendMutation = useRequestPasswordReset();
  const isLoading = verifyMutation.isPending;
  const isResending = resendMutation.isPending;

  // Focus management for accessibility
  useEffect(() => {
    codeRef.current?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    
    const newErrors = {};
    if (!code) {
      newErrors.code = 'Verification code is required';
    } else if (code.length !== 6) {
      newErrors.code = 'Please enter the complete 6-digit code';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    verifyMutation.mutate(
      { email, code },
      {
        onSuccess: (data) => {
          if (data.verified) {
            onSuccess?.(code);
          }
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            setErrors(error.fieldErrors);
          } else {
            setServerError(error instanceof ApiError ? error.message : 'Failed to verify code. Please try again.');
          }
        },
      },
    );
  };

  const handleResend = () => {
    if (!canResend || isResending) return;
    
    setServerError(null);
    setErrors({});
    resendMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setTimeLeft(900); // Reset timer to 15 minutes
          setCanResend(false);
          setCode('');
          setServerError(null);
          // Show success feedback
          const successMsg = document.createElement('div');
          successMsg.textContent = 'New verification code sent!';
          successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-size: 0.9rem; font-weight: 500;';
          document.body.appendChild(successMsg);
          setTimeout(() => successMsg.remove(), 3000);
        },
        onError: (error) => {
          setServerError(error instanceof ApiError ? error.message : 'Failed to resend code. Please try again.');
        },
      },
    );
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="auth-verify-code-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '8px' }}>
          Verify Your Email
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-gray-600)', lineHeight: '1.5' }}>
          We've sent a 6-digit verification code to
          <br />
          <strong style={{ color: 'var(--color-gray-800)' }}>{email}</strong>
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

      {/* Code Input */}
      <div className="auth-field-wrapper" style={{ position: 'relative' }}>
        <input
          ref={codeRef}
          type="text"
          inputMode="numeric"
          id="reset-code"
          name="code"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={handleCodeChange}
          disabled={isLoading || isResending}
          style={{
            width: '100%',
            padding: '20px 24px',
            fontSize: '1.5rem',
            fontWeight: 600,
            fontFamily: 'monospace',
            color: 'var(--color-gray-900)',
            backgroundColor: 'var(--color-white)',
            border: '1.5px solid var(--color-gray-200)',
            borderRadius: '16px',
            outline: 'none',
            transition: 'all 0.2s ease',
            textAlign: 'center',
            letterSpacing: '0.5em',
            boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.03)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-primary)';
            e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-gray-200)';
            e.target.style.boxShadow = '0 2px 8px -2px rgba(15, 23, 42, 0.03)';
          }}
          autoComplete="off"
          aria-describedby={errors.code ? 'code-error' : undefined}
          aria-invalid={!!errors.code}
        />
        {errors.code && (
          <p id="code-error" style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {errors.code}
          </p>
        )}
      </div>

      {/* Timer and Resend */}
      <div style={{ textAlign: 'center', marginTop: '-8px' }}>
        {!canResend ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)' }}>
            Code expires in <strong style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{formatTime(timeLeft)}</strong>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isLoading}
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => {
              if (!isResending && !isLoading) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {isResending ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"></circle>
                </svg>
                Resending...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Resend Code
              </>
            )}
          </button>
        )}
      </div>

      {/* Verify Button */}
      <Button
        type="submit"
        className="btn-primary auth-submit-btn"
        disabled={isLoading || isResending || code.length !== 6}
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
            Verifying...
          </>
        ) : (
          <>
            Verify Code
            <ArrowIcon className="btn-icon" style={{ marginLeft: '8px' }} />
          </>
        )}
      </Button>

      {/* Back to Email */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '8px',
        paddingTop: '20px',
        borderTop: '1px solid var(--color-gray-100)',
      }}>
        <button
          type="button"
          onClick={onBackToEmail}
          disabled={isLoading || isResending}
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
          Change Email
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

export default VerifyResetCodeForm;
