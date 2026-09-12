import { Link } from 'react-router-dom';
import { prefetchPropsForPath } from '../lib/prefetch';

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-info">
            <a href="#" className="logo">
              <img src="/logo.png" alt="Universe" className="logo-img" style={{ height: '40px' }} />
            </a>
            <p className="footer-text">
              Establish, optimize, and scale your online business globally with our premium cloud marketplace system.
            </p>
            <div className="social-links">
              <a href="#" className="social-btn" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#" className="social-btn" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="#" className="social-btn" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Marketplace</h4>
            <ul className="footer-links">
              <li><a href="#marketplace" className="footer-link">Explore Products</a></li>
              <li><a href="#features" className="footer-link">Featured Brands</a></li>
              <li><a href="#" className="footer-link">Global Shipping</a></li>
              <li><a href="#" className="footer-link">Buyer Protection</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Contact Sales</a></li>
              <li><a href="#" className="footer-link">System Status</a></li>
              <li><a href="#" className="footer-link">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/terms" className="footer-link" {...prefetchPropsForPath('/terms')}>Privacy Policy</Link></li>
              <li>
                <Link to="/terms" className="footer-link" {...prefetchPropsForPath('/terms')}>
                  Terms of Service
                </Link>
              </li>
              <li><a href="#" className="footer-link">Sellers Agreement</a></li>
              <li><a href="#" className="footer-link">GDPR Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Universe Inc. All rights reserved.</div>
          <div style={{ display: "flex", gap: "24px" }}>
            <a href="#">Status</a>
            <a href="#">Privacy</a>
            <Link to="/terms" {...prefetchPropsForPath('/terms')}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;