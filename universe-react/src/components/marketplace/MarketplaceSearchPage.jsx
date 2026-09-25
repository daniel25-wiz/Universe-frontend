import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteProducts } from '../../hooks/useProducts';
import { Icon, MobileFrame, ProductCard, ScreenHeader } from './MobileMarketplaceShell';

/** One server page per request — "Load more" appends the next (see PublicMarketplace). */
const PAGE_SIZE = 40;

function MarketplaceSearchPage({ cartItems = [], savedProducts = [], onToggleSaved }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const prefetchTriggerRef = useRef(null);
  const isFetchingRef = useRef(false);
  
  const normalizedQuery = query.trim();
  const {
    data: catalog,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts({ featured: true, status: 'active', search: normalizedQuery || undefined, pageSize: PAGE_SIZE });
  const results = (catalog?.pages ?? []).flatMap((page) => page.items);
  const total = catalog?.pages[0]?.total ?? results.length;
  const savedIds = new Set(savedProducts.map((product) => product.id));
  
  const submitSearch = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setParams(nextQuery ? { q: nextQuery } : {});
  };

  // Reset pagination when search query changes
  useEffect(() => {
    queryClient.resetQueries({ 
      queryKey: ['products', 'pages'],
      exact: false 
    });
  }, [normalizedQuery, queryClient]);

  // Track fetching state to prevent duplicate requests
  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Prefetch next page when user reaches ~50% of current results
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
  }, [results.length, hasNextPage, isLoading, fetchNextPage]);

  return <MobileFrame active="search" cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)}>
    <ScreenHeader title="Search" />
    <main className="mm-scroll mm-search-page">
      <form className="mm-search-page-form" onSubmit={submitSearch}><Icon name="search" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for product" aria-label="Search for product" /><button type="submit">Search</button></form>
      <div className="mm-search-results-heading"><h2>{normalizedQuery ? `Results for "${query.trim()}"` : 'All products'}</h2><span>{isLoading ? 'Loading...' : total > results.length ? `${results.length} of ${total} products` : `${results.length} ${results.length === 1 ? 'product' : 'products'}`}</span></div>
      {isLoading ? <p className="mm-loading">Loading products...</p> : results.length ? <section className="mm-product-grid">{results.map((product, index) => {
        // Place the prefetch trigger at approximately 50% of visible results
        const isPrefetchTrigger = index === Math.floor(results.length * 0.5);
        return (
          <div key={product.id} ref={isPrefetchTrigger ? prefetchTriggerRef : null}>
            <ProductCard product={product} saved={savedIds.has(product.id)} onToggleSaved={onToggleSaved} onOpen={(item) => navigate(`/marketplace/product/${item.id}`)} />
          </div>
        );
      })}</section> : <section className="mm-empty-cart"><Icon name="search" /><h2>No products found</h2><p>Try a different product name or category.</p></section>}
      {results.length > 0 && isFetchingNextPage && (
        <div className="mm-load-more">
          <p className="mm-loading">Loading products...</p>
        </div>
      )}
      {results.length > 0 && hasNextPage && !isFetchingNextPage && (
        <div className="mm-load-more">
          <button type="button" onClick={() => fetchNextPage()}>
            Load more products
          </button>
        </div>
      )}
    </main>
  </MobileFrame>;
}

export default MarketplaceSearchPage;
