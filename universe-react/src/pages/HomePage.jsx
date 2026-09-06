import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';

/**
 * Landing page composition with code splitting + progressive loading.
 *
 * Navbar + HeroSection (above the fold) are loaded eagerly so the first paint
 * is fast. Everything below the fold lives in ONE lazy chunk (HomeSections)
 * that is only fetched once the user scrolls near it (or clicks an in-page
 * anchor link). Nothing below the fold is downloaded on initial load.
 */
const HomeSections = lazy(() => import('./HomeSections'));

const HomePage = ({ cartCount, onAddToCart }) => {
  const [ready, setReady] = useState(false);
  const anchorRef = useRef(null);

  // Load below-the-fold content when the user scrolls near it.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !anchorRef.current) {
      setReady(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          obs.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    obs.observe(anchorRef.current);
    return () => obs.disconnect();
  }, []);

  // Also load immediately when an in-page nav link asks for it.
  useEffect(() => {
    const onRequest = () => setReady(true);
    window.addEventListener('universe:load-home-sections', onRequest);
    return () => window.removeEventListener('universe:load-home-sections', onRequest);
  }, []);

  return (
    <>
      <Navbar cartCount={cartCount} />
      <HeroSection />

      <div ref={anchorRef} className="home-sections-anchor" aria-hidden="true" />

      {ready ? (
        <Suspense fallback={<div className="section-loader" aria-hidden="true" />}>
          <HomeSections onAddToCart={onAddToCart} />
        </Suspense>
      ) : (
        <div className="home-sections-placeholder" aria-hidden="true" />
      )}
    </>
  );
};

export default HomePage;