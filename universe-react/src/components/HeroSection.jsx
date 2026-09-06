import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import ArrowIcon from './ui/ArrowIcon';
import { prefetchPropsForPath } from '../lib/prefetch';

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

const HeroSection = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const navigate = useNavigate();

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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
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
          <Button className="btn-hero-primary" onClick={() => navigate('/auth/signup')} {...prefetchPropsForPath('/auth/signup')}>
            <span className="btn-text">Get Started</span>
            <ArrowIcon className="btn-arrow" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;