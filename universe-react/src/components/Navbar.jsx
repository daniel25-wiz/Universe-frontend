import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import ArrowIcon from './ui/ArrowIcon';
import { prefetchPropsForPath, triggerHomeSectionsLoad } from '../lib/prefetch';

const Navbar = ({ cartCount }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleAuthClick = (mode) => {
    navigate(`/auth/${mode}`);
    setMenuOpen(false);
  };

  /**
   * In-page section links (#marketplace, #dashboard, ...). Those sections only
   * exist after the below-the-fold chunk loads, so we trigger that load and
   * smooth-scroll once the target node appears.
   */
  const handleSectionClick = (selector) => (e) => {
    e.preventDefault();
    triggerHomeSectionsLoad();
    const tryScroll = () => {
      const el = document.querySelector(selector);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.setTimeout(tryScroll, 120);
    };
    window.setTimeout(tryScroll, 50);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="container">
          <Link to="/" className="logo" {...prefetchPropsForPath('/')}>
            <img src="/logo.png" alt="Universe" className="logo-img" />
          </Link>

          <ul className="nav-menu">
            <li><Link to="/" className="nav-link active" {...prefetchPropsForPath('/')}>Home</Link></li>
            <li><Link to="#marketplace" className="nav-link" onClick={handleSectionClick('#marketplace')}>Marketplace</Link></li>
            <li><Link to="#features-showcase" className="nav-link" onClick={handleSectionClick('#features-showcase')}>Features</Link></li>
            <li><Link to="#dashboard" className="nav-link" onClick={handleSectionClick('#dashboard')}>Dashboard</Link></li>
            <li><Link to="#contact" className="nav-link" onClick={handleSectionClick('#contact')}>Contact</Link></li>
          </ul>

          <div className="nav-actions">
            <button className="cart-btn" aria-label="Shopping Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
            <Button className="btn-outline" onClick={() => handleAuthClick('login')} {...prefetchPropsForPath('/auth')}>Sign In</Button>
            <Button className="btn-primary" onClick={() => handleAuthClick('signup')} {...prefetchPropsForPath('/auth/signup')}>Get Started <ArrowIcon /></Button>
          </div>

          <button className={`hamburger ${menuOpen ? "open" : ""}`} onClick={toggleMenu} aria-label="Toggle Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu-overlay ${menuOpen ? "open" : ""}`} onClick={toggleMenu}></div>
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <ul className="mobile-nav">
          <li><Link to="/" className="mobile-nav-link" onClick={toggleMenu} {...prefetchPropsForPath('/')}>Home</Link></li>
          <li><Link to="#marketplace" className="mobile-nav-link" onClick={handleSectionClick('#marketplace')}>Marketplace</Link></li>
          <li><Link to="#features-showcase" className="mobile-nav-link" onClick={handleSectionClick('#features-showcase')}>Features</Link></li>
          <li><Link to="#dashboard" className="mobile-nav-link" onClick={handleSectionClick('#dashboard')}>Dashboard</Link></li>
          <li><Link to="#contact" className="mobile-nav-link" onClick={handleSectionClick('#contact')}>Contact</Link></li>
        </ul>
        <div className="mobile-actions">
          <Button className="btn-outline" style={{ width: "100%" }} onClick={() => handleAuthClick('login')} {...prefetchPropsForPath('/auth')}>Sign In</Button>
          <Button className="btn-primary" style={{ width: "100%" }} onClick={() => handleAuthClick('signup')} {...prefetchPropsForPath('/auth/signup')}>Create Store <ArrowIcon /></Button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
