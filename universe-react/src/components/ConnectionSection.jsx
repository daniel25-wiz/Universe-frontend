import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

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

export default ConnectionSection;