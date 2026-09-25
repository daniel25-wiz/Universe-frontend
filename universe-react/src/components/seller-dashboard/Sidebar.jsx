import { Link } from 'react-router-dom';
import { prefetchPropsForPath } from '../../lib/prefetch';
import { FEEDBACK_WHATSAPP_URL, SUPPORT_EMAIL } from '../../lib/support';
import { useCurrentUser, useLogout } from '../../hooks/useAuth';
import { getUserInitials } from '../../lib/user';
import './ui/widgets.css';
import MaterialIcon from '../../components/ui/MaterialIcon';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: 'home', to: '/seller' },
  { key: 'workshop', label: 'My Workshop', icon: 'inventory_2', to: '/seller/marketplace' },
  { key: 'marketplace', label: 'Marketplace', icon: 'storefront', to: '/seller/public-marketplace' },
  { key: 'sales', label: 'Sales', icon: 'monitoring', to: '/seller/sales' },
  { key: 'profile', label: 'Seller Profile', icon: 'account_circle', to: '/seller/profile' },
  { key: 'settings', label: 'Settings', icon: 'settings', to: '/seller/settings' },
];

/**
 * Shared Global Store sidebar (blue theme) as seen in
 * my_workshop_blue.html and seller_profile.html.
 *
 * Shows the signed-in user's identity (avatar initials, name, email) and a
 * fully working logout action.
 */
function Sidebar({ active, showLogo = true, variant = 'workshop', mobileOpen = false, onMobileClose }) {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const isProfile = variant === 'profile';

  const handleLogout = () => {
    logout.mutate();
    onMobileClose?.();
  };

  const content = (
    <>
      <div className="sd-brand">
        {showLogo && <img src="/logo.png" alt="Global Store" className="sd-brand-logo" />}
      </div>

      <div className={isProfile ? 'sd-nav sd-nav-tight' : 'sd-nav'}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={`sd-nav-link${active === item.key ? ' active' : ''}`}
            onClick={onMobileClose}
            {...prefetchPropsForPath(item.to)}
          >
            <MaterialIcon name={item.icon} className="sd-nav-icon" />
            {isProfile ? (
              <span className="sd-nav-label">{item.label}</span>
            ) : (
              item.label
            )}
          </Link>
        ))}
      </div>

      <div className="sd-foot">
        {user && (
          <div className="sd-user-card">
            <span className="sd-user-avatar" aria-hidden="true">{getUserInitials(user.fullName)}</span>
            <div className="sd-user-meta">
              <p className="sd-user-name">{user.fullName}</p>
              <p className="sd-user-email">{user.email}</p>
            </div>
          </div>
        )}
        <a
          href={FEEDBACK_WHATSAPP_URL}
          className="sd-foot-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onMobileClose}
        >
          <MaterialIcon name="feedback" />
          {isProfile ? <span className="sd-nav-label">Feedback</span> : 'Feedback'}
        </a>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="sd-foot-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onMobileClose}
        >
          <MaterialIcon name="help" />
          {isProfile ? <span className="sd-nav-label">Help Center</span> : 'Help Center'}
        </a>
        <button
          type="button"
          className="sd-foot-link"
          onClick={handleLogout}
          disabled={logout.isPending}
          style={{ background: 'none', border: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <MaterialIcon name="logout" />
          {isProfile ? <span className="sd-nav-label">{logout.isPending ? 'Logging out…' : 'Logout'}</span> : logout.isPending ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </>

  );

  return (
    <>
      <nav className="sd-sidebar">{content}</nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="sd-mobile-overlay" onClick={onMobileClose} />
          <nav className="sd-sidebar sd-sidebar-mobile">
            <button className="sd-drawer-close" aria-label="Close menu" onClick={onMobileClose}>
              <MaterialIcon name="close" />
            </button>
            {content}
          </nav>
        </>
      )}
    </>
  );
}

export default Sidebar;