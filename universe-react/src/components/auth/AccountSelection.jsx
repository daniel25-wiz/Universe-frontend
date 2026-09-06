import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';

const AccountSelection = ({ onBackToLogin }) => {
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateCards(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const cardStyle = (delay) => ({
    opacity: animateCards ? 1 : 0,
    transform: animateCards ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  const handleCreateAccount = (accountType) => {
    window.location.href = `/auth/signup?type=${accountType}`;
  };

  return (
    <div className="auth-account-selection" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Header */}
      <div className="auth-selection-header" style={{ textAlign: 'center', paddingTop: '4px' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontWeight: 800, 
          fontSize: 'clamp(1.5rem, 3.5vw, 1.875rem)', 
          lineHeight: 1.2, 
          color: 'var(--color-black)', 
          letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}>
          Create Your Account
        </h1>
        <p style={{ 
          fontSize: '0.95rem', 
          color: 'var(--color-gray-600)', 
          lineHeight: 1.5,
          maxWidth: '480px',
          margin: '0 auto',
        }}>
          Start your store, shop millions of products.
        </p>
      </div>

      {/* Account Type Cards */}
      <div className="auth-account-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Seller Card */}
        <article 
          className="auth-account-card auth-seller-card"
          style={{
            ...cardStyle(0),
            position: 'relative',
            background: 'var(--color-white)',
            borderRadius: '20px',
            border: '1px solid var(--color-gray-200)',
            padding: '24px',
            boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.03), 0 1px 4px -1px rgba(15, 23, 42, 0.02)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(15, 23, 42, 0.06), 0 4px 16px -4px rgba(15, 23, 42, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 12px -2px rgba(15, 23, 42, 0.03), 0 1px 4px -1px rgba(15, 23, 42, 0.02)';
            e.currentTarget.style.borderColor = 'var(--color-gray-200)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Icon - small circular light-blue background */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(37, 99, 235, 0.1)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          </div>

          {/* Heading */}
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 700, 
            fontSize: '1.125rem', 
            color: 'var(--color-black)', 
            marginBottom: '6px',
            lineHeight: 1.3,
            textAlign: 'center',
          }}>
            Create Seller Account
          </h2>

          {/* Decorative underline */}
          <div style={{
            width: '40px',
            height: '3px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, var(--color-primary) 0%, #3B82F6 100%)',
            margin: '0 auto 12px',
          }} />

          {/* Description - two short lines */}
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-gray-600)', 
            lineHeight: 1.6,
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            START YOUR STORE.{' '}
            <br />
            <span style={{ fontWeight: 400 }}>Skip The Stress</span>
          </p>

          {/* CTA Button - Filled blue, full width, ~52px height */}
          <Button
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '14px 24px', 
              fontSize: '0.95rem',
              justifyContent: 'center',
              height: '52px',
              borderRadius: '12px',
            }}
            onClick={() => handleCreateAccount('seller')}
          >
            Create Seller Account
            <ArrowIcon className="btn-icon" style={{ marginLeft: '8px', color: 'var(--color-white)' }} />
          </Button>
        </article>

        {/* Buyer Card */}
        <article 
          className="auth-account-card auth-buyer-card"
          style={{
            ...cardStyle(0.08),
            position: 'relative',
            background: 'var(--color-white)',
            borderRadius: '20px',
            border: '1px solid var(--color-gray-200)',
            padding: '24px',
            boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.03), 0 1px 4px -1px rgba(15, 23, 42, 0.02)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(15, 23, 42, 0.06), 0 4px 16px -4px rgba(15, 23, 42, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 12px -2px rgba(15, 23, 42, 0.03), 0 1px 4px -1px rgba(15, 23, 42, 0.02)';
            e.currentTarget.style.borderColor = 'var(--color-gray-200)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Icon - small circular light-blue background */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(37, 99, 235, 0.1)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>

          {/* Heading */}
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 700, 
            fontSize: '1.125rem', 
            color: 'var(--color-black)', 
            marginBottom: '6px',
            lineHeight: 1.3,
            textAlign: 'center',
          }}>
            Create Buyer Account
          </h2>

          {/* Decorative underline */}
          <div style={{
            width: '40px',
            height: '3px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, var(--color-primary) 0%, #3B82F6 100%)',
            margin: '0 auto 12px',
          }} />

          {/* Description - two short lines */}
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-gray-600)', 
            lineHeight: 1.6,
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            ONE SITE, MILLIONS OF PRODUCTS.{' '}
            <br />
            <span style={{ fontWeight: 400 }}>Shop with confidence</span>
          </p>

          {/* CTA Button - Outlined, white background, thin blue outline, blue text, ~52px height */}
          <Button
            className="btn-outline"
            style={{ 
              width: '100%', 
              padding: '14px 24px', 
              fontSize: '0.95rem',
              justifyContent: 'center',
              height: '52px',
              borderRadius: '12px',
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-white)',
            }}
            onClick={() => handleCreateAccount('buyer')}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
              e.currentTarget.style.color = 'var(--color-primary-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-white)';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
          >
            Create Buyer Account
            <ArrowIcon className="btn-icon" style={{ marginLeft: '8px', color: 'var(--color-primary)' }} />
          </Button>
        </article>
      </div>

      {/* Back to Login Link */}
      <div style={{ 
        textAlign: 'center', 
        paddingTop: '12px',
      }}>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              padding: 0,
              transition: 'color 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--color-primary-hover)'}
            onMouseOut={(e) => e.target.style.color = 'var(--color-primary)'}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default AccountSelection;