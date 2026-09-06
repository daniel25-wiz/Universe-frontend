import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

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

export default Features;