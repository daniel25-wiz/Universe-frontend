import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Button from './ui/Button';
import ArrowIcon from './ui/ArrowIcon';

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

export default FeaturesShowcase;