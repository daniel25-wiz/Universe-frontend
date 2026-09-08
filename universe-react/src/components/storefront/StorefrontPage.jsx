/**
 * Seller Private Marketplace Storefront — pixel-faithful port of
 * seller_private_market_storefront.html.
 *
 * This is the page served on every seller's own domain
 * (storename.<app-domain>, e.g. globalstore.universe.market). It is PUBLIC:
 * buyers visiting a store domain never need an account.
 *
 * Every section, icon, color and interaction matches the original mockup:
 * fixed glass header + page tabs, layered hero with profile mosaic, metric
 * cards, assurance bar, announcement strip, filterable/sortable catalog,
 * wishlist, follow, coupon + share copying and the toast notifications.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStorefront } from '../../hooks/useStorefront';
import { getUserInitials } from '../../lib/user';
import './storefront.css';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Products' },
  { key: 'tech', label: 'Tech & Gadgets' },
  { key: 'campus', label: 'Campus Essentials' },
  { key: 'lifestyle', label: 'Lifestyle & Accessories' },
];

const PAGE_TABS = [
  { key: 'all-products', label: 'All Products', target: 'sf-catalog' },
  { key: 'collections', label: 'Collections', target: 'sf-catalog' },
  { key: 'about-store', label: 'About Store', target: 'sf-about' },
  { key: 'customer-reviews', label: 'Customer Reviews', target: 'sf-reviews' },
  { key: 'contact-seller', label: 'Contact Seller', target: 'sf-contact' },
];

function StorefrontPage() {
  const { storeSlug } = useParams();
  const { data: store, isLoading, isError, error, refetch } = useStorefront(storeSlug);

  const [activePageTab, setActivePageTab] = useState('all-products');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('popular');
  const [following, setFollowing] = useState(false);
  const [wishlist, setWishlist] = useState(() => new Set());
  const [cartCount, setCartCount] = useState(3);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // The tab title mirrors the store domain experience.
  useEffect(() => {
    if (store) document.title = `${store.name} — UNIVERSE Private Marketplace`;
    return () => {
      document.title = 'Universe - Launch, Manage, and Scale Your Online Marketplace';
    };
  }, [store]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);
  /** Toast notifications — same behaviour as the mockup's showToast(). */
  const showToast = (message, icon = 'check_circle') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, icon, show: true });
    toastTimer.current = setTimeout(() => {
      setToast((current) => (current ? { ...current, show: false } : current));
    }, 3000);
  };

  const firstName = useMemo(
    () => (store?.owner ?? '').trim().split(/\s+/)[0] || 'the seller',
    [store?.owner],
  );

  /** Category + search filtering and sorting, mirroring the mockup's JS. */
  const visibleProducts = useMemo(() => {
    if (!store) return [];
    const q = query.trim().toLowerCase();
    const list = store.products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const haystack = `${product.name} ${product.categoryLabel}`.toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesCategory && matchesSearch;
    });
    const sorted = [...list];
    if (sort === 'popular') sorted.sort((a, b) => b.popularity - a.popularity);
    else if (sort === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') sorted.sort((a, b) => b.price - a.price);
    return sorted; // 'newest' keeps the catalog order
  }, [store, category, query, sort]);

  const toggleFollow = () => {
    setFollowing((was) => {
      showToast(was ? `Unfollowed ${store.name}` : `You are now following ${store.name}!`);
      return !was;
    });
  };

  const toggleWishlist = (product) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(product.id)) {
        next.delete(product.id);
        showToast('Item removed from wishlist');
      } else {
        next.add(product.id);
        showToast('Saved to wishlist!', 'favorite');
      }
      return next;
    });
  };

  const copyStoreUrl = async () => {
    const url = `https://${store.domain}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Store URL copied to clipboard!', 'content_copy');
    } catch {
      showToast(`Store link: ${store.domain}`, 'link');
    }
  };

  const applyDiscountBanner = async () => {
    try {
      await navigator.clipboard.writeText(store.couponCode);
      showToast(`Code ${store.couponCode} copied! (10% OFF applied)`, 'sell');
    } catch {
      showToast(`Code: ${store.couponCode}`, 'sell');
    }
  };

  const handleAddToCart = (product) => {
    setCartCount((count) => count + 1);
    showToast(`Added ${product.name} (${product.priceLabel}) to basket!`, 'shopping_bag');
  };

  const handleInstantBuy = (product) => {
    showToast(`Proceeding to Escrow Checkout for ${product.name}...`, 'lock');
  };

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
  };

  const goToSection = (tab) => {
    setActivePageTab(tab.key);
    document.getElementById(tab.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (isLoading) {
    return (
      <div className="sf-root">
        <div className="sf-state">
          <span className="material-symbols-outlined sf-state-icon sf-fill">storefront</span>
          <p className="sf-state-title">Opening storefront…</p>
          <p className="sf-state-text">Loading the private marketplace on this domain.</p>
          <div className="sf-loading-grid">
            <div className="sf-loading-bar" />
            <div className="sf-loading-bar" />
            <div className="sf-loading-bar" />
            <div className="sf-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !store) {
    return (
      <div className="sf-root">
        <div className="sf-state">
          <span className="material-symbols-outlined sf-state-icon">domain_disabled</span>
          <p className="sf-state-title">Storefront unavailable</p>
          <p className="sf-state-text">{error?.message || 'We could not load this private marketplace.'}</p>
          <button type="button" className="sf-noresults-btn" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const followerCount = store.followers + (following ? 1 : 0);
  const followerLabel = `${(followerCount / 1000).toFixed(1)}k`;

  return (
    <div className="sf-root">
      <StorefrontChrome
        store={store}
        firstName={firstName}
        cartCount={cartCount}
        activePageTab={activePageTab}
        onGoToSection={goToSection}
      />
      <main className="sf-main">
        <div className="sf-page">
          {/* Hero Banner with Layered Profile Mosaic */}
          <div className="sf-hero">
            <div
              className={store.bannerImage ? 'sf-hero-banner' : 'sf-hero-banner sf-banner-fallback'}
              style={store.bannerImage ? { backgroundImage: `url('${store.bannerImage}')` } : undefined}
              role="img"
              aria-label={store.bannerAlt || store.name}
            >
              {!store.bannerImage && (
                <div className="sf-banner-fallback-title">{store.name}</div>
              )}
              <div className="sf-hero-scrim" />
              <div className="sf-hero-status">
                <span className="sf-pulse-dot" />
                Accepting Orders Now
              </div>
            </div>
            {/* Store Profile Bar (Negative Margined Layered Content) */}
            <div className="sf-hero-body">
              <div className="sf-hero-flex">
                {/* Avatar + Store Identity */}
                <div className="sf-hero-identity">
                  <div className="sf-avatar-frame">
                    {store.avatarImage ? (
                      <div
                        className="sf-avatar-img"
                        style={{ backgroundImage: `url('${store.avatarImage}')` }}
                        role="img"
                        aria-label={store.avatarAlt}
                      />
                    ) : (
                      <div className="sf-avatar-fallback" title={store.name}>
                        {getUserInitials(store.name)}
                      </div>
                    )}
                    <div className="sf-avatar-check">
                      <span className="material-symbols-outlined sf-i15 sf-fill">verified</span>
                    </div>
                  </div>
                  <div className="sf-hero-titleblock">
                    <div className="sf-hero-titlerow">
                      <h1 className="sf-hero-title">{store.name}</h1>
                      <span className="sf-toprated">
                        <span className="material-symbols-outlined sf-i13">military_tech</span>
                        {` ${store.badgeLabel}`}
                      </span>
                    </div>
                    <div className="sf-hero-subrow">
                      <span>
                        {'Curated by '}
                        <strong className="sf-strong">{store.owner}</strong>
                      </span>
                      <span className="sf-dot2" />
                      <span className="sf-school">
                        <span className="material-symbols-outlined sf-i16">school</span>
                        {` ${store.school} Verified`}
                      </span>
                      <span className="sf-dot2" />
                      <span className="sf-storeid">{`ID: ${store.storeId}`}</span>
                    </div>
                  </div>
                </div>
                {/* Store Actions Group */}
                <div className="sf-hero-actions">
                  <button
                    type="button"
                    className={following ? 'sf-btn-follow following' : 'sf-btn-follow'}
                    onClick={toggleFollow}
                  >
                    <span className="material-symbols-outlined sf-i18">
                      {following ? 'bookmark_added' : 'bookmark_add'}
                    </span>
                    <span>{following ? 'Following' : 'Follow Store'}</span>
                    <span className="sf-follow-count">{followerLabel}</span>
                  </button>
                  <a
                    className="sf-btn-message"
                    href={store.whatsappUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined sf-i20">chat</span>
                    <span>Message Seller</span>
                  </a>
                  <button
                    type="button"
                    className="sf-btn-share"
                    onClick={copyStoreUrl}
                    title="Share store link"
                  >
                    <span className="material-symbols-outlined sf-i18">share</span>
                    <span className="sf-share-label">{store.domain}</span>
                  </button>
                </div>
              </div>
              {/* Metric Cards Grid */}
              <div className="sf-metrics">
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-tertiary">
                    <span className="material-symbols-outlined sf-i20 sf-fill">star</span>
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{`${store.rating.toFixed(1)} ★`}</span>
                    <span className="sf-metric-label">{`${store.reviewCount.toLocaleString('en-US')} Reviews`}</span>
                  </div>
                </div>
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-secondary">
                    <span className="material-symbols-outlined sf-i20">speed</span>
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{store.fulfillmentLabel}</span>
                    <span className="sf-metric-label">Fulfillment Rate</span>
                  </div>
                </div>
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-primary">
                    <span className="material-symbols-outlined sf-i20">reply_all</span>
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{store.responseTimeLabel}</span>
                    <span className="sf-metric-label">Avg Response Time</span>
                  </div>
                </div>
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-neutral">
                    <span className="material-symbols-outlined sf-i20">verified_user</span>
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{store.memberSinceLabel}</span>
                    <span className="sf-metric-label">Active on UNIVERSE</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* Assurance Highlights Bar */}
          <div className="sf-assurances">
            {store.assurances.map((item) => (
              <div className="sf-assurance" key={item.title}>
                <span className={`material-symbols-outlined tone-${item.tone}`}>{item.icon}</span>
                <div className="sf-assurance-col">
                  <span className="sf-assurance-title">{item.title}</span>
                  <span className="sf-assurance-sub">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Announcement & Promotion Strip */}
          <div className="sf-announce">
            <div className="sf-announce-blur" />
            <div className="sf-announce-row">
              <div className="sf-announce-left">
                <div className="sf-announce-icon">
                  <span className="material-symbols-outlined sf-i26">celebration</span>
                </div>
                <div className="sf-announce-text">
                  <div className="sf-announce-titlerow">
                    <span className="sf-announce-title">{store.announcementTitle}</span>
                    <span className="sf-limited">LIMITED TIME</span>
                  </div>
                  <p className="sf-announce-sub">
                    {`${store.announcementLead} `}
                    <span className="sf-coupon">{store.couponCode}</span>
                  </p>
                </div>
              </div>
              <button type="button" className="sf-btn-coupon" onClick={applyDiscountBanner}>
                <span className="material-symbols-outlined sf-i18">content_copy</span>
                <span>Copy Coupon</span>
              </button>
            </div>
          </div>

          {/* Main Catalog Section */}
          <div className="sf-catalog" id="sf-catalog">
            {/* Section Title & Filter Tabs */}
            <div className="sf-catalog-head">
              <div className="sf-catalog-titlerow">
                <div>
                  <span className="sf-eyebrow">Catalog Selection</span>
                  <h2 className="sf-catalog-title">{`${firstName}'s Verified Inventory`}</h2>
                </div>
                <div className="sf-stocknote">
                  <span className="sf-stockdot" />
                  <span>{store.stockNote}</span>
                </div>
              </div>
              {/* Category Pills Bar & Controls */}
              <div className="sf-controls">
                <div className="sf-pills">
                  {CATEGORY_TABS.map((tab) => (
                    <button
                      type="button"
                      key={tab.key}
                      className={category === tab.key ? 'sf-pill active' : 'sf-pill'}
                      onClick={() => setCategory(tab.key)}
                    >
                      {`${tab.label} (${store.catalogCounts[tab.key] ?? 0})`}
                    </button>
                  ))}
                </div>
                {/* In-Store Search & Sort Controls */}
                <div className="sf-controls-right">
                  <div className="sf-filter-search">
                    <span className="sf-filter-icon">
                      <span className="material-symbols-outlined sf-i18">search</span>
                    </span>
                    <input
                      className="sf-filter-input"
                      type="text"
                      placeholder="Filter store items..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  <div className="sf-sort">
                    <select
                      className="sf-sort-select"
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      aria-label="Sort products"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="newest">Newest Arrivals</option>
                    </select>
                    <span className="sf-sort-caret">
                      <span className="material-symbols-outlined sf-i16">expand_more</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Products Grid */}
            <div className="sf-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlisted={wishlist.has(product.id)}
                  onToggleWishlist={toggleWishlist}
                  onAddToCart={handleAddToCart}
                  onInstantBuy={handleInstantBuy}
                />
              ))}
            </div>
            {/* Empty State for Search Filter */}
            {visibleProducts.length === 0 && (
              <div className="sf-noresults">
                <span className="material-symbols-outlined sf-i48">search_off</span>
                <h4 className="sf-noresults-title">No Products Found</h4>
                <p className="sf-noresults-text">
                  Try tweaking your search keyword or explore other verified categories.
                </p>
                <button type="button" className="sf-noresults-btn" onClick={resetFilters}>
                  Reset Search
                </button>
              </div>
            )}
          </div>
          {/* Merchant Bio, Verified Student Reviews & Contact Section (Bento Grid) */}
          <div className="sf-bento">
            {/* Bio & Verification Card (5 Cols) */}
            <div className="sf-bio" id="sf-about">
              <div className="sf-bio-inner">
                <div className="sf-bio-head">
                  <div className="sf-bio-icon">
                    <span className="material-symbols-outlined sf-i24">store</span>
                  </div>
                  <div>
                    <span className="sf-bio-eyebrow">Merchant Story</span>
                    <h3 className="sf-bio-title">{`About ${store.name}`}</h3>
                  </div>
                </div>
                <p className="sf-bio-lead">{store.bioLead}</p>
                <p className="sf-bio-detail">{store.bioDetail}</p>
                {/* Store Operation Badges */}
                <div className="sf-bio-badges">
                  {store.bioBadges.map((badge) => (
                    <span className="sf-bio-badge" key={badge.label}>
                      <span className={`material-symbols-outlined sf-i15 tone-${badge.tone}`}>{badge.icon}</span>
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
              {/* Direct Contact Info Strip */}
              <div className="sf-contact" id="sf-contact">
                <span className="sf-contact-label">Verified Contact Channels</span>
                <div className="sf-contact-row">
                  <span className="sf-contact-key">
                    <span className="material-symbols-outlined sf-i16">call</span>
                    {' Phone / WhatsApp:'}
                  </span>
                  <a className="sf-contact-val" href={`tel:${store.phone}`}>{store.phone}</a>
                </div>
                <div className="sf-contact-row">
                  <span className="sf-contact-key">
                    <span className="material-symbols-outlined sf-i16">mail</span>
                    {' Official Email:'}
                  </span>
                  <a className="sf-contact-val" href={`mailto:${store.email}`}>{store.email}</a>
                </div>
              </div>
            </div>
            {/* Campus Customer Reviews Section (7 Cols) */}
            <div className="sf-reviews" id="sf-reviews">
              <div>
                <div className="sf-reviews-head">
                  <div>
                    <span className="sf-reviews-eyebrow">Verified Buyer Trust</span>
                    <h3 className="sf-reviews-title">What Students Say</h3>
                  </div>
                  <div className="sf-rating-pill">
                    <span className="material-symbols-outlined sf-i18 sf-fill">star</span>
                    <strong>{`${store.rating.toFixed(1)} / 5.0`}</strong>
                  </div>
                </div>
                {/* Reviews Grid */}
                <div className="sf-review-list">
                  {store.reviews.map((review) => (
                    <div className="sf-review" key={review.id}>
                      <div className="sf-review-top">
                        <div className="sf-review-who">
                          <div className={`sf-review-avatar tone-${review.avatarTone}`}>{review.initials}</div>
                          <div className="sf-review-id">
                            <span className="sf-review-name">{review.name}</span>
                            <span className="sf-review-meta">{review.meta}</span>
                          </div>
                        </div>
                        <div className="sf-review-stars">
                          {[0, 1, 2, 3, 4].map((starIndex) => (
                            <span key={starIndex} className="material-symbols-outlined sf-i14 sf-fill">star</span>
                          ))}
                        </div>
                      </div>
                      <p className="sf-review-text">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Rating Breakdown Bar Mini Visual */}
              <div className="sf-reviews-foot">
                <div className="sf-reviews-foot-left">
                  <span className="material-symbols-outlined sf-i18">verified</span>
                  <span>{store.reviewsNote}</span>
                </div>
                <a className="sf-reviews-link" href="#sf-reviews" onClick={(event) => event.preventDefault()}>
                  {'Read all reviews '}
                  <span className="material-symbols-outlined sf-i14">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className={toast?.show ? 'sf-toast show' : 'sf-toast'}>
        <span className="material-symbols-outlined sf-i20">{toast?.icon ?? 'check_circle'}</span>
        <span className="sf-toast-msg">{toast?.message ?? 'Action completed'}</span>
      </div>
    </div>
  );
}
/**
 * Fixed glass header — store identity, catalog search, WhatsApp/cart/avatar
 * actions and the secondary page-tabs row with the campus pickup note.
 * Structure and iconography match the mockup's <header> 1:1.
 */
function StorefrontChrome({ store, firstName, cartCount, activePageTab, onGoToSection }) {
  return (
    <header className="sf-header">
      <div className="sf-header-inner">
        <div className="sf-header-row">
          <div className="sf-brand">
            <div className="sf-brand-col">
              <div className="sf-brand-row">
                <span className="sf-brand-name">{store.name}</span>
                <span className="sf-brand-verified" title="Verified Merchant">
                  <span className="material-symbols-outlined sf-i18">verified</span>
                </span>
                <span className="sf-brand-rating">
                  <span className="material-symbols-outlined sf-i14 sf-fill">star</span>
                  {store.rating.toFixed(1)}
                </span>
              </div>
              <div className="sf-brand-row">
                <span className="sf-brand-owner">{`by ${store.owner}`}</span>
                <span className="sf-dot" />
                <span className="sf-brand-campus">
                  <span className="material-symbols-outlined sf-i14">school</span>
                  {store.campusTag}
                </span>
              </div>
            </div>
          </div>
          <div className="sf-header-search">
            <div className="sf-search-wrap">
              <span className="sf-search-icon">
                <span className="material-symbols-outlined sf-i20">search</span>
              </span>
              <input
                className="sf-search-input"
                type="text"
                placeholder={`Search in ${firstName}'s catalog...`}
                aria-label="Search this store's catalog"
              />
            </div>
          </div>
          <div className="sf-header-actions">
            <a
              className="sf-btn-whatsapp"
              href={store.whatsappUrl}
              rel="noopener noreferrer"
              target="_blank"
              type="button"
            >
              <span className="material-symbols-outlined sf-i18">chat</span>
              <span>WhatsApp</span>
            </a>
            <button className="sf-btn-cart" type="button" aria-label={`Basket, ${cartCount} items`}>
              <span className="material-symbols-outlined sf-i22">shopping_bag</span>
              <span className="sf-cart-badge">{cartCount}</span>
            </button>
            <div className="sf-avatar-circle">
              {store.avatarImage ? (
                <img className="sf-avatar-circle-img" src={store.avatarImage} alt={store.avatarAlt || store.name} />
              ) : (
                <span className="sf-avatar-circle-initials">{getUserInitials(store.name)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="sf-header-navrow">
          <nav className="sf-page-tabs" aria-label="Store sections">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-current={activePageTab === tab.key ? 'page' : undefined}
                className={activePageTab === tab.key ? 'sf-page-tab active' : 'sf-page-tab'}
                onClick={() => onGoToSection(tab)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="sf-pickup-note">
            <span className="material-symbols-outlined sf-i16">storefront</span>
            <span>{store.pickupNote}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
/**
 * One product card — image with hover zoom, stock/campus/badge pills,
 * wishlist heart, category + rating meta, Naira price and the
 * Add / Buy Now action pair. Exactly the mockup's .product-card markup.
 */
function ProductCard({ product, wishlisted, onToggleWishlist, onAddToCart, onInstantBuy }) {
  const categoryTone = product.category === 'tech' ? 'tone-primary' : 'tone-secondary';
  return (
    <div className="sf-card">
      <div className="sf-card-media">
        <div
          className="sf-card-img"
          style={{ backgroundImage: `url('${product.image}')` }}
          role="img"
          aria-label={product.imageAlt}
        />
        <div className="sf-card-badges">
          {product.badge === 'flash' && (
            <span className="sf-badge sf-badge-flash">-20% FLASH SALE</span>
          )}
          {product.badge === 'bestseller' && (
            <span className="sf-badge sf-badge-best">Best Seller</span>
          )}
          {product.stock != null && product.stock > 0 && (
            <span className="sf-badge sf-badge-stock">
              <span className="sf-badge-dot" />
              {` In Stock (${product.stock} available)`}
            </span>
          )}
          {product.campusPickup && (
            <span className="sf-badge sf-badge-pickup">
              <span className="material-symbols-outlined sf-i12">location_on</span>
              Campus Pickup Available
            </span>
          )}
        </div>
        <button
          type="button"
          className={wishlisted ? 'sf-wish active' : 'sf-wish'}
          onClick={() => onToggleWishlist(product)}
          title="Save to wishlist"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <span
            className={wishlisted ? 'material-symbols-outlined sf-i18 sf-fill' : 'material-symbols-outlined sf-i18'}
          >
            favorite
          </span>
        </button>
      </div>
      <div className="sf-card-body">
        <div>
          <div className="sf-card-meta">
            <span className={`sf-card-cat ${categoryTone}`}>{product.categoryLabel}</span>
            <div className="sf-card-rating">
              <span className="material-symbols-outlined sf-i14 sf-fill">star</span>
              <span>{product.rating.toFixed(1)}</span>
              <span className="sf-muted">{`(${product.reviews})`}</span>
            </div>
          </div>
          <h3 className="sf-card-name">{product.name}</h3>
          <p className="sf-card-desc">{product.description}</p>
        </div>
        <div className="sf-card-pricing">
          <div className="sf-price-row">
            <span className="sf-price">{product.priceLabel}</span>
            {product.oldPriceLabel && <span className="sf-oldprice">{product.oldPriceLabel}</span>}
          </div>
          <div className="sf-card-actions">
            <button type="button" className="sf-btn-add" onClick={() => onAddToCart(product)}>
              <span className="material-symbols-outlined sf-i18">shopping_bag</span>
              <span>Add</span>
            </button>
            <button type="button" className="sf-btn-buy" onClick={() => onInstantBuy(product)}>
              <span>Buy Now</span>
              <span className="material-symbols-outlined sf-i16">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StorefrontPage;




