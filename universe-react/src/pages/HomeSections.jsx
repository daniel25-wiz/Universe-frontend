import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const FeaturesShowcase = lazy(() => import('../components/FeaturesShowcase'));
const DashboardSection = lazy(() => import('../components/DashboardSection'));
const ProductSection = lazy(() => import('../components/ProductSection'));
const ConnectionSection = lazy(() => import('../components/ConnectionSection'));
const Features = lazy(() => import('../components/Features'));
const CTA = lazy(() => import('../components/CTA'));
const Footer = lazy(() => import('../components/Footer'));

function Section({ children }) {
  const [ready, setReady] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !sectionRef.current) {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef}>
      {ready ? (
        <Suspense fallback={<div className="section-loader" aria-hidden="true" />}>
          {children}
        </Suspense>
      ) : (
        <div className="section-loader" aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * Each section gets its own chunk and starts loading only as it approaches
 * the viewport. This keeps untouched lower-page content out of startup.
 */
const HomeSections = ({ onAddToCart }) => (
  <>
    <Section><FeaturesShowcase /></Section>
    <Section><DashboardSection /></Section>
    <Section><ProductSection onAddToCart={onAddToCart} /></Section>
    <Section><ConnectionSection /></Section>
    <Section><Features /></Section>
    <Section><CTA /></Section>
    <Section><Footer /></Section>
  </>
);

export default HomeSections;