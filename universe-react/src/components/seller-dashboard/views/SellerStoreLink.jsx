import { useState } from 'react';
import Sidebar from '../Sidebar';
import { useCurrentUser } from '../../../hooks/useAuth';
import { getUserInitials } from '../../../lib/user';
import '../seller-dashboard.css';
import './seller-settings.css';
import '../ui/widgets.css';
import MaterialIcon from '../../../components/ui/MaterialIcon';

/** Heroicons outline hamburger used by st-topbar (same as SellerSettings). */
const MenuIcon = () => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

/**
 * Store share-link page — shows the seller their public shop URL and quick
 * copy/share actions. Reached from Settings → "Share Store Link".
 * /seller/store-link
 *
 * The URL is built from window.location.origin plus the same public shop path
 * the marketplace already uses for seller shops
 * (/marketplace/seller/:sellerId — see SellerShopPage + App.jsx), so the domain
 * always matches wherever the app is currently running: localhost in dev,
 * the Preview domain and the production domain in each build. No backend
 * involvement — everything here is derived client-side from the session user.
 */
function SellerStoreLink() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', icon: 'check_circle', show: false });
  const closeMenu = () => setMenuOpen(false);

  const { data: user } = useCurrentUser();

  // Generated from whatever domain the site is running on — never hard-coded.
  const storeUrl = user
    ? `${window.location.origin}/marketplace/seller/${user.id}`
    : null;

  const showToast = (msg, icon = 'check_circle') => {
    setToast({ msg, icon, show: true });
    window.setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  };

  const copyStoreUrl = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      showToast('Store link copied to clipboard!', 'content_copy');
    } catch {
      // Clipboard access can be blocked (permissions/HTTP) — still show the link.
      showToast(`Your store link: ${storeUrl}`, 'link');
    }
  };

  const shareStoreUrl = async () => {
    if (!storeUrl) return;
    try {
      await navigator.share({
        title: user?.fullName ?? 'My Universe store',
        text: 'Check out my store on Universe and discover my products!',
        url: storeUrl,
      });
    } catch (err) {
      // User dismissed the share sheet — not an error worth surfacing.
      if (err?.name === 'AbortError') return;
      // No Web Share API available — copy the link instead.
      copyStoreUrl();
    }
  };

  return (
    <>
      <Sidebar active="settings" mobileOpen={menuOpen} onMobileClose={closeMenu} />

      <div className="sd-main st-root">
        {/* TopAppBar */}
        <header className="st-topbar">
          <div className="st-topbar-left">
            <button className="st-topbar-hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <MenuIcon />
            </button>
            <h2 className="st-topbar-title">Store Link</h2>
          </div>
          <div className="st-topbar-actions">
            <div className="st-avatar" title={user?.fullName}>{getUserInitials(user?.fullName)}</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="st-canvas">
          <div className="st-container">
            {/* Header Section */}
            <div className="st-head">
              <div className="st-head-icon">
                <MaterialIcon name="share" />
              </div>
              <div>
                <h1 className="st-head-title">Share Store Link</h1>
                <p className="st-head-sub">View And Share Your Store URL</p>
              </div>
            </div>

            {/* Share card — same card language as the settings page */}
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon">
                  <MaterialIcon name="storefront" />
                </div>
                <div className="st-card-heading">
                  <h3 className="st-card-title">Share Your Store</h3>
                  <p className="st-card-desc">
                    Share your link with customers so they can discover your products
                    and place orders. Your store link is generated below.
                  </p>
                </div>
              </div>

              {/* Generated store link — domain-aware, live from the session user */}
              <span className="st-domain-chip">
                <MaterialIcon name="link" />
                {storeUrl ?? 'Generating your store link…'}
              </span>

              <div className="st-card-actions">
                <button
                  type="button"
                  className="st-btn"
                  onClick={copyStoreUrl}
                  disabled={!storeUrl}
                >
                  <MaterialIcon name="content_copy" />
                  Copy Link
                </button>
                <button
                  type="button"
                  className="st-btn st-btn-primary"
                  onClick={shareStoreUrl}
                  disabled={!storeUrl}
                >
                  <MaterialIcon name="share" />
                  Share
                </button>
              </div>
            </div>

            <div className={`st-toast${toast.show ? ' show' : ''}`} aria-live="polite">
              <MaterialIcon name={toast.icon} className="st-toast-icon" />
              <span className="st-toast-msg">{toast.msg}</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default SellerStoreLink;
