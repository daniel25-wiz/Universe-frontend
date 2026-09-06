import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../seller-dashboard.css';
import './dashboard-overview.css';
import { prefetchPropsForPath } from '../../../lib/prefetch';
import { useCurrentUser, useLogout } from '../../../hooks/useAuth';
import { useSellerProfile } from '../../../hooks/useUser';
import { useProducts } from '../../../hooks/useProducts';
import { getUserInitials, getFirstName, getStoreDisplayName, timeAgo, formatMoney } from '../../../lib/user';

const NAV = [
  { key: 'home', label: 'Home', icon: 'home', to: '/seller', fill: true },
  { key: 'workshop', label: 'My Workshop', icon: 'inventory_2', to: '/seller/marketplace' },
  { key: 'marketplace', label: 'Marketplace', icon: 'storefront', to: '/seller/public-marketplace' },
  { key: 'sales', label: 'Sales', icon: 'monitoring', to: '/seller/sales' },
  { key: 'profile', label: 'Seller Profile', icon: 'account_circle', to: '/seller/profile' },
  { key: 'settings', label: 'Settings', icon: 'settings', to: '/seller/settings' },
];

/**
 * Dashboard Home — port of dashboard_home_blue.html
 *
 * Everything on this page is REAL data for the signed-in seller:
 * - greeting + identity dropdown come from the session (GET /auth/me)
 * - stats, category chart and activity feed are computed from that seller's
 *   own products (GET /products?sellerId=me) — never another user's data
 */
function DashboardOverview() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const closeMenu = () => setMenuOpen(false);

  const { data: user } = useCurrentUser();
  const { data: profile } = useSellerProfile();
  const logout = useLogout();

  // Own products only — the API scopes this server-side as well.
  const sellerId = user?.id;
  const { data: products } = useProducts(sellerId ? { sellerId, pageSize: 200 } : { sellerId: '__loading__' });

  // Close the identity dropdown on outside click / Escape.
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onMouseDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  const storeDisplayName = getStoreDisplayName(profile?.storeName, user?.fullName);

  const stats = useMemo(() => {
    const list = products ?? [];
    const active = list.filter((p) => p.status === 'active');
    const drafts = list.filter((p) => p.status === 'draft');
    const inventoryValue = list.reduce((sum, p) => sum + (p.price ?? 0) * (p.stock ?? 0), 0);
    const lowStock = active.filter((p) => p.stock != null && p.stock <= 5);
    const rated = list.filter((p) => p.reviews > 0);
    const avgRating = rated.length > 0 ? rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length : null;
    const reviewCount = rated.reduce((s, p) => s + (p.reviews ?? 0), 0);
    return { list, active, drafts, inventoryValue, lowStock, avgRating, reviewCount };
  }, [products]);

  const statCards = [
    {
      label: 'Active Listings',
      icon: 'storefront',
      value: String(stats.active.length),
      sub: `${stats.drafts.length} draft${stats.drafts.length === 1 ? '' : 's'} saved`,
    },
    {
      label: 'Inventory Value',
      icon: 'payments',
      value: formatMoney(stats.inventoryValue),
      sub: `${stats.list.length} product${stats.list.length === 1 ? '' : 's'} in total`,
    },
    {
      label: 'Low Stock Alerts',
      icon: 'warning',
      value: String(stats.lowStock.length),
      sub: stats.lowStock.length > 0 ? 'Restock these items soon' : 'Everything is well stocked',
    },
    {
      label: 'Average Rating',
      icon: 'sentiment_satisfied',
      value: stats.avgRating != null ? `${stats.avgRating.toFixed(1)}/5` : '—',
      sub: stats.avgRating != null ? `Based on ${stats.reviewCount} reviews` : 'No reviews yet',
      highlight: true,
    },
  ];

  // Inventory-by-category bars (real distribution of this seller's products).
  const categoryChart = useMemo(() => {
    const counts = new Map();
    (products ?? []).forEach((p) => {
      const key = p.category || 'Uncategorized';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
    const max = entries.reduce((m, [, c]) => Math.max(m, c), 1);
    return {
      max,
      bars: entries.map(([name, count]) => ({
        name,
        count,
        h: `${Math.max(12, Math.round((count / max) * 100))}%`,
        strong: count === max,
      })),
    };
  }, [products]);

  // Recent activity from real data: newest products + low-stock warnings.
  const activity = useMemo(() => {
    const items = [];
    stats.lowStock.slice(0, 2).forEach((p) => {
      items.push({
        key: `low-${p.id}`,
        icon: 'warning',
        cls: 'dh-ai-secondary',
        text: (
          <>
            Low stock: <strong>{p.name}</strong> ({p.stock} left)
          </>
        ),
        time: 'Restock soon',
      });
    });
    [...stats.list]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4 - Math.min(2, items.length))
      .forEach((p) => {
        items.push({
          key: `prod-${p.id}`,
          icon: p.status === 'active' ? 'inventory_2' : 'edit_note',
          cls: p.status === 'active' ? 'dh-ai-primary' : 'dh-ai-tertiary',
          text: (
            <>
              <strong>{p.name}</strong> {p.status === 'active' ? 'is live in your store' : 'was saved as draft'}
            </>
          ),
          time: timeAgo(p.createdAt),
        });
      });
    return items;
  }, [stats]);

  const sidebarContent = (
    <>
      {/* SideNavBar content (shared by desktop sidebar + mobile drawer) */}
      <div className="dh-sb-title">
          <img src="/logo.png" alt="Global Store" className="dh-sb-logo" />
          <h1>Seller Dashboard</h1>
        </div>

        <div className="dh-sb-nav">
          {NAV.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={`dh-sb-link${item.key === 'home' ? ' active' : ''}`}
              onClick={closeMenu}
              {...prefetchPropsForPath(item.to)}
            >
              <span
                className="material-symbols-outlined"
                data-icon={item.icon}
                data-weight={item.fill ? 'fill' : undefined}
              >
                {item.icon}
              </span>
              <span className="dh-sb-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="dh-sb-foot">
          <div className="dh-sb-help">
            <a href="#" className="dh-sb-link" onClick={(e) => e.preventDefault()}>
              <span className="material-symbols-outlined" data-icon="feedback">
                feedback
              </span>
              <span className="dh-sb-label">Feedback</span>
            </a>
            <a href="#" className="dh-sb-link" onClick={(e) => e.preventDefault()}>
              <span className="material-symbols-outlined" data-icon="help">
                help
              </span>
              <span className="dh-sb-label">Help Center</span>
            </a>
            <button
              type="button"
              className="dh-sb-link"
              style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit', width: '100%', textAlign: 'left' }}
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <span className="material-symbols-outlined" data-icon="logout">
                logout
              </span>
              <span className="dh-sb-label">{logout.isPending ? 'Logging out…' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </>
    );

    return (
      <div className="dh-root">
        {/* SideNavBar (Hidden on Mobile, Visible on Desktop) */}
        <nav className="dh-sidebar">{sidebarContent}</nav>

        {/* Mobile drawer */}
        {menuOpen && (
          <>
            <div className="dh-mobile-overlay" onClick={closeMenu} />
            <nav className="dh-sidebar dh-sidebar-mobile">
              <button className="dh-drawer-close" aria-label="Close menu" onClick={closeMenu}>
                <span className="material-symbols-outlined">close</span>
              </button>
              {sidebarContent}
            </nav>
          </>
        )}

        {/* Main Content Area */}
        <div className="dh-main">
        {/* TopAppBar (Visible on all screens) */}
        <header className="dh-topbar">
          <div className="dh-mobile-title">
            <button className="dh-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1>Seller Dashboard</h1>
          </div>

          {/* Mobile Search Icon */}
          <div className="dh-mobile-search">
            <button aria-label="Search">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="dh-search">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search orders, products..." />
          </div>

          {/* Trailing Actions */}
          <div className="dh-trailing">
            <button className="dh-notif" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
              <span className="dh-notif-dot"></span>
            </button>
            <div className="dh-usermenu-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="dh-user-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
              >
                <span className="dh-user-avatar" aria-hidden="true">{getUserInitials(user?.fullName)}</span>
                <span className="dh-store-label">{storeDisplayName}</span>
                <span className="material-symbols-outlined dh-store-caret">arrow_drop_down</span>
              </button>

              {userMenuOpen && (
                <div className="dh-usermenu" role="menu">
                  <div className="dh-usermenu-head">
                    <p className="dh-usermenu-name">{user?.fullName ?? 'Loading…'}</p>
                    <p className="dh-usermenu-email">{user?.email ?? ''}</p>
                  </div>
                  <Link
                    to="/seller/profile"
                    className="dh-menu-item"
                    onClick={() => setUserMenuOpen(false)}
                    {...prefetchPropsForPath('/seller/profile')}
                  >
                    <span className="material-symbols-outlined">account_circle</span>
                    Seller Profile
                  </Link>
                  <Link
                    to="/seller/settings"
                    className="dh-menu-item"
                    onClick={() => setUserMenuOpen(false)}
                    {...prefetchPropsForPath('/seller/settings')}
                  >
                    <span className="material-symbols-outlined">settings</span>
                    Settings
                  </Link>
                  <div className="dh-menu-divider" />
                  <button
                    type="button"
                    className="dh-menu-item dh-menu-danger"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout.mutate();
                    }}
                    disabled={logout.isPending}
                  >
                    <span className="material-symbols-outlined">logout</span>
                    {logout.isPending ? 'Logging out…' : 'Log out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="dh-canvas">
          <div className="dh-container">
            {/* Page Header — greets the signed-in seller by name */}
            <div>
              <h2 className="dh-head-title">Welcome back, {getFirstName(user?.fullName)}</h2>
              <p className="dh-head-sub">{storeDisplayName} &mdash; here&apos;s how your store is doing today.</p>
            </div>

            {/* Stats Bento Grid — computed from this seller's real products */}
            <div className="dh-stats">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className={`dh-stat${stat.highlight ? ' dh-stat-highlight' : ''}`}
                >
                  <div className="dh-stat-head">
                    <span className="dh-stat-label">{stat.label}</span>
                    <span
                      className="material-symbols-outlined dh-stat-icon"
                      data-icon={stat.icon}
                      data-weight={stat.highlight ? 'fill' : undefined}
                      style={stat.highlight ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <div className="dh-stat-bottom">
                    <span className="dh-stat-value">{stat.value}</span>
                    {stat.sub && (
                      <div className="dh-stat-trend dh-stat-sub">
                        <span>{stat.sub}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts & Activity Area */}
            <div className="dh-grid">
              {/* Main Chart (takes 2 columns) */}
              <div className="dh-panel dh-panel-wide">
                <div className="dh-panel-head">
                  <h3 className="dh-panel-title">Inventory by Category</h3>
                  <span className="dh-select" style={{ border: 0, background: 'transparent', fontWeight: 600, color: '#475569' }}>
                    {stats.list.length} item{stats.list.length === 1 ? '' : 's'}
                  </span>
                </div>
                {/* Chart Area (stylized div bars — real category counts) */}
                <div className="dh-chart">
                  <div className="dh-chart-y">
                    <span>{categoryChart.max}</span>
                    <span>{Math.round((categoryChart.max * 2) / 3)}</span>
                    <span>{Math.round(categoryChart.max / 3)}</span>
                    <span>0</span>
                  </div>
                  {categoryChart.bars.map((bar) => (
                    <div
                      key={bar.name}
                      className={`dh-bar${bar.strong ? ' dh-bar-strong' : ''}`}
                      style={{ height: bar.h }}
                    >
                      <div className="dh-bar-tooltip">{`${bar.name}: ${bar.count}`}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity List */}
              <div className="dh-panel">
                <h3 className="dh-panel-title" style={{ marginBottom: '24px' }}>
                  Recent Activity
                </h3>
                <div className="dh-activity">
                  {activity.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                      No activity yet — add your first product to see it here.
                    </p>
                  ) : (
                    activity.map((item) => (
                      <div key={item.key} className="dh-activity-item">
                        <div className={`dh-activity-icon ${item.cls}`}>
                          <span className="material-symbols-outlined">{item.icon}</span>
                        </div>
                        <div>
                          <p className="dh-activity-text">{item.text}</p>
                          <p className="dh-activity-time">{item.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardOverview;