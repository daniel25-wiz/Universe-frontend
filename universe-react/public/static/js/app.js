// --- React Components & Main App Logic ---

// Custom hook to trigger animation on scroll entry
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [options]);

  return [elementRef, isIntersecting];
};

// Smooth Counter component
const Counter = ({ value, duration = 1500, prefix = "", suffix = "" }) => {
  const [count, setCount] = React.useState(0);
  const elementRef = React.useRef(null);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp = null;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span ref={elementRef}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Generic Arrow Icon SVG
const ArrowIcon = () => (
  <svg className="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Standard Ripple Effect for Premium Buttons
const Button = ({ children, className = "", onClick, type = "button", ...props }) => {
  const btnRef = React.useRef(null);

  const handleClick = (e) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add("ripple");

    const existingRipple = btn.querySelector(".ripple");
    if (existingRipple) {
      existingRipple.remove();
    }

    btn.appendChild(ripple);

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={btnRef}
      type={type}
      className={`btn ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Navbar Component
const Navbar = ({ cartCount }) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="container">
          <a href="#" className="logo">
            <img src="logo.png" alt="Universe" className="logo-img" />
          </a>

          <ul className="nav-menu">
            <li><a href="#" className="nav-link active">Home</a></li>
            <li><a href="#marketplace" className="nav-link">Marketplace</a></li>
            <li><a href="#features-showcase" className="nav-link">Features</a></li>
            <li><a href="#dashboard" className="nav-link">Dashboard</a></li>
            <li><a href="#testimonials" className="nav-link">Reviews</a></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
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
            <Button className="btn-outline" onClick={() => window.location.href = 'signup.html'}>Login</Button>
            <Button className="btn-primary" onClick={() => window.location.href = 'signup.html'}>Signup <ArrowIcon /></Button>
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
          <li><a href="#" className="mobile-nav-link" onClick={toggleMenu}>Home</a></li>
          <li><a href="#marketplace" className="mobile-nav-link" onClick={toggleMenu}>Marketplace</a></li>
          <li><a href="#features-showcase" className="mobile-nav-link" onClick={toggleMenu}>Features</a></li>
          <li><a href="#dashboard" className="mobile-nav-link" onClick={toggleMenu}>Dashboard</a></li>
          <li><a href="#testimonials" className="mobile-nav-link" onClick={toggleMenu}>Reviews</a></li>
          <li><a href="#contact" className="mobile-nav-link" onClick={toggleMenu}>Contact</a></li>
        </ul>
        <div className="mobile-actions">
          <Button className="btn-outline" style={{ width: "100%" }} onClick={() => window.location.href = 'signup.html'}>Sign In</Button>
          <Button className="btn-primary" style={{ width: "100%" }} onClick={() => window.location.href = 'signup.html'}>Create Store <ArrowIcon /></Button>
        </div>
      </div>
    </>
  );
};

// Floating Marketplace Icons for Hero Background
const FloatingIcon = ({ icon, style, delay = 0, duration = 6 }) => {
  return (
    <div 
      className="floating-icon" 
      style={{
        ...style,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    >
      {icon}
    </div>
  );
};

// Hero Section - Premium Redesign with logo.png
const HeroSection = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section ref={ref} className={`hero-new reveal ${isVisible ? "active" : ""}`}>
      {/* Floating Background Icons - Subtle marketplace illustrations */}
      <div className="hero-floating-icons" aria-hidden="true">
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          }
          style={{ top: "12%", left: "8%", opacity: 0.12 }}
          delay={0}
          duration={8}
        />
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="56" height="56">
              <path d="M20.38 3.46L16 2.14a2 2 0 0 0-1.2 0l-4.38 1.32a2 2 0 0 1-1.2 0L4.84 2.14a2 2 0 0 0-2.4 1.22l-1.2 3.6A2 2 0 0 0 2 8v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-.78-1.58l-1.2-3.6a2 2 0 0 0-1.64-1.36z"></path>
            </svg>
          }
          style={{ top: "20%", right: "10%", opacity: 0.1 }}
          delay={1}
          duration={7}
        />
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44">
              <rect x="2" y="4" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          }
          style={{ top: "55%", left: "5%", opacity: 0.13 }}
          delay={2}
          duration={9}
        />
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="52" height="52">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          }
          style={{ top: "65%", right: "8%", opacity: 0.11 }}
          delay={0.5}
          duration={8.5}
        />
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
              <path d="M3 3v18h18"></path>
              <line x1="18.7" y1="8" x2="12" y2="15"></line>
              <line x1="12" y1="15" x2="8" y2="11"></line>
            </svg>
          }
          style={{ top: "35%", left: "50%", opacity: 0.09 }}
          delay={1.5}
          duration={7.5}
        />
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          }
          style={{ top: "75%", right: "20%", opacity: 0.12 }}
          delay={2.5}
          duration={6.5}
        />
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            </svg>
          }
          style={{ top: "15%", left: "35%", opacity: 0.1 }}
          delay={3}
          duration={8}
        />
        <FloatingIcon
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="38" height="38">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          }
          style={{ top: "45%", right: "30%", opacity: 0.08 }}
          delay={1.8}
          duration={9.5}
        />
      </div>

      <div className="container hero-content-new">
        {/* Headline */}
        <h1 className="hero-title-new">
          Launch Your<br />
          <span className="hero-title-highlight">Own Store</span>
        </h1>

        {/* Description */}
        <p className="hero-description-new">
          With Universe you can launch and create your own store with just one click. Sell products, receive payments, manage orders, and grow your business effortlessly.
        </p>

        {/* Primary CTA */}
        <div className="hero-actions-new">
          <Button className="btn-hero-primary" onClick={() => window.location.href = 'signup.html'}>
            <span className="btn-text">Get Started</span>
            <ArrowIcon className="btn-arrow" />
          </Button>
        </div>
      </div>
    </section>
  );
};

// Feature Icons - Blue gradient icons in soft rounded-square containers
const FeatureIcons = [
  // All-in-One Marketplace
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    <path d="M2 12h20"></path>
    <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0 4-10 15.3 15.3 0 0 0-4-10z"></path>
    <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0 4-10 15.3 15.3 0 0 0-4-10z"></path>
  </svg>,
  // Sell Products
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>,
  // Receive Payment
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
    <path d="M12 14v4"></path>
    <path d="M10 16h4"></path>
  </svg>,
  // Shop Endlessly
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>,
  // Grow Your Business
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <path d="M3 3v18h18"></path>
    <line x1="18.7" y1="8" x2="12" y2="15"></line>
    <line x1="12" y1="15" x2="8" y2="11"></line>
  </svg>
];

// Feature Data with descriptions
const featuresData = [
  { title: "All-in-One Marketplace", desc: "Build your online store in minutes." },
  { title: "Sell Products", desc: "List your products and reach more buyers." },
  { title: "Receive Payment", desc: "Accept secure payments from customers." },
  { title: "Shop Endlessly", desc: "Discover quality products from trusted sellers." },
  { title: "Grow Your Business", desc: "Expand your reach and grow endlessly." }
];

// Features Showcase Section - New Premium Horizontal Row Design
const FeaturesShowcase = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section ref={ref} id="features-showcase" className={`features-showcase reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="features-rows">
          {featuresData.map((feature, index) => (
            <div key={index} className="feature-row">
              <div className="feature-icon-container">
                <div className="feature-icon-wrapper">
                  {FeatureIcons[index]}
                </div>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom CTA Button - Full Width */}
        <div className="features-showcase-cta">
          <Button className="btn-features-showcase-primary" onClick={() => window.location.href = 'signup.html'}>
            <span className="btn-text">Get Started →</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

// Section Two: All In One (Dashboard Mockup)
const DashboardSection = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });
  const [activeTab, setActiveTab] = React.useState("analytics");
  const [hoveredMetric, setHoveredMetric] = React.useState(null);

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
                Universe
                <span className="logo-dot"></span>
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

// Section Three: Products Section (Product catalog filter)
const ProductSection = ({ onAddToCart }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [wishlist, setWishlist] = React.useState({});

  const categories = [
    "All", "Electronics", "Phones", "Fashion", "Shoes", "Watches", "Furniture", "Grocery", "Beauty", "Computers"
  ];

  // Modern SVG Icons for categories
  const getProductIcon = (category) => {
    switch (category) {
      case "Electronics":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        );
      case "Phones":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        );
      case "Fashion":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        );
      case "Shoes":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        );
      case "Watches":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case "Furniture":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"></path>
            <path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5"></path>
            <path d="M4 18v2"></path>
            <path d="M20 18v2"></path>
          </svg>
        );
      case "Grocery":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        );
      case "Beauty":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        );
      case "Computers":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        );
    }
  };

  const products = [
    { id: 1, name: "Wireless Headphones Pro", price: 299, category: "Electronics", rating: 4.8, reviews: 124, seller: "AudioTech", icon: "Electronics" },
    { id: 2, name: "iPhone 15 Pro Max", price: 1199, category: "Phones", rating: 4.9, reviews: 89, seller: "Apple Store", icon: "Phones" },
    { id: 3, name: "Designer Leather Jacket", price: 450, category: "Fashion", rating: 4.7, reviews: 56, seller: "UrbanStyle", icon: "Fashion" },
    { id: 4, name: "Running Shoes Ultra", price: 180, category: "Shoes", rating: 4.6, reviews: 203, seller: "FitGear", icon: "Shoes" },
    { id: 5, name: "Smart Watch Series 9", price: 399, category: "Watches", rating: 4.8, reviews: 167, seller: "TechWear", icon: "Watches" },
    { id: 6, name: "Ergonomic Office Chair", price: 520, category: "Furniture", rating: 4.5, reviews: 78, seller: "ComfortPlus", icon: "Furniture" },
    { id: 7, name: "Organic Food Box", price: 65, category: "Grocery", rating: 4.9, reviews: 312, seller: "FreshFarm", icon: "Grocery" },
    { id: 8, name: "Skincare Essentials Set", price: 89, category: "Beauty", rating: 4.7, reviews: 145, seller: "GlowLab", icon: "Beauty" },
    { id: 9, name: "MacBook Pro 16 M3", price: 2499, category: "Computers", rating: 4.9, reviews: 67, seller: "Apple Store", icon: "Computers" },
    { id: 10, name: "Mechanical Keyboard RGB", price: 149, category: "Electronics", rating: 4.8, reviews: 234, seller: "KeyMaster", icon: "Electronics" },
    { id: 11, name: "Samsung Galaxy S24", price: 999, category: "Phones", rating: 4.7, reviews: 156, seller: "MobileHub", icon: "Phones" },
    { id: 12, name: "Cashmere Sweater", price: 195, category: "Fashion", rating: 4.6, reviews: 89, seller: "CozyWear", icon: "Fashion" },
  ];

  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <section ref={ref} id="marketplace" className={`product-section reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Marketplace</span>
          <h2 className="section-title">Discover trending products.</h2>
          <p className="section-description">
            Browse thousands of quality items from verified sellers across multiple categories.
          </p>
        </div>

        <div className="product-filters">
          {categories.map((cat, i) => (
            <button
              key={i}
              className={`filter-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-img-wrapper">
                <div className="wishlist-btn" onClick={(e) => {
                  e.stopPropagation();
                  setWishlist(prev => ({ ...prev, [product.id]: !prev[product.id] }));
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist[product.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <span className="seller-badge">{product.seller}</span>
                {getProductIcon(product.icon)}
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3 className="product-title">{product.name}</h3>
                <div className="product-rating">
                  <div className="stars-wrapper">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < Math.floor(product.rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>
                  <span>{product.rating} ({product.reviews})</span>
                </div>
                <div className="product-footer">
                  <span className="product-price">${product.price}</span>
                  <button className="add-cart-btn" onClick={onAddToCart} aria-label="Add to cart">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section Four: Connection Section
const ConnectionSection = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section ref={ref} id="connection" className={`connection-section reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Ecosystem</span>
          <h2 className="section-title">One platform. Infinite connections.</h2>
          <p className="section-description">
            Universe connects buyers, sellers, products, and your store in a seamless ecosystem that drives growth for everyone.
          </p>
        </div>

        <div className="connection-container">
          <svg className="network-svg" viewBox="0 0 800 450" preserveAspectRatio="none">
            <defs>
              <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            
            {/* Connection Lines */}
            <line className="network-line" x1="160" y1="100" x2="400" y2="225" />
            <line className="network-line" x1="640" y1="110" x2="400" y2="225" />
            <line className="network-line" x1="180" y1="350" x2="400" y2="225" />
            <line className="network-line" x1="620" y1="340" x2="400" y2="225" />
            
            {/* Glow Lines */}
            <line className="network-line-glow" x1="160" y1="100" x2="400" y2="225" />
            <line className="network-line-glow" x1="640" y1="110" x2="400" y2="225" />
            <line className="network-line-glow" x1="180" y1="350" x2="400" y2="225" />
            <line className="network-line-glow" x1="620" y1="340" x2="400" y2="225" />

            {/* Particle Dots traveling across lines */}
            <circle r="4" className="particle-dot">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 160 100 L 400 225" />
            </circle>
            <circle r="4" className="particle-dot">
              <animateMotion dur="5.5s" repeatCount="indefinite" path="M 640 110 L 400 225" />
            </circle>
            <circle r="4" className="particle-dot">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 180 350 L 400 225" />
            </circle>
            <circle r="4" className="particle-dot">
              <animateMotion dur="4.8s" repeatCount="indefinite" path="M 620 340 L 400 225" />
            </circle>
          </svg>

          <div className="nodes-container">
            {/* Outer Nodes */}
            <div className="node node-buyer">
              <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <span className="node-label">Buyer</span>
            </div>

            <div className="node node-seller">
              <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span className="node-label">Seller</span>
            </div>

            <div className="node node-products">
              <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="node-label">Products</span>
            </div>

            <div className="node node-store">
              <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              </svg>
              <span className="node-label">Your Store</span>
            </div>

            {/* Center Core Node */}
            <div className="node-center">
              Universe
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Grid (6 items)
const Features = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const featuresList = [
    {
      title: "Fast Payments",
      desc: "Receive revenue in your local currency. Instantly transfer earnings directly to your bank account without delays.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      title: "Secure Transactions",
      desc: "Top-tier encryption protecting credit card info. Risk filters and fraud prevention systems run 24/7.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },
    {
      title: "Analytics",
      desc: "Keep absolute control over your store metrics. Track active customers, orders, conversion rate, and revenue.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"></path>
          <line x1="18.7" y1="8" x2="12" y2="15"></line>
          <line x1="12" y1="15" x2="8" y2="11"></line>
        </svg>
      )
    },
    {
      title: "Marketplace Integration",
      desc: "Instantly index your products on the global Universe catalog. Leverage millions of daily buyers.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      )
    },
    {
      title: "Inventory Management",
      desc: "Automated alerts for low stock. Dynamically update variations, colors, and availability values.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    },
    {
      title: "One-click Store Builder",
      desc: "Establish a beautiful, responsive storefront in minutes. Zero coding or domain setup knowledge required.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    }
  ];

  return (
    <section ref={ref} id="features" className={`reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2 className="section-title">Built for serious growth.</h2>
          <p className="section-description">
            Everything you need to launch, scale, and manage a successful online marketplace business globally.
          </p>
        </div>

        <div className="features-grid">
          {featuresList.map((feat, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon-wrapper">
                {feat.icon}
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const Testimonials = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const testimonialsList = [
    {
      quote: "Universe completely transformed our sales flow. We built our shop front in under five minutes, and integrated instant checkout that immediately grew our conversion rate by 34%.",
      name: "Marcus Vance",
      role: "CEO at ElectroPlus",
      avatar: (
        <svg viewBox="0 0 100 100">
          <rect width="100%" height="100%" fill="#E0F2FE" />
          <circle cx="50" cy="40" r="20" fill="#0284C7" />
          <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#0284C7" />
        </svg>
      )
    },
    {
      quote: "Managing stock and payouts was a nightmare with our legacy setups. Moving to Universe gave us instant analytics, one-click catalog management, and seamless payments.",
      name: "Clara Oster",
      role: "Founder at UrbanChic",
      avatar: (
        <svg viewBox="0 0 100 100">
          <rect width="100%" height="100%" fill="#D1FAE5" />
          <circle cx="50" cy="40" r="20" fill="#059669" />
          <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#059669" />
        </svg>
      )
    },
    {
      quote: "The interconnected buyer-seller system is unmatched. Being able to plug our catalog directly into the global Universe index gave us organic traffic that tripled our average order values.",
      name: "Haron Vance",
      role: "Operations at TimeKeepers",
      avatar: (
        <svg viewBox="0 0 100 100">
          <rect width="100%" height="100%" fill="#FEF3C7" />
          <circle cx="50" cy="40" r="20" fill="#D97706" />
          <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#D97706" />
        </svg>
      )
    }
  ];

  return (
    <section ref={ref} id="testimonials" className={`testimonials reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-title">Loved by business founders.</h2>
          <p className="section-description">
            See how merchants are using Universe to build profitable, scaling online stores.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonialsList.map((test, i) => (
            <div key={i} className="testimonial-card">
              <div>
                {/* 5 Stars */}
                <div className="stars-wrapper" style={{ marginBottom: "16px" }}>
                  {[...Array(5)].map((_, idx) => (
                    <svg key={idx} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ))}
                </div>
                <p className="testimonial-quote">"{test.quote}"</p>
              </div>

              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {test.avatar}
                </div>
                <div>
                  <h4 className="testimonial-name">{test.name}</h4>
                  <span className="testimonial-role">{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA Section
const CTA = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });

  return (
    <section ref={ref} className={`cta-section reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="cta-box">
          <h2 className="cta-title">Ready to Launch Your Store?</h2>
          <p className="cta-description">
            Join thousands of active entrepreneurs using Universe to build successful online businesses and reach global customers.
          </p>
          <Button className="btn-primary" onClick={() => document.getElementById("marketplace").scrollIntoView()}>
            Get Started Now <ArrowIcon />
          </Button>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-info">
            <a href="#" className="logo">
              Universe
              <span className="logo-dot"></span>
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
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
              <li><a href="#" className="footer-link">Sellers Agreement</a></li>
              <li><a href="#" className="footer-link">GDPR Compliance</a></li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h4 className="footer-heading">Stay Connected</h4>
            <p className="footer-text" style={{ marginBottom: "8px" }}>
              Subscribe to get the latest updates on growth hacks and platform enhancements.
            </p>
            {!subscribed ? (
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="newsletter-input"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="newsletter-btn" aria-label="Subscribe">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            ) : (
              <div className="newsletter-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Subscribed successfully!
              </div>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Universe Inc. All rights reserved.</div>
          <div style={{ display: "flex", gap: "24px" }}>
            <a href="#">Status</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Container Component
const App = () => {
  const [cartCount, setCartCount] = React.useState(0);
  const [showWarning, setShowWarning] = React.useState(false);

  React.useEffect(() => {
    // Detect if we are on file:// protocol
    if (window.location.protocol === "file:") {
      setShowWarning(true);
    }

    // Scroll reveal logic
    const handleScrollReveal = () => {
      const reveals = document.querySelectorAll(".reveal");
      reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;
        const elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
          el.classList.add("active");
        }
      });
    };
    window.addEventListener("scroll", handleScrollReveal);
    // Initial check
    setTimeout(handleScrollReveal, 200);

    return () => window.removeEventListener("scroll", handleScrollReveal);
  }, []);

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <>
      {showWarning && (
        <div className="local-cors-warning">
          <div className="warning-content">
            <svg className="warning-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div className="warning-text">
              <h4>Local File Warning (CORS Restriction)</h4>
              <p>
                Babel Standalone cannot compile external JavaScript files (like <code>app.js</code>) under the <code>file://</code> protocol in some browsers. To view this modular template, run a local web server (e.g. <code>python -m http.server</code>) or open <a href="index_standalone.html" style={{ textDecoration: "underline", fontWeight: 700, color: "#991B1B" }}>index_standalone.html</a> directly, which has the code inlined.
              </p>
            </div>
          </div>
          <button className="warning-close" onClick={() => setShowWarning(false)} aria-label="Dismiss warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <Navbar cartCount={cartCount} />
      <HeroSection />
      <FeaturesShowcase />
      <DashboardSection />
      <ProductSection onAddToCart={handleAddToCart} />
      <ConnectionSection />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
};

// Render main app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);