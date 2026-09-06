import { useState, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Button from './ui/Button';
import ArrowIcon from './ui/ArrowIcon';
import Counter from './ui/Counter';

const DashboardSection = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });
  const [activeTab, setActiveTab] = useState("analytics");
  const [hoveredMetric, setHoveredMetric] = useState(null);

  // Dynamic values depending on active Tab
  const dashboardData = {
    analytics: {
      revenue: 12480,
      revenueTrend: "+18.4%",
      revenueUp: true,
      orders: 342,
      ordersTrend: "+12.1%",
      ordersUp: true,
      customers: 1840,
      customersTrend: "+8.9%",
      customersUp: true,
      chartPath: "M0 120 C 10 110, 30 70, 50 85 C 70 100, 90 40, 110 50 C 130 60, 150 15, 170 30 C 190 45, 210 10, 230 5 C 250 0, 270 20, 290 10 C 310 0, 330 40, 350 35 L 350 150 L 0 150 Z"
    },
    products: {
      revenue: 8430,
      revenueTrend: "+4.2%",
      revenueUp: true,
      orders: 215,
      ordersTrend: "-1.8%",
      ordersUp: false,
      customers: 980,
      customersTrend: "+15.6%",
      customersUp: true,
      chartPath: "M0 130 C 20 120, 40 100, 60 90 C 80 80, 100 110, 120 95 C 140 80, 160 50, 180 60 C 200 70, 220 30, 240 40 C 260 50, 280 20, 300 25 C 320 30, 340 15, 350 10 L 350 150 L 0 150 Z"
    },
    orders: {
      revenue: 16840,
      revenueTrend: "+24.5%",
      revenueUp: true,
      orders: 512,
      ordersTrend: "+31.2%",
      ordersUp: true,
      customers: 2450,
      customersTrend: "+21.4%",
      customersUp: true,
      chartPath: "M0 140 C 30 110, 50 120, 80 90 C 110 60, 140 80, 170 40 C 200 0, 230 50, 260 20 C 290 -10, 320 10, 350 5 L 350 150 L 0 150 Z"
    }
  };

  const currentData = dashboardData[activeTab];

  return (
    <section ref={ref} id="dashboard" className={`dashboard-section reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">All In One</span>
          <h2 className="section-title">Build your online store in minutes.</h2>
          <p className="section-description">
            Sell products, receive payments, track orders, manage inventory, and grow your business seamlessly using our top-tier administration panel.
          </p>
        </div>

        <div className="dashboard-mockup">
          {/* Mockup Sidebar */}
          <div className="db-sidebar">
            <div>
              <div className="db-logo">
                <img src="/logo.png" alt="Universe" className="db-logo-img" />
              </div>
              <div className="db-nav">
                <div
                  className={`db-nav-item ${activeTab === "analytics" ? "active" : ""}`}
                  onClick={() => setActiveTab("analytics")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  Analytics
                </div>
                <div
                  className={`db-nav-item ${activeTab === "products" ? "active" : ""}`}
                  onClick={() => setActiveTab("products")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  Products
                </div>
                <div
                  className={`db-nav-item ${activeTab === "orders" ? "active" : ""}`}
                  onClick={() => setActiveTab("orders")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Orders
                </div>
              </div>
            </div>

            <div className="db-user">
              <div className="db-avatar"></div>
              <div>
                <div className="db-username">Alexander G.</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-gray-50)" }}>Store Owner</div>
              </div>
            </div>
          </div>

          {/* Mockup Main Panel */}
          <div className="db-main">
            <div className="db-header">
              <div className="db-header-title" style={{ textTransform: "capitalize" }}>
                {activeTab} Overview
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-gray-50)" }}>Status:</span>
                <span className="newsletter-success" style={{ fontSize: "0.85rem", display: "inline-flex" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-success)" }}></span>
                  Live
                </span>
              </div>
            </div>

            {/* Metrics cards inside mockup */}
            <div className="db-grid">
              <div
                className="db-card"
                onMouseEnter={() => setHoveredMetric("revenue")}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="db-card-label">Revenue</div>
                <div className="db-card-value">
                  <Counter value={currentData.revenue} prefix="$" />
                </div>
                <div className={`db-card-trend ${currentData.revenueUp ? "up" : "down"}`}>
                  {currentData.revenueUp ? "↑" : "↓"} {currentData.revenueTrend}
                </div>
              </div>

              <div
                className="db-card"
                onMouseEnter={() => setHoveredMetric("orders")}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="db-card-label">Orders</div>
                <div className="db-card-value">
                  <Counter value={currentData.orders} />
                </div>
                <div className={`db-card-trend ${currentData.ordersUp ? "up" : "down"}`}>
                  {currentData.ordersUp ? "↑" : "↓"} {currentData.ordersTrend}
                </div>
              </div>

              <div
                className="db-card"
                onMouseEnter={() => setHoveredMetric("customers")}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="db-card-label">Customers</div>
                <div className="db-card-value">
                  <Counter value={currentData.customers} />
                </div>
                <div className={`db-card-trend ${currentData.customersUp ? "up" : "down"}`}>
                  {currentData.customersUp ? "↑" : "↓"} {currentData.customersTrend}
                </div>
              </div>
            </div>

            {/* SVG Graph rendering */}
            <div className="db-chart-container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Sales Activity</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-gray-50)" }}>Showing Last 12 Months</div>
              </div>

              <div className="chart-svg-wrapper">
                <svg viewBox="0 0 350 150" width="100%" height="100%" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="350" y2="30" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="70" x2="350" y2="70" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="110" x2="350" y2="110" stroke="#F1F5F9" strokeWidth="1" />
                  
                  {/* Shaded Area */}
                  <path d={currentData.chartPath} className="chart-area" />
                  
                  {/* Line stroke */}
                  {/* Since SVG path drawing triggers on component mounts, changing active tab triggers new path definition */}
                  <path
                    key={activeTab}
                    d={currentData.chartPath.replace(" L 350 150 L 0 150 Z", "")}
                    className="chart-line"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="db-action-footer">
          <Button className="btn-primary" onClick={() => document.getElementById("marketplace").scrollIntoView()}>
            Get Started Now <ArrowIcon />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;