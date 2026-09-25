import { useState } from 'react';
import Sidebar from '../Sidebar';
import '../seller-dashboard.css';
import './sales-analytics.css';
import { useCurrentUser } from '../../../hooks/useAuth';
import { RANGE_LABELS, orderSellerAmount, useSellerSales } from '../../../hooks/useSellerAnalytics';
import { formatMoney, getUserInitials, timeAgo } from '../../../lib/user';
import MaterialIcon from '../../../components/ui/MaterialIcon';

/**
 * "vs last period" cell. A `null` trend means the previous period had no
 * baseline — shown honestly as a note, never as a fake percentage.
 */
function TrendCell({ trend, goodWhenUp }) {
  if (trend == null) {
    return <span className="sa-trend-sub">No previous-period data</span>;
  }
  const up = trend >= 0;
  const good = goodWhenUp ? up : !up;
  return (
    <>
      <span className={good ? 'sa-trend-up' : 'sa-trend-down'}>{`${up ? '+' : ''}${trend.toFixed(1)}%`}</span>
      <span className="sa-trend-sub">vs last period</span>
    </>
  );
}

/** Percentage change vs the previous period; null when there is no baseline. */
function trend(current, previous) {
  if (previous == null || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Sales Analytics — NO mock data. Every figure is computed from the signed-in
 * seller's real orders (GET /seller/orders, aggregated in useSellerSales):
 * an empty store shows the empty state and a failing backend shows the
 * error — the page never invents numbers.
 */
function SalesAnalytics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState('30d');

  const { data: user } = useCurrentUser();
  const { summary, previous, isLoading, isFetching, isError, error, refetch, isEmpty } = useSellerSales(range);

  const stats = [
    {
      label: 'Total Revenue',
      value: formatMoney(summary.revenue),
      trend: trend(summary.revenue, previous?.revenue ?? null),
      goodWhenUp: true,
      icon: 'payments',
    },
    {
      label: 'Orders',
      value: String(summary.orders),
      trend: trend(summary.orders, previous?.orders ?? null),
      goodWhenUp: true,
      icon: 'shopping_bag',
    },
    {
      label: 'Products Sold',
      value: String(summary.productsSold),
      trend: trend(summary.productsSold, previous?.productsSold ?? null),
      goodWhenUp: true,
      icon: 'inventory_2',
    },
    {
      label: 'Refunds',
      value: String(summary.refunds),
      trend: trend(summary.refunds, previous?.refunds ?? null),
      // Refunds going UP is bad — the color inverts.
      goodWhenUp: false,
      icon: 'assignment_return',
    },
  ];

  return (
    <>
      <Sidebar active="sales" mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} />

      <main className="sd-main">
        {/* TopAppBar */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button className="sd-topbar-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <MaterialIcon name="menu" />
            </button>
            <div className="sd-top-search">
              <MaterialIcon name="search" />
              <input type="text" placeholder="Search sales..." />
            </div>
          </div>
          <div className="sd-topbar-actions">
            <button className="sd-icon-btn" aria-label="Notifications">
              <MaterialIcon name="notifications" />
              <span className="sd-notif-dot"></span>
            </button>
            <button className="sd-icon-btn" aria-label="Account">
              <MaterialIcon name="account_circle" />
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
              <select
                className="sa-select"
                value={range}
                onChange={(event) => setRange(event.target.value)}
                aria-label="Analytics period"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                type="button"
                className={isFetching ? 'sa-refresh spinning' : 'sa-refresh'}
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh sales data"
              >
                <MaterialIcon name="refresh" />
              </button>
            </div>
          </div>

          {/* Honest data states — the page never shows invented numbers. */}
          {isError ? (
            <div className="sa-message sa-message--error">
              <p>{error?.message || 'We could not load your sales right now.'}</p>
              <button type="button" className="sa-retry" onClick={() => refetch()}>Try again</button>
            </div>
          ) : isLoading ? (
            <div className="sa-message"><p>Loading your sales…</p></div>
          ) : (
            <>
              <div className="sa-stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="sa-card">
                    <div className="sa-card-top">
                      <span className="sa-card-label">{stat.label}</span>
                      <div className="sa-card-icon">
                        <MaterialIcon name={stat.icon} />
                      </div>
                    </div>
                    <div className="sa-card-value">{stat.value}</div>
                    <div className="sa-card-trend">
                      <TrendCell trend={stat.trend} goodWhenUp={stat.goodWhenUp} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="sa-grid">
                {/* Revenue chart — real revenue buckets from real orders */}
                <div className="sa-panel">
                  <div className="sa-panel-head">
                    <h3 className="sa-panel-title">Revenue Overview</h3>
                    <span className="sd-text-variant sd-hidden-md-down">{RANGE_LABELS[range]}</span>
                  </div>
                  <div className="sa-panel-body">
                    {isEmpty ? (
                      <div className="sa-message">
                        <p>No revenue in this period yet</p>
                        <small>Orders show up here as soon as buyers check out.</small>
                      </div>
                    ) : (
                      <>
                        <div className={range === '30d' ? 'sa-chart sa-chart--dense' : 'sa-chart'}>
                          {summary.series.map((bar, index) => (
                            <div
                              key={`${bar.fullLabel}-${index}`}
                              className="sa-bar-wrap"
                              title={`${bar.fullLabel}: ${formatMoney(bar.value)}`}
                            >
                              <div className="sa-bar-track">
                                <div className="sa-bar" style={{ height: `${bar.height}%` }}></div>
                              </div>
                              <span className="sa-bar-label">
                                {range !== '30d' || index % 5 === 4 || index === summary.series.length - 1 ? bar.label : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="sa-note">
                          Figures from {summary.basis} order{summary.basis === 1 ? '' : 's'} in this period · auto-refreshes every minute
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Recent orders — the newest real orders in the window */}
                <div className="sa-panel">
                  <div className="sa-panel-head">
                    <h3 className="sa-panel-title">Recent Orders</h3>
                  </div>
                  <div className="sa-panel-body">
                    {isEmpty ? (
                      <div className="sa-message">
                        <p>No orders in this period yet</p>
                        <small>Share your store link to start making sales.</small>
                      </div>
                    ) : (
                      <div className="sa-orders">
                        {summary.recent.map((order) => (
                          <div key={order.id} className="sa-order">
                            <div className="sa-order-info">
                              <div className="sa-order-avatar">{order.buyerInitials || getUserInitials(order.buyerName)}</div>
                              <div>
                                <div className="sa-order-name">{order.buyerName || 'Customer'}</div>
                                <div className="sa-order-sub">{order.reference ? `#${order.reference} · ` : ''}{timeAgo(order.createdAt)}</div>
                              </div>
                            </div>
                            <div className="sa-order-amount">{formatMoney(orderSellerAmount(order, user?.id))}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default SalesAnalytics;