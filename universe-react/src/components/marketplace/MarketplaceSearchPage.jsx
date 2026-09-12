import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { Icon, MobileFrame, ProductCard, ScreenHeader } from './MobileMarketplaceShell';

function MarketplaceSearchPage({ cartItems = [], savedProducts = [], onToggleSaved }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const { data: products, isLoading } = useProducts({ status: 'active', pageSize: 200 });
  const normalizedQuery = query.trim().toLowerCase();
  const results = (products ?? []).filter((product) => !normalizedQuery || `${product.name} ${product.category} ${product.description || ''}`.toLowerCase().includes(normalizedQuery));
  const savedIds = new Set(savedProducts.map((product) => product.id));
  const submitSearch = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setParams(nextQuery ? { q: nextQuery } : {});
  };

  return <MobileFrame active="search" cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)}>
    <ScreenHeader title="Search" />
    <main className="mm-scroll mm-search-page">
      <form className="mm-search-page-form" onSubmit={submitSearch}><Icon name="search" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for product" aria-label="Search for product" /><button type="submit">Search</button></form>
      <div className="mm-search-results-heading"><h2>{normalizedQuery ? `Results for “${query.trim()}”` : 'All products'}</h2><span>{isLoading ? 'Loading...' : `${results.length} products`}</span></div>
      {isLoading ? <p className="mm-loading">Loading products...</p> : results.length ? <section className="mm-product-grid">{results.map((product) => <ProductCard key={product.id} product={product} saved={savedIds.has(product.id)} onToggleSaved={onToggleSaved} onOpen={(item) => navigate(`/marketplace/product/${item.id}`)} />)}</section> : <section className="mm-empty-cart"><Icon name="search" /><h2>No products found</h2><p>Try a different product name or category.</p></section>}
    </main>
  </MobileFrame>;
}

export default MarketplaceSearchPage;
