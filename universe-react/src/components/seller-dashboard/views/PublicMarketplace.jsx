import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteProducts } from '../../../hooks/useProducts';
import {
  Icon,
  MobileFrame,
  ProductCard,
} from '../../marketplace/MobileMarketplaceShell';

const CATEGORIES = ['All', 'Fashion', 'Electronics', 'Gadgets', 'Books', 'Others'];
const MARKETPLACE_BANNERS = [
  '/ads1.jpg',
  '/ads2.jpg',
  '/ads3.jpg',
];

/**
 * Listings fetched per request. The catalog can outgrow one page (every seller
 * may list up to MARKETPLACE_LISTING_LIMIT products), so the grid renders page
 * one and "Load more" appends the next page — previously page one was all a
 * buyer could ever see, which hid freshly added products entirely.
 */
const PAGE_SIZE = 40;

function PublicMarketplace({ cartItems = [], savedProducts = [], onToggleSaved, onAddToCart }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef(null);
  const prefetchTriggerRef = useRef(null);
  const isFetchingRef = useRef(false);
  
  const trimmedSearch = search.trim();
  const isFiltered = Boolean(trimmedSearch) || activeCategory !== 'All';
  const {
    data: catalog,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts({
    featured: true,
    status: 'active',
    search: trimmedSearch || undefined,
    category: activeCategory === 'All' ? undefined : activeCategory,
    pageSize: PAGE_SIZE,
  });
  const products = (catalog?.pages ?? []).flatMap((page) => page.items);
  const catalogTotal = catalog?.pages[0]?.total ?? products.length;
  const savedIds = new Set(savedProducts.map((product) => product.id));
  const displayProducts = products;

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/marketplace/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
  };

  // Reset pagination when search or category filter changes
  useEffect(() => {
    queryClient.resetQueries({ 
      queryKey: ['products', 'pages'],
      exact: false 
    });
  }, [trimmedSearch, activeCategory, queryClient]);

  // Banner carousel auto-advance
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % MARKETPLACE_BANNERS.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  // Banner scroll behavior
  useEffect(() => {
    const track = bannerRef.current;
    const slide = track?.children[activeBanner];
    // Scroll only the banner track itself (horizontal). scrollIntoView() would
    // also scroll the page's vertical container, yanking the user back to the
    // top every time the carousel auto-advances.
    if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
  }, [activeBanner]);

  // Prefetch next page when user reaches ~50% of current products
  useEffect(() => {
    // Track fetching state to prevent duplicate requests
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    const trigger = prefetchTriggerRef.current;
    if (!trigger || isLoading || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Trigger prefetch when the 50% marker becomes visible
        // Only if we're not already fetching and there's a next page
        if (entry.isIntersecting && !isFetchingRef.current && hasNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0,
      }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [displayProducts.length, hasNextPage, isLoading, fetchNextPage]);

  return <MobileFrame active="home" cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)}>
    <main className="mm-scroll mm-discover">
      <section className="mm-discover-heading"><h1>Discover</h1><button type="button" aria-label="Notifications" className="mm-notification"><Icon name="bell" /><i /></button></section>
      <form className="mm-search-row" onSubmit={submitSearch}><label><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for product" /></label><button type="submit" aria-label="Search products" className="mm-filter"><Icon name="search" /></button></form>
      <section className="mm-banner-carousel" aria-label="Marketplace promotions"><div className="mm-banner-track" ref={bannerRef}>{MARKETPLACE_BANNERS.map((banner, index) => <img key={banner} src={banner} className="mm-banner-slide" alt={`Marketplace promotion ${index + 1}`} />)}</div><div className="mm-banner-dots" aria-hidden="true">{MARKETPLACE_BANNERS.map((banner, index) => <button type="button" key={banner} className={activeBanner === index ? 'active' : ''} aria-label={`Show promotion ${index + 1}`} onClick={() => setActiveBanner(index)} />)}</div></section>
      <section className="mm-categories"><div><h2>Categories</h2><button type="button">See all</button></div><div className="mm-category-scroll">{CATEGORIES.map((category) => <button type="button" key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div></section>
      {isLoading ? <section className="mm-product-grid"><p className="mm-loading">Loading products...</p></section> : displayProducts.length ? <section className="mm-product-grid">{displayProducts.map((product, index) => {
        // Place the prefetch trigger at approximately 50% of visible products
        const isPrefetchTrigger = index === Math.floor(displayProducts.length * 0.5);
        return (
          <div key={product.id} ref={isPrefetchTrigger ? prefetchTriggerRef : null}>
            <ProductCard product={product} saved={savedIds.has(product.id)} onToggleSaved={onToggleSaved} onAddToCart={onAddToCart} onOpen={(item) => navigate(`/marketplace/product/${item.id}`)} />
          </div>
        );
      })}</section> : <section className="mm-empty-cart mm-marketplace-empty"><Icon name="search" /><h2>{isFiltered ? 'No products match your filters' : 'No products available yet'}</h2><p>{isFiltered ? 'Try another search or category.' : 'Products will appear here when sellers publish them.'}</p></section>}
      {displayProducts.length > 0 && isFetchingNextPage && (
        <div className="mm-load-more">
          <p className="mm-loading">Loading products...</p>
        </div>
      )}
      {displayProducts.length > 0 && hasNextPage && !isFetchingNextPage && (
        <div className="mm-load-more">
          <button type="button" onClick={() => fetchNextPage()}>
            Load more products ({displayProducts.length} of {catalogTotal})
          </button>
        </div>
      )}
    </main>
  </MobileFrame>;
}

export default PublicMarketplace;
