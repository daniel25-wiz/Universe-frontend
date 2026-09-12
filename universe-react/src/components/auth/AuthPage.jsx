import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthBackground from './AuthBackground';
import LoginForm from './LoginForm';
import AccountSelection from './AccountSelection';
import SignupForm from './SignupForm';
import { useCurrentUser } from '../../hooks/useAuth';

const AuthPage = () => {
  const { mode = 'login' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: authedUser } = useCurrentUser();
  const [view, setView] = useState(() => {
    if (mode === 'signup') {
      const type = searchParams.get('type');
      return type ? 'signup' : 'account-selection';
    }
    return 'login';
  });
  const [mounted, setMounted] = useState(false);
  const [accountType, setAccountType] = useState(searchParams.get('type') || 'buyer');

  useEffect(() => {
    setMounted(true);
  }, []);

  // SECURITY/UX: users who already have a valid session never see the login
  // form again — they are bounced straight to their dashboard.
  useEffect(() => {
    if (authedUser) {
      navigate(authedUser.accountType === 'seller' ? '/seller' : '/marketplace', { replace: true });
    }
  }, [authedUser, navigate]);

  useEffect(() => {
    if (mounted) {
      if (mode === 'signup') {
        const type = searchParams.get('type');
        setView(type ? 'signup' : 'account-selection');
        if (type) setAccountType(type);
      } else {
        setView('login');
      }
    }
  }, [mode, searchParams, mounted]);

  const handleSwitchToAccountSelection = () => {
    setView('account-selection');
  };

  const handleBackToLogin = () => {
    setView('login');
  };

  const handleClose = () => {
    navigate('/');
  };

  const handleBackToAccountSelection = () => {
    setView('account-selection');
  };

  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%)',
      }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--color-gray-200)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      className="auth-page" 
      style={{ 
        minHeight: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%)',
      }}
    >
      {/* Decorative Background */}
      <AuthBackground />

      {/* Main Content */}
      <main style={{ 
        position: 'relative', 
        zIndex: 1, 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        padding: '0',
      }}>
        {/* Top decorative area with back button */}
        <div style={{ 
          width: '100%', 
          maxWidth: '440px', 
          padding: '32px 24px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}>
          {/* Back button */}
          <div style={{ 
            width: '100%',
            display: 'flex', 
            justifyContent: 'flex-start',
            marginBottom: '8px',
          }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'none',
                border: '1px solid var(--color-gray-200)',
                borderRadius: '12px',
                color: 'var(--color-gray-600)',
                fontSize: '0.9rem',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-gray-200)';
                e.currentTarget.style.color = 'var(--color-gray-600)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Large white rounded container - matches reference */}
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--color-white)',
          borderRadius: '32px',
          boxShadow: '0 24px 64px -16px rgba(15, 23, 42, 0.08), 0 8px 32px -8px rgba(15, 23, 42, 0.04)',
          border: '1px solid var(--color-gray-100)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '32px',
        }}>
          {/* Subtle top gradient accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, var(--color-primary) 0%, #3B82F6 50%, #60A5FA 100%)',
          }} />

          {/* Content padding */}
          <div style={{ padding: '32px 28px 40px' }}>
            {/* Brand logo */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <img
                src="/logo.png"
                alt="Universe"
                style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            {view === 'login' && (
              <LoginForm 
                onSwitchToAccountSelection={handleSwitchToAccountSelection}
                onSwitchToSignup={handleSwitchToAccountSelection}
              />
            )}

            {view === 'account-selection' && (
              <AccountSelection 
                onBackToLogin={handleBackToLogin}
              />
            )}

            {view === 'signup' && (
              <SignupForm 
                onBackToAccountSelection={handleBackToAccountSelection}
                accountType={accountType}
              />
            )}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: 'var(--color-gray-400)',
          padding: '0 24px',
        }}>
          By continuing, you agree to our{' '}
          <Link to="/terms" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</Link>
          {' '}and{' '}
          <Link to="/terms" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
        </p>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .auth-page * {
            animation: none !important;
            transition: none !important;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          main > div:last-child {
            border-radius: 28px !important;
          }
          
          main > div:last-child > div {
            padding: 28px 24px 36px !important;
          }
        }

        @media (max-width: 480px) {
          main > div:last-child {
            border-radius: 24px !important;
          }
          
          main > div:last-child > div {
            padding: 24px 20px 32px !important;
          }
          
          main > div:first-child {
            padding: 24px 16px 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;