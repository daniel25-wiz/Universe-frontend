import { useState } from 'react';
import Sidebar from '../Sidebar';
import '../seller-dashboard.css';
import './sales-analytics.css';

const STATS = [
  { label: 'Total Revenue', value: '₦19,344,000', trend: '+12.5%', trendUp: true, icon: 'payments' },
  { label: 'Orders', value: '1,248', trend: '+8.2%', trendUp: true, icon: 'shopping_bag' },
  { label: 'Products Sold', value: '2,310', trend: '+15.1%', trendUp: true, icon: 'inventory_2' },
  { label: 'Refunds', value: '24', trend: '-3.4%', trendUp: true, icon: 'assignment_return' },
];

const CHART = [
  { label: 'Jan', value: 42 },
  { label: 'Feb', value: 55 },
  { label: 'Mar', value: 48 },
  { label: 'Apr', value: 72 },
  { label: 'May', value: 85 },
  { label: 'Jun', value: 64 },
  { label: 'Jul', value: 92 },
];

const ORDERS = [
  { initials: 'JD', name: 'Jane Doe', sub: '#GS-2041 · Just now', amount: '₦192,200' },
  { initials: 'SM', name: 'Samuel Okafor', sub: '#GS-2040 · 12 min ago', amount: '₦138,725' },
  { initials: 'AK', name: 'Aisha Bello', sub: '#GS-2039 · 1 hr ago', amount: '₦540,950' },
  { initials: 'TT', name: 'Tom Adeyemi', sub: '#GS-2038 · 2 hrs ago', amount: '₦69,750' },
];

/**
 * Sales Analytics — no HTML mockup; follows the shared blue theme chrome.
 */
function SalesAnalytics() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Sidebar active="sales" mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} />

      <main className="sd-main">
        {/* TopAppBar */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button className="sd-topbar-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="sd-top-search">
              <span className="material-symbols-outlined">search</span>
              <input type="text" placeholder="Search sales..." />
            </div>
          </div>
          <div className="sd-topbar-actions">
            <button className="sd-icon-btn" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
              <span className="sd-notif-dot"></span>
            </button>
            <button className="sd-icon-btn" aria-label="Account">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="sd-page">
          <div className="sa-header">
            <div>
              <h2 className="sd-page-title">Sales Analytics</h2>
              <p className="sd-page-sub">Track your revenue, orders, and product performance.</p>
            </div>
            <div className="sa-toolbar">
              <select className="sa-select" defaultValue="30d">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>

          <div className="sa-stats">
            {STATS.map((stat) => (
              <div key={stat.label} className="sa-card">
                <div className="sa-card-top">
                  <span className="sa-card-label">{stat.label}</span>
                  <div className="sa-card-icon">
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                </div>
                <div className="sa-card-value">{stat.value}</div>
                <div className="sa-card-trend">
                  <span className={stat.trendUp ? 'sa-trend-up' : 'sa-trend-down'}>{stat.trend}</span>
                  <span className="sa-trend-sub">vs last period</span>
                </div>
              </div>
            ))}
          </div>

          <div className="sa-grid">
            {/* Revenue chart */}
            <div className="sa-panel">
              <div className="sa-panel-head">
                <h3 className="sa-panel-title">Revenue Overview</h3>
                <span className="sd-text-variant sd-hidden-md-down">Last 7 months</span>
              </div>
              <div className="sa-panel-body">
                <div className="sa-chart">
                  {CHART.map((bar) => (
                    <div key={bar.label} className="sa-bar-wrap">
                      <div className="sa-bar-track">
                        <div className="sa-bar" style={{ height: `${bar.value}%` }}></div>
                      </div>
                      <span className="sa-bar-label">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="sa-panel">
              <div className="sa-panel-head">
                <h3 className="sa-panel-title">Recent Orders</h3>
              </div>
              <div className="sa-panel-body">
                <div className="sa-orders">
                  {ORDERS.map((order) => (
                    <div key={order.sub} className="sa-order">
                      <div className="sa-order-info">
                        <div className="sa-order-avatar">{order.initials}</div>
                        <div>
                          <div className="sa-order-name">{order.name}</div>
                          <div className="sa-order-sub">{order.sub}</div>
                        </div>
                      </div>
                      <div className="sa-order-amount">{order.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default SalesAnalytics;