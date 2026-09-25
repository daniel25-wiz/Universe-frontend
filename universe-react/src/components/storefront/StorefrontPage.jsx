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
import { useNavigate, useParams } from 'react-router-dom';
import { useStorefront } from '../../hooks/useStorefront';
import { getUserInitials } from '../../lib/user';
import { slugifyStoreName } from '../../lib/storeDomain';
import './storefront.css';
import './storefrontTemplates.css';
import MaterialIcon from '../../components/ui/MaterialIcon';

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
  const navigate = useNavigate();
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
    // Null popularity/price = unknown; unknowns sink to the end instead of
    // pretending a score the backend never sent.
    if (sort === 'popular') sorted.sort((a, b) => (b.popularity ?? -1) - (a.popularity ?? -1));
    else if (sort === 'price-low') sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === 'price-high') sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
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
          <MaterialIcon name="storefront" className="sf-state-icon" fill />
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
          <MaterialIcon name="domain_disabled" className="sf-state-icon" />
          <p className="sf-state-title">Storefront unavailable</p>
          <p className="sf-state-text">{error?.message || 'We could not load this private marketplace.'}</p>
          <button type="button" className="sf-noresults-btn" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const followerCount = store.followers != null ? store.followers + (following ? 1 : 0) : null;
  // Null followers = the backend tracks none — render "—" instead of "0.0k".
  const followerLabel = followerCount != null ? `${(followerCount / 1000).toFixed(1)}k` : '—';
  const pageTabs = store.template
    ? PAGE_TABS.filter((tab) => tab.key === 'all-products')
    : PAGE_TABS;

  return (
    <div className="sf-root">
      <StorefrontChrome
        store={store}
        firstName={firstName}
        cartCount={cartCount}
        activePageTab={activePageTab}
        onGoToSection={goToSection}
        pageTabs={pageTabs}
      />
      <main className="sf-main">
        <div className={`sf-page${store?.template ? ` sf-tpl-${store.template}` : ''}`}>
          {store.template && <TemplateGallery store={store} onExplore={() => document.getElementById('sf-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />}
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
                      <MaterialIcon name="verified" className="sf-i15" fill />
                    </div>
                  </div>
                  <div className="sf-hero-titleblock">
                    <div className="sf-hero-titlerow">
                      <h1 className="sf-hero-title">{store.name}</h1>
                      {/* Seller's own badge label — hidden when the backend
                          provides none. */}
                      {store.badgeLabel && (
                        <span className="sf-toprated">
                          <MaterialIcon name="military_tech" className="sf-i13" />
                          {` ${store.badgeLabel}`}
                        </span>
                      )}
                    </div>
                    <div className="sf-hero-subrow">
                      <span>
                        {'Curated by '}
                        <strong className="sf-strong">{store.owner}</strong>
                      </span>
                      <span className="sf-dot2" />
                      <span className="sf-school">
                        <MaterialIcon name="school" className="sf-i16" />
                        {` ${store.school} Verified`}
                      </span>
                      <span className="sf-dot2" />
                      {store.storeId && <span className="sf-storeid">{`ID: ${store.storeId}`}</span>}
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
                    <MaterialIcon name={following ? "bookmark_added" : "bookmark_add"} className="sf-i18" />
                    <span>{following ? 'Following' : 'Follow Store'}</span>
                    <span className="sf-follow-count">{followerLabel}</span>
                  </button>
                  <a
                    className="sf-btn-message"
                    href={store.whatsappUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <MaterialIcon name="chat" className="sf-i20" />
                    <span>Message Seller</span>
                  </a>
                  <button
                    type="button"
                    className="sf-btn-share"
                    onClick={copyStoreUrl}
                    title="Share store link"
                  >
                    <MaterialIcon name="share" className="sf-i18" />
                    <span className="sf-share-label">{store.domain}</span>
                  </button>
                </div>
              </div>
              {/* Metric Cards Grid */}
              <div className="sf-metrics">
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-tertiary">
                    <MaterialIcon name="star" className="sf-i20" fill />
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{store.rating != null ? `${store.rating.toFixed(1)} ★` : 'No rating yet'}</span>
                    <span className="sf-metric-label">{store.reviewCount != null ? `${store.reviewCount.toLocaleString('en-US')} Reviews` : 'No reviews yet'}</span>
                  </div>
                </div>
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-secondary">
                    <MaterialIcon name="speed" className="sf-i20" />
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{store.fulfillmentLabel ?? '—'}</span>
                    <span className="sf-metric-label">Fulfillment Rate</span>
                  </div>
                </div>
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-primary">
                    <MaterialIcon name="reply_all" className="sf-i20" />
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{store.responseTimeLabel ?? '—'}</span>
                    <span className="sf-metric-label">Avg Response Time</span>
                  </div>
                </div>
                <div className="sf-metric">
                  <div className="sf-metric-icon tone-neutral">
                    <MaterialIcon name="verified_user" className="sf-i20" />
                  </div>
                  <div className="sf-metric-col">
                    <span className="sf-metric-value">{store.memberSinceLabel ?? '—'}</span>
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
                <MaterialIcon name={item.icon} className={`tone-${item.tone}`} />
                <div className="sf-assurance-col">
                  <span className="sf-assurance-title">{item.title}</span>
                  <span className="sf-assurance-sub">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Announcement & Promotion Strip. The coupon elements render only
              when the backend provides a code — no invented promotions. */}
          {(store.announcementTitle || store.announcementLead || store.couponCode) && <div className="sf-announce">
            <div className="sf-announce-blur" />
            <div className="sf-announce-row">
              <div className="sf-announce-left">
                <div className="sf-announce-icon">
                  <MaterialIcon name="celebration" className="sf-i26" />
                </div>
                <div className="sf-announce-text">
                  <div className="sf-announce-titlerow">
                    <span className="sf-announce-title">{store.announcementTitle}</span>
                    {store.couponCode && <span className="sf-limited">LIMITED TIME</span>}
                  </div>
                  <p className="sf-announce-sub">
                    {store.announcementLead}
                    {store.couponCode && <span className="sf-coupon">{` ${store.couponCode}`}</span>}
                  </p>
                </div>
              </div>
              {store.couponCode && (
                <button type="button" className="sf-btn-coupon" onClick={applyDiscountBanner}>
                  <MaterialIcon name="content_copy" className="sf-i18" />
                  <span>Copy Coupon</span>
                </button>
              )}
            </div>
          </div>}

          {/* Main Catalog Section */}
          <div className="sf-catalog" id="sf-catalog">
            {/* Section Title & Filter Tabs */}
            <div className="sf-catalog-head">
              <div className="sf-catalog-titlerow">
                <div>
                  <span className="sf-eyebrow">Catalog Selection</span>
                  <h2 className="sf-catalog-title">{`${firstName}'s Verified Inventory`}</h2>
                </div>
                {/* Seller assurance copy — hidden entirely when the backend
                    provides none (never a fabricated assurance). */}
                {store.stockNote && (
                  <div className="sf-stocknote">
                    <span className="sf-stockdot" />
                    <span>{store.stockNote}</span>
                  </div>
                )}
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
                      <MaterialIcon name="search" className="sf-i18" />
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
                      <MaterialIcon name="expand_more" className="sf-i16" />
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
                  onOpen={() => navigate(`/store/${store.slug}/${slugifyStoreName(product.name)}`)}
                />
              ))}
            </div>
            {/* Empty State for Search Filter */}
            {visibleProducts.length === 0 && (
              <div className="sf-noresults">
                <MaterialIcon name="search_off" className="sf-i48" />
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
          {/* Secondary seller details stay off template storefronts so products remain the focus. */}
          {!store.template && <div className="sf-bento">
            {/* Bio & Verification Card (5 Cols) */}
            <div className="sf-bio" id="sf-about">
              <div className="sf-bio-inner">
                <div className="sf-bio-head">
                  <div className="sf-bio-icon">
                    <MaterialIcon name="store" className="sf-i24" />
                  </div>
                  <div>
                    <span className="sf-bio-eyebrow">Merchant Story</span>
                    <h3 className="sf-bio-title">{`About ${store.name}`}</h3>
                  </div>
                </div>
                {/* Seller's own bio copy — each part renders only when the
                    backend provides it; nothing is invented here. */}
                {store.bioLead && <p className="sf-bio-lead">{store.bioLead}</p>}
                {store.bioDetail && <p className="sf-bio-detail">{store.bioDetail}</p>}
                <div className="sf-bio-badges">
                  {store.bioBadges.map((badge) => (
                    <span className="sf-bio-badge" key={badge.label}>
                      <MaterialIcon name={badge.icon} className={`sf-i15 tone-${badge.tone}`} />
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
                    <MaterialIcon name="call" className="sf-i16" />
                    {' Phone / WhatsApp:'}
                  </span>
                  {store.phone ? <a className="sf-contact-val" href={`tel:${store.phone}`}>{store.phone}</a> : <span className="sf-contact-val">Not provided</span>}
                </div>
                <div className="sf-contact-row">
                  <span className="sf-contact-key">
                    <MaterialIcon name="mail" className="sf-i16" />
                    {' Official Email:'}
                  </span>
                  {store.email ? <a className="sf-contact-val" href={`mailto:${store.email}`}>{store.email}</a> : <span className="sf-contact-val">Not provided</span>}
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
                    <MaterialIcon name="star" className="sf-i18" fill />
                    <strong>{store.rating != null ? `${store.rating.toFixed(1)} / 5.0` : 'No rating yet'}</strong>
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
                            <MaterialIcon name="star" className="sf-i14" fill />
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
                  <MaterialIcon name="verified" className="sf-i18" />
                  <span>{store.reviewsNote ?? 'No reviews yet'}</span>
                </div>
                <a className="sf-reviews-link" href="#sf-reviews" onClick={(event) => event.preventDefault()}>
                  {'Read all reviews '}
                  <MaterialIcon name="arrow_forward" className="sf-i14" />
                </a>
              </div>
            </div>
          </div>}
        </div>
      </main>

      <div className={toast?.show ? 'sf-toast show' : 'sf-toast'}>
        <MaterialIcon name={toast?.icon ?? "check_circle"} className="sf-i20" />
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
function StorefrontChrome({ store, firstName, cartCount, activePageTab, onGoToSection, pageTabs }) {
  return (
    <header className={`sf-header${store.template ? ` sf-header-tpl-${store.template}` : ''}`}>
      <div className="sf-header-inner">
        <div className="sf-header-row">
          <div className="sf-brand">
            <div className="sf-brand-col">
              <div className="sf-brand-row">
                <span className="sf-brand-name">{store.name}</span>
                <span className="sf-brand-verified" title="Verified Merchant">
                  <MaterialIcon name="verified" className="sf-i18" />
                </span>
                <span className="sf-brand-rating">
                  <MaterialIcon name="star" className="sf-i14" fill />
                  {store.rating != null ? store.rating.toFixed(1) : '—'}
                </span>
              </div>
              <div className="sf-brand-row">
                <span className="sf-brand-owner">{`by ${store.owner}`}</span>
                {/* Seller's own campus tag — hidden when the backend provides
                    none. */}
                {store.campusTag && (
                  <>
                    <span className="sf-dot" />
                    <span className="sf-brand-campus">
                      <MaterialIcon name="school" className="sf-i14" />
                      {store.campusTag}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="sf-header-search">
            <div className="sf-search-wrap">
              <span className="sf-search-icon">
                <MaterialIcon name="search" className="sf-i20" />
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
              <MaterialIcon name="chat" className="sf-i18" />
              <span>WhatsApp</span>
            </a>
            <button className="sf-btn-cart" type="button" aria-label={`Basket, ${cartCount} items`}>
              <MaterialIcon name="shopping_bag" className="sf-i22" />
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
            {pageTabs.map((tab) => (
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
          {/* Pickup note derives from the seller's real pickupLocation —
              hidden entirely when there is none. */}
          {store.pickupNote && (
            <div className="sf-pickup-note">
              <MaterialIcon name="storefront" className="sf-i16" />
              <span>{store.pickupNote}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function TemplateGallery({ store, onExplore }) {
  const copy = store.template === 'tech-essentials-pro'
    ? { eyebrow: 'Verified hardware', title: 'Tools for serious study and work.', text: 'Certified tech, practical accessories, and reliable gear selected for campus life.' }
    : store.template === 'campus-quick-mart'
      ? { eyebrow: 'Fast campus essentials', title: 'Good deals, ready when you are.', text: 'Everyday essentials stocked close by, packed quickly, and ready for pickup or delivery.' }
      : { eyebrow: 'Curated campus living', title: 'Useful things, beautifully chosen.', text: 'A considered edit of accessories, study pieces, and lifestyle essentials from a trusted local seller.' };
  const images = store.bannerImages?.length ? store.bannerImages : (store.bannerImage ? [store.bannerImage] : []);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryRef = useRef(null);
  const galleryPaused = useRef(false);

  useEffect(() => {
    setActiveImageIndex((current) => Math.min(current, Math.max(images.length - 1, 0)));
  }, [images.length]);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      if (galleryPaused.current) return;
      setActiveImageIndex((current) => (current + 1) % images.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <section className="sf-template-gallery" aria-labelledby="sf-template-gallery-title">
      <div className="sf-template-gallery-copy">
        <span className="sf-template-eyebrow">{copy.eyebrow}</span>
        <h1 id="sf-template-gallery-title">{copy.title}</h1>
        <p>{copy.text} {`Curated by ${store.owner}.`}</p>
        <button type="button" className="sf-template-primary-action" onClick={onExplore}>Shop the collection <MaterialIcon name="arrow_downward" className="sf-i18" /></button>
      </div>
      <div className="sf-template-gallery-media">
        <div
          ref={galleryRef}
          className="sf-template-gallery-rail"
          aria-label={`${store.name} storefront images`}
          onMouseEnter={() => { galleryPaused.current = true; }}
          onMouseLeave={() => { galleryPaused.current = false; }}
          onFocus={() => { galleryPaused.current = true; }}
          onBlur={() => { galleryPaused.current = false; }}
        >
          {images.length ? (
            <figure className="sf-template-gallery-card" key={images[activeImageIndex]}>
              <img src={images[activeImageIndex]} alt={`${store.name} storefront view ${activeImageIndex + 1}`} />
              <figcaption>{activeImageIndex === 0 ? 'Storefront collection' : `Collection view ${activeImageIndex + 1}`}</figcaption>
            </figure>
          ) : <div className="sf-template-gallery-empty">Seller images will appear here.</div>}
        </div>
        {images.length > 1 && (
          <div className="sf-template-gallery-dots" aria-label="Choose storefront image">
            {images.map((image, index) => (
              <button
                type="button"
                key={image}
                className={index === activeImageIndex ? 'active' : ''}
                aria-label={`Show storefront image ${index + 1}`}
                aria-current={index === activeImageIndex ? 'true' : undefined}
                onClick={() => setActiveImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
/**
 * One product card — image with hover zoom, stock/campus/badge pills,
 * wishlist heart, category + rating meta, Naira price and the
 * Add / Buy Now action pair. Exactly the mockup's .product-card markup.
 */
function ProductCard({ product, wishlisted, onToggleWishlist, onAddToCart, onInstantBuy, onOpen }) {
  const categoryTone = product.category === 'tech' ? 'tone-primary' : 'tone-secondary';
  return (
    <article
      className="sf-card sf-card-clickable"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="link"
      tabIndex={0}
    >
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
              <MaterialIcon name="location_on" className="sf-i12" />
              Campus Pickup Available
            </span>
          )}
        </div>
        <button
          type="button"
          className={wishlisted ? 'sf-wish active' : 'sf-wish'}
          onClick={(event) => { event.stopPropagation(); onToggleWishlist(product); }}
          title="Save to wishlist"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <MaterialIcon name="favorite" className="sf-i18" fill={wishlisted} />
        </button>
      </div>
      <div className="sf-card-body">
        <div>
          <div className="sf-card-meta">
            <span className={`sf-card-cat ${categoryTone}`}>{product.categoryLabel}</span>
            <div className="sf-card-rating">
              {product.rating != null && (
                <>
                  <MaterialIcon name="star" className="sf-i14" fill />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="sf-muted">{`(${product.reviews ?? 0})`}</span>
                </>
              )}
            </div>
          </div>
          <h3 className="sf-card-name">{product.name}</h3>
          <p className="sf-card-desc">{product.description}</p>
        </div>
        <div className="sf-card-pricing">
          <div className="sf-price-row">
            <span className="sf-price">{product.priceLabel ?? '—'}</span>
            {product.oldPriceLabel && <span className="sf-oldprice">{product.oldPriceLabel}</span>}
          </div>
          <div className="sf-card-actions">
            <button type="button" className="sf-btn-add" onClick={(event) => { event.stopPropagation(); onAddToCart(product); }}>
              <MaterialIcon name="shopping_bag" className="sf-i18" />
              <span>Add</span>
            </button>
            <button type="button" className="sf-btn-buy" onClick={(event) => { event.stopPropagation(); onInstantBuy(product); }}>
              <span>Buy Now</span>
              <MaterialIcon name="arrow_forward" className="sf-i16" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default StorefrontPage;




