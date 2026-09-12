import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../../hooks/useProducts';
import {
  Icon,
  MobileFrame,
  ProductCard,
} from '../../marketplace/MobileMarketplaceShell';

const CATEGORIES = ['All', 'AirPods', 'Laptop', 'Headphones', 'Smartphones', 'Watches'];
const MARKETPLACE_BANNERS = [
  '/ads1.jpg',
  '/ads2.jpg',
  '/ads3.jpg',
];

function PublicMarketplace({ cartItems = [], savedProducts = [], onToggleSaved, onAddToCart }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef(null);
  const { data: catalogProducts, isLoading } = useProducts({ status: 'active', pageSize: 200 });
  const products = catalogProducts ?? [];
  const visibleProducts = products.filter((product) => {
    const matchesSearch = !search.trim() || `${product.name} ${product.category}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = activeCategory === 'All' || `${product.name} ${product.category}`.toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });
  const savedIds = new Set(savedProducts.map((product) => product.id));
  const displayProducts = visibleProducts;

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/marketplace/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % MARKETPLACE_BANNERS.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const track = bannerRef.current;
    const slide = track?.children[activeBanner];
    // Scroll only the banner track itself (horizontal). scrollIntoView() would
    // also scroll the page's vertical container, yanking the user back to the
    // top every time the carousel auto-advances.
    if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
  }, [activeBanner]);

  return <MobileFrame active="home" cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)}>
    <main className="mm-scroll mm-discover">
      <section className="mm-discover-heading"><h1>Discover</h1><button type="button" aria-label="Notifications" className="mm-notification"><Icon name="bell" /><i /></button></section>
      <form className="mm-search-row" onSubmit={submitSearch}><label><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for product" /></label><button type="submit" aria-label="Search products" className="mm-filter"><Icon name="search" /></button></form>
      <section className="mm-banner-carousel" aria-label="Marketplace promotions"><div className="mm-banner-track" ref={bannerRef}>{MARKETPLACE_BANNERS.map((banner, index) => <img key={banner} src={banner} className="mm-banner-slide" alt={`Marketplace promotion ${index + 1}`} />)}</div><div className="mm-banner-dots" aria-hidden="true">{MARKETPLACE_BANNERS.map((banner, index) => <button type="button" key={banner} className={activeBanner === index ? 'active' : ''} aria-label={`Show promotion ${index + 1}`} onClick={() => setActiveBanner(index)} />)}</div></section>
      <section className="mm-categories"><div><h2>Categories</h2><button type="button">See all</button></div><div className="mm-category-scroll">{CATEGORIES.map((category) => <button type="button" key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div></section>
      {isLoading ? <section className="mm-product-grid"><p className="mm-loading">Loading products...</p></section> : displayProducts.length ? <section className="mm-product-grid">{displayProducts.map((product) => <ProductCard key={product.id} product={product} saved={savedIds.has(product.id)} onToggleSaved={onToggleSaved} onAddToCart={onAddToCart} onOpen={(item) => navigate(`/marketplace/product/${item.id}`)} />)}</section> : <section className="mm-empty-cart mm-marketplace-empty"><Icon name="search" /><h2>No products available yet</h2><p>Products will appear here when sellers publish them.</p></section>}
    </main>
  </MobileFrame>;
}

export default PublicMarketplace;
