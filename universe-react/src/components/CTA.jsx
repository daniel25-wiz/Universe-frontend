import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Button from './ui/Button';
import ArrowIcon from './ui/ArrowIcon';

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

export default CTA;