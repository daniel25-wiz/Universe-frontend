import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from './ForgotPasswordForm';
import VerifyResetCodeForm from './VerifyResetCodeForm';
import ResetPasswordForm from './ResetPasswordForm';

/**
 * Password reset flow orchestrator.
 *
 * Manages the three-step password reset process:
 * 1. Request reset (email input)
 * 2. Verify OTP (code input)
 * 3. Reset password (new password input)
 *
 * State is lifted here so the flow can move between steps while preserving
 * email and verified code across forms.
 */
const PasswordResetFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: verify, 3: reset, 4: success
  const [email, setEmail] = useState('');
  const [verifiedCode, setVerifiedCode] = useState('');
  const [devOtp, setDevOtp] = useState(''); // Dev mode only

  const handleEmailSuccess = (submittedEmail, otp) => {
    setEmail(submittedEmail);
    setDevOtp(otp || '');
    setStep(2);
  };

  const handleVerifySuccess = (code) => {
    setVerifiedCode(code);
    setStep(3);
  };

  const handleResetSuccess = (message) => {
    setStep(4);
  };

  const handleBackToLogin = () => {
    navigate('/auth/login');
  };

  const handleBackToEmail = () => {
    setStep(1);
    setVerifiedCode('');
  };

  return (
    <div className="password-reset-flow" style={{ width: '100%', maxWidth: '480px' }}>
      {step === 1 && (
        <ForgotPasswordForm
          onSuccess={handleEmailSuccess}
          onBackToLogin={handleBackToLogin}
        />
      )}

      {step === 2 && (
        <VerifyResetCodeForm
          email={email}
          onSuccess={handleVerifySuccess}
          onBackToEmail={handleBackToEmail}
        />
      )}

      {step === 3 && (
        <ResetPasswordForm
          email={email}
          code={verifiedCode}
          onSuccess={handleResetSuccess}
        />
      )}

      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
          {/* Success Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '12px' }}>
              Password Reset Successful!
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--color-gray-600)', lineHeight: '1.6', marginBottom: '8px' }}>
              Your password has been successfully reset.
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-gray-500)', lineHeight: '1.5' }}>
              You can now log in with your new password.
            </p>
          </div>

          {/* Success Box */}
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 2a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5z"></path>
                <circle cx="12" cy="15" r="1"></circle>
              </svg>
              <p style={{ fontSize: '0.9rem', color: '#15803D', margin: 0, textAlign: 'left', lineHeight: '1.5' }}>
                For your security, all active sessions have been logged out. Please log in again.
              </p>
            </div>
          </div>

          {/* Go to Login Button */}
          <button
            onClick={handleBackToLogin}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'white',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
            }}
          >
            Go to Login
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Development Helper - Show OTP in dev mode */}
      {step === 2 && devOtp && import.meta.env.DEV && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          fontSize: '0.85rem',
          color: '#92400E',
        }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>
            🔧 Development Mode
          </p>
          <p style={{ margin: 0 }}>
            Your verification code is: <strong style={{ fontFamily: 'monospace', fontSize: '1.1em', letterSpacing: '0.1em' }}>{devOtp}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordResetFlow;
