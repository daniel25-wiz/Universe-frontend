import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import '../styles/NotFound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          {/* 404 Number with gradient */}
          <div className="not-found-number">
            <span className="gradient-text">404</span>
          </div>

          {/* Icon with floating animation */}
          <div className="not-found-icon-wrapper">
            <svg 
              className="not-found-icon" 
              width="120" 
              height="120" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>

          {/* Title and Description */}
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-description">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>

          {/* Action Buttons */}
          <div className="not-found-actions">
            <Button 
              className="btn-primary btn-not-found-primary" 
              onClick={handleGoHome}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go Home
            </Button>
            <Button 
              className="btn-outline btn-not-found-secondary" 
              onClick={handleGoBack}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Go Back
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="not-found-links">
            <p className="not-found-links-title">Looking for something?</p>
            <div className="not-found-links-grid">
              <button className="not-found-link" onClick={() => navigate('/marketplace')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Marketplace
              </button>
              <button className="not-found-link" onClick={() => navigate('/cart')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Cart
              </button>
              <button className="not-found-link" onClick={() => navigate('/auth')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Sign In
              </button>
              <button className="not-found-link" onClick={() => navigate('/seller')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Seller Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="not-found-decorations">
          <div className="decoration-circle decoration-1"></div>
          <div className="decoration-circle decoration-2"></div>
          <div className="decoration-circle decoration-3"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
