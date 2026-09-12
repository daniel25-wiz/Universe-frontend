import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../seller-dashboard.css';
import './public-marketplace.css';
import { useProducts } from '../../../hooks/useProducts';
import { useCurrentUser } from '../../../hooks/useAuth';
import { getFirstName, formatMoney } from '../../../lib/user';

const CATEGORIES = [
  { name: 'Supermarket', icon: 'storefront' },
  { name: 'Fashion', icon: 'checkroom' },
  { name: 'Electronics', icon: 'devices', active: true },
  { name: 'Computing', icon: 'laptop' },
  { name: 'Health & Beauty', icon: 'drive_file_stream', dataIcon: 'shaving_kit' },
  { name: 'Home & Office', icon: 'chair' },
  { name: 'Appliances', icon: 'kitchen' },
  { name: 'Gaming', icon: 'sports_esports' },
];

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTwCi7hKy8ukXTfyOpKv9dZv8_yIMFwgAUkt4fHy7JEtNtsmfXQADwqqS5pTVmT3XH_02TZRJBH4sfWHwKWethinUt5yDEa6gES7pnspKhvfapmf_CiBfe_auza4KxqiFum0eVFhNq8TXrGmU0grUfr5885DX4eGK_3CUORY0hJXX7uU5Cw1RPgo0pLqDQjlTs4fSee3Gg-DbSm61jcMfvPE8izD94S2KAA7adW_5Fb58U4GjNGpQr';
const HERO_ALT =
  'A brightly lit, modern living room showcasing sleek, contemporary furniture, a large flat-screen TV, and subtle smart home devices. The overall aesthetic is clean, sophisticated, and premium, utilizing a cool white color palette with warm wood accents, communicating high-end retail quality.';
/**
 * Public Marketplace homepage — port of marketplace_jumia_style_blue.html
 */
function PublicMarketplace({ cartItems = [], onAddToCart }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Electronics');
  const { data: user } = useCurrentUser();
  const { data: catalogProducts, isLoading } = useProducts({ status: 'active', pageSize: 200 });
  const products = catalogProducts ?? [];

  return (
    <div className="sd-root mp-root">
      {/* TopNavBar */}
      <header className="mp-topnav">
        <div className="mp-topnav-inner">
          <div className="mp-topnav-left">
            <button className="mp-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <img src="/logo.png" alt="MarketPlace" className="mp-logo-img" />
          </div>
          <div className="mp-search-box">
            <span className="material-symbols-outlined mp-search-icon">search</span>
            <input type="text" placeholder="Search products, brands and categories" />
            <button className="mp-search-btn">SEARCH</button>
          </div>
          <div className="mp-top-actions">
            <div className="mp-top-action">
              <span className="material-symbols-outlined">person</span>
              <span className="mp-action-label">Hi, {getFirstName(user?.fullName)}</span>
            </div>
            <Link to="/cart" className="mp-top-action mp-cart-action">
              <span className="material-symbols-outlined">shopping_cart</span>
              <span className="mp-action-label">Cart ({cartItems.reduce((total, item) => total + item.quantity, 0)})</span>
              {cartItems.length > 0 && <span className="mp-cart-count">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>}
            </Link>
          </div>
        </div>
        <div className="mp-subnav">
          <a href="#" className="mp-subnav-link">
            Official Stores
          </a>
          <a href="#" className="mp-subnav-link active">
            Flash Sales
          </a>
          <a href="#" className="mp-subnav-link">
            Help
          </a>
        </div>
      </header>

      {/* Mobile categories drawer */}
      {menuOpen && (
        <>
          <div className="mp-mobile-overlay" onClick={() => setMenuOpen(false)} />
          <aside className="mp-sidebar mp-sidebar-mobile">
            <button
              className="mp-drawer-close"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="mp-sidebar-head">
              <h2 className="mp-sidebar-title">Categories</h2>
              <p className="mp-sidebar-sub">Shop by Department</p>
            </div>
            <nav className="mp-cat-list">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.name}
                  href="#"
                  data-icon={cat.dataIcon}
                  className={`mp-cat${cat.active ? ' active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined">{cat.icon}</span>
                  <span>{cat.name}</span>
                </a>
              ))}
            </nav>
          </aside>
        </>
      )}

      <main className="mp-main">
        {/* SideNavBar (Categories) */}
        <aside className="mp-sidebar">
          <div className="mp-sidebar-head">
            <h2 className="mp-sidebar-title">Categories</h2>
            <p className="mp-sidebar-sub">Shop by Department</p>
          </div>
          <nav className="mp-cat-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                data-icon={cat.dataIcon}
                className={`mp-cat${activeCategory === cat.name ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <span className="material-symbols-outlined">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="mp-content">
          {/* Hero & Right Column */}
          <div className="mp-hero-grid">
            <div className="mp-hero">
              <div
                className="mp-hero-bg"
                data-alt={HERO_ALT}
                style={{ backgroundImage: `url('${HERO_IMG}')` }}
              ></div>
              <div className="mp-hero-overlay">
                <h1 className="mp-hero-title">Curated Excellence for the Modern Home</h1>
                <button className="mp-shop-btn">Shop Now</button>
              </div>
            </div>
            <div className="mp-hero-side">
              <div className="mp-action-card">
                <div className="mp-action-icon mp-action-icon-blue">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <h3 className="mp-action-title">Flash Sales</h3>
                <p className="mp-action-sub">Up to 50% off</p>
              </div>
              <div className="mp-action-card">
                <div className="mp-action-icon mp-action-icon-green">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <h3 className="mp-action-title">Official Stores</h3>
                <p className="mp-action-sub">Top Brands</p>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <section className="mp-section">
            <div className="mp-section-head">
              <h2 className="mp-section-title">Top Selling Items</h2>
              <span className="mp-see-all">
                See All <span className="material-symbols-outlined">chevron_right</span>
              </span>
            </div>
            <div className="mp-goods">
              {isLoading ? (
                <div className="mp-loading">Loading products...</div>
              ) : (
                products?.map((product, index) => (
                  <div key={product.id} className="mp-card">
                    {index === 0 && <div className="mp-card-badge">-20%</div>}
                    <Link className="mp-card-link" to={`/marketplace/product/${product.id}`} aria-label={`View ${product.name}`}>
                      <div className="mp-card-media">
                        <img src={product.imageUrl} alt={product.imageAlt || product.name} data-alt={product.imageAlt} loading="lazy" decoding="async" />
                      </div>
                    </Link>
                    <div className="mp-card-body">
                      <div className={`mp-tag ${index % 2 === 0 ? 'mp-tag-official' : 'mp-tag-primary'}`}>
                        <span className="material-symbols-outlined">{index % 2 === 0 ? 'verified' : 'local_shipping'}</span>
                        {index % 2 === 0 ? 'Official Store' : 'Free Delivery'}
                      </div>
                      <Link className="mp-card-title mp-card-title-link" to={`/marketplace/product/${product.id}`}>{product.name}</Link>
                      <div className="mp-price">{formatMoney(product.salePrice ?? product.price)}</div>
                      <div className="mp-rating-row">
                        <div className="mp-stars">
                          <span className="material-symbols-outlined filled-icon">star</span>
                          <span className="material-symbols-outlined filled-icon">star</span>
                          <span className="material-symbols-outlined filled-icon">star</span>
                          <span className="material-symbols-outlined filled-icon">star</span>
                          <span className="material-symbols-outlined">star_half</span>
                        </div>
                        <span>{product.rating ?? '0.0'}</span>
                      </div>
                      <button type="button" className="mp-add-btn" onClick={() => onAddToCart?.(product)}>ADD TO CART</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mp-footer">
        <div className="mp-footer-brand">MarketPlace</div>
        <div className="mp-footer-links">
          <Link to="/terms">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <a href="#">Shipping Info</a>
          <a href="https://wa.me/2347051917468" target="_blank" rel="noopener noreferrer">Contact Us</a>
        </div>
        <p className="mp-footer-copy">© 2026 MarketPlace. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default PublicMarketplace;