import { useState } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useProducts } from '../hooks/useProducts';
import { formatMoney } from '../lib/user';

const ProductSection = ({ onAddToCart }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [activeCategory, setActiveCategory] = useState('All');
  const [wishlist, setWishlist] = useState({});

  const categories = [
    'All', 'Electronics', 'Phones', 'Fashion', 'Shoes', 'Watches', 'Furniture', 'Grocery', 'Beauty', 'Computers'
  ];

  const { data: products, isLoading } = useProducts({ status: 'active' });

  const filteredProducts = !products
    ? []
    : activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <section ref={ref} id="marketplace" className={`product-section reveal ${isVisible ? 'active' : ''}`}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Marketplace</span>
          <h2 className="section-title">Discover trending products.</h2>
          <p className="section-description">
            Browse quality items from verified sellers across multiple categories.
          </p>
        </div>

        <div className="product-filters">
          {categories.map((cat, i) => (
            <button
              key={i}
              className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="product-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="product-card skeleton-card">
                <div className="skeleton-img" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-img-wrapper">
                  <div
                    className="wishlist-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWishlist((prev) => ({ ...prev, [product.id]: !prev[product.id] }));
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist[product.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <span className="seller-badge">{product.seller}</span>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.imageAlt ?? product.name} loading="lazy" />
                  ) : (
                    <div className="product-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-title">{product.name}</h3>
                  <div className="product-rating">
                    <div className="stars-wrapper">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span>{product.rating} ({product.reviews})</span>
                  </div>
                  <div className="product-footer">
                    <span className="product-price">{formatMoney(product.salePrice ?? product.price)}</span>
                    <button className="add-cart-btn" onClick={onAddToCart} aria-label="Add to cart">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;