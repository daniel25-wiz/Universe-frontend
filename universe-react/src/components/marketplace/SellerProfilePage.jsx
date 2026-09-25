import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCurrentUser } from '../../hooks/useAuth';
import { usePublicSellerProfile } from '../../hooks/useUser';
import { resolveDeliveryLocation } from '../../api/types';
import { slugifyStoreName } from '../../lib/storeDomain';
import { Icon, MobileFrame, ProductCard, ScreenHeader, WhatsAppGlyph } from './MobileMarketplaceShell';

/**
 * Public seller profile — opened by the "View seller profile" button at the
 * bottom of a product page.
 *
 * ROUTE NAME = THE SELLER NAME: the path segment is the seller's store name
 * slugified with the same helper that derives seller store domains
 * (src/lib/storeDomain -> slugifyStoreName), so "Campus Tech Hub" becomes
 * /marketplace/seller-profile/campustechhub. The seller's user id travels in
 * the query string (?sellerId=...) so a link copied from the address bar
 * resolves directly; when the id is missing (link typed by hand, id stripped)
 * the slug is resolved against the public catalog instead.
 *
 * DATA SOURCES: the seller's own published fields (name, email, phone, level,
 * department, course, school, bio) come from the PUBLIC seller-profile endpoint
 * (GET /users/:id/seller-profile); the listing-derived figures (product count,
 * average rating, review count, categories, first listing date, delivery hub)
 * are computed from the seller's active products. Any field the seller has not
 * published is left out entirely — nothing is invented to fill a gap. If a
 * backend has not implemented the endpoint yet the page still renders from the
 * product data alone.
 */
function SellerProfilePage({ savedProducts = [], onToggleSaved, onAddToCart }) {
  const { sellerSlug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const sellerIdFromUrl = searchParams.get('sellerId');

  /**
   * Sentinel: an id the API returns no rows for. Other marketplace views
   * (MyMarketplace, AddProductPage) use the same trick to keep hooks
   * unconditional while a real id is still being resolved.
   */
  const unresolved = { sellerId: '__loading__' };

  // Shared-link fallback: without an id in the URL, look the slug up in the
  // public catalog (each seller's featured listings).
  const { data: catalog = [], isLoading: isResolvingSeller } = useProducts(
    sellerIdFromUrl ? unresolved : { page: 1, pageSize: 50 },
  );
  const sellerId = sellerIdFromUrl
    || catalog.find((item) => item.sellerId && slugifyStoreName(item.seller) === sellerSlug)?.sellerId
    || null;

  // The seller's posted catalog. The API scopes drafts to the owner's own
  // workshop view, so a visitor only ever sees active products.
  const { data: products = [], isLoading: isLoadingProducts } = useProducts(
    sellerId ? { sellerId, page: 1, pageSize: 50 } : unresolved,
  );

  // The seller's own PUBLIC profile fields. Fetched in its own request so a
  // backend without the endpoint still leaves this page working from the
  // product data alone (and an unknown seller id stays a plain 404).
  const { data: profile } = usePublicSellerProfile(sellerId);


  if ((!sellerIdFromUrl && isResolvingSeller) || (sellerId && isLoadingProducts)) {
    return <SellerProfileState title="Opening seller profile" text="Loading this seller's store profile..." />;
  }

  if (!sellerId) {
    return <SellerProfileState title="Seller not found" text="This seller profile may have been removed or the link may be outdated." action="Back to marketplace" onAction={() => navigate('/marketplace')} />;
  }

  /**
   * A seller opening their OWN profile gets the workshop view back (active +
   * drafts). The profile must always show what BUYERS see, so explicit drafts
   * are dropped — a missing status is treated as visible, never hidden.
   */
  const listings = products.filter((product) => product.status !== 'draft');
  const seller = listings[0];
  if (!seller) {
    return <SellerProfileState title="No listings yet" text="This seller has no products posted right now. Check back soon." action="Back to marketplace" onAction={() => navigate('/marketplace')} />;
  }

  const sellerName = profile?.name || seller.seller || 'Campus Seller';
  // Contact number: the published profile phone first, then the number the
  // marketplace denormalizes onto each of this seller's product rows.
  const sellerPhone = String(profile?.phone || seller.sellerPhone || '').replace(/\D/g, '');
  const sellerLogo = profile?.logoUrl || seller.sellerLogo || null;
  const savedIds = new Set(savedProducts.map((product) => product.id));
  const isOwner = Boolean(currentUser && sellerId === currentUser.id);

  // Stats derived from the seller's own listings — every number comes from
  // backend data, so "—" is shown instead of a fabricated figure.
  const rated = listings.filter((product) => product.rating != null);
  const averageRating = rated.length
    ? rated.reduce((total, product) => total + product.rating, 0) / rated.length
    : null;
  const reviewCount = listings.reduce((total, product) => total + (product.reviews ?? 0), 0);
  const categories = [...new Set(listings.map((product) => product.category).filter(Boolean))];
  const firstListed = listings.reduce((oldest, product) => {
    const time = Date.parse(product.createdAt);
    if (Number.isNaN(time)) return oldest;
    return oldest != null && oldest <= time ? oldest : time;
  }, null);

  /**
   * Details list: the seller's PUBLISHED profile fields (name is in the hero)
   * followed by the facts derived from their listings. Rows whose value is
   * missing are dropped, so the page never shows an empty row or an invented
   * placeholder.
   */
  const facts = [
    ['Email', profile?.email],
    ['Phone', profile?.phone],
    ['Level', profile?.level],
    ['Department', profile?.department],
    ['Course', profile?.course],
    ['School', profile?.school],
    ['Categories', categories.length ? categories.join(', ') : null],
    ['First listed', formatMonthYear(firstListed)],
    ['Delivery hub', resolveDeliveryLocation(seller.deliveryLocation)],
  ].filter(([, value]) => Boolean(value));

  const messageSeller = () => {
    if (!sellerPhone) return;
    // Local numbers are dialled with the country code (the same rule the
    // product page's contact strip applies).
    const phone = sellerPhone.startsWith('0') ? `234${sellerPhone.slice(1)}` : sellerPhone;
    const text = `Hello ${sellerName}, I found your store on UNIVERSE and I'd like to ask about your products.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return <MobileFrame active="home" cartCount={0}>
    <ScreenHeader title={sellerName} />
    <main className="mm-scroll mm-seller-profile">
      <section className="mm-seller-profile-hero">
        <span className="mm-seller-profile-avatar" aria-hidden="true">
          {sellerLogo ? <img src={sellerLogo} alt="" /> : sellerName.trim().charAt(0).toUpperCase()}
        </span>
        <h2>{sellerName}</h2>
        <span className="mm-seller-profile-verified"><Icon name="check" /> Verified seller</span>
        <p>{`${listings.length} product${listings.length === 1 ? '' : 's'} listed on the UNIVERSE marketplace`}</p>
      </section>

      <section className="mm-seller-profile-stats" aria-label="Seller stats">
        <div><strong>{listings.length}</strong><span>Products</span></div>
        <div><strong>{averageRating != null ? averageRating.toFixed(1) : '—'}</strong><span>Avg rating</span></div>
        <div><strong>{reviewCount > 0 ? reviewCount : '—'}</strong><span>Reviews</span></div>
      </section>

      {facts.length > 0 && (
        <section className="mm-seller-profile-facts" aria-label="Seller details">
          {facts.map(([label, value]) => (
            <div key={label}><span>{label}</span><b>{value}</b></div>
          ))}
        </section>
      )}

      {profile?.bio && (
        <section className="mm-seller-profile-bio" aria-label="About this seller">
          <h2>{`About ${sellerName}`}</h2>
          <p>{profile.bio}</p>
        </section>
      )}

      {sellerPhone && (
        <section className="mm-contact-seller" aria-label="Contact seller">
          <button type="button" className="mm-whatsapp" onClick={messageSeller}>
            <WhatsAppGlyph />
            Message seller on WhatsApp
          </button>
          <small>Ask about any of this seller's products</small>
        </section>
      )}

      {isOwner && (
        <section className="mm-owner-row" aria-label="Seller actions">
          <button type="button" className="mm-owner-edit" onClick={() => navigate('/seller/profile')}>
            <Icon name="edit" /> Edit my store profile
          </button>
          <small>Buyers see this profile from every one of your product pages.</small>
        </section>
      )}

      <h2 className="mm-seller-profile-heading">{`Products from ${sellerName}`}</h2>
      <section className="mm-product-grid">
        {listings.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            saved={savedIds.has(product.id)}
            onToggleSaved={onToggleSaved}
            onAddToCart={onAddToCart}
            onOpen={(item) => navigate(`/marketplace/product/${item.id}`)}
          />
        ))}
      </section>
    </main>
  </MobileFrame>;
}

/** Month + year of the seller's oldest listing, e.g. "Sep 2026" (null when absent). */
function formatMonthYear(timestamp) {
  if (timestamp == null) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
}

function SellerProfileState({ title, text, action, onAction }) {
  return <div className="mm-state">
    <h1>{title}</h1>
    <p>{text}</p>
    {action && <button type="button" onClick={onAction}>{action}</button>}
  </div>;
}

export default SellerProfilePage;

