import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import { useCurrentUser } from '../../hooks/useAuth';
import { resolveDeliveryLocation } from '../../api/types';
import { slugifyStoreName } from '../../lib/storeDomain';
import { Icon, MobileFrame, ProductArt, WhatsAppGlyph, formatNaira, formatProductPrice } from './MobileMarketplaceShell';

function MarketplaceProductPage({ onAddToCart, savedProducts = [], onToggleSaved }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(productId);
  // Called before the early returns below so the hook order stays stable
  // (a signed-out visitor simply gets no user and therefore no owner UI).
  const { data: currentUser } = useCurrentUser();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(savedProducts.some((item) => item.id === productId));
  const [selectedImage, setSelectedImage] = useState(null);
  // Full-screen image viewer, opened from the gallery's expand button.
  const [fullscreen, setFullscreen] = useState(false);
  // Map of variant name → chosen value (defaults to the first option per group).
  const [selectedVariants, setSelectedVariants] = useState({});
  // "Buy Now" jumps to the cart a second after the tap so the buyer first sees
  // the "Added" confirmation. The timer lives in a ref and is cleared on
  // unmount so leaving the page early never fires a stale redirect.
  const buyTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(buyTimer.current), []);

  // Escape closes the full-screen viewer while it is open.
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreen]);

  if (isLoading) return <ProductState title="Opening product" text="Loading product details..." />;
  if (isError || !product) return <ProductState title="Product not found" text="This product is no longer available." action="Back to marketplace" onAction={() => navigate('/marketplace')} />;

  /**
   * Sellers browse the public marketplace too, so when the viewer owns this
   * listing we surface an edit shortcut here. Ownership is only a UI hint —
   * the API independently rejects edits to products you don't own (404).
   */
  const isOwner = Boolean(currentUser && product.sellerId && currentUser.id === product.sellerId);

  // Variant option groups entered by the seller on the Add Product page.
  const variants = (product.variants ?? []).filter(
    (variant) => variant?.name && Array.isArray(variant.values) && variant.values.length > 0,
  );
  const selectedValue = (variant) => selectedVariants[variant.name] ?? variant.values[0];
  const variantLabel = variants
    .map((variant) => `${variant.name}: ${selectedValue(variant)}`)
    .join(' · ');

  const price = product.salePrice ?? product.price;
  const stock = product.stock;
  const stockLabel = stock == null
    ? 'In Stock'
    : stock > 0
      ? `In Stock (${stock} available)`
      : 'Sold Out';
  // Condition the seller attested on the Add Product page ("Brand New" -> new,
  // "Fairly Used" -> used). Legacy rows without data show the honest
  // "Condition unavailable" label instead of inventing a state.
  const conditionLabel = product.condition === 'used' ? 'Used' : product.condition === 'new' ? 'New' : 'Condition unavailable';
  // Delivery hub the buyer collects from. Every product added through the
  // seller's Add Product page carries the platform default ("Motion Ground At
  // DHL Building"), so that same hub is what the marketplace shows.
  const deliveryLocation = resolveDeliveryLocation(product.deliveryLocation);
  /**
   * Route name of the public seller profile: the seller's store name slugified
   * with the SAME helper that derives seller store domains
   * (src/lib/storeDomain). Falls back to "seller" for a name that slugifies to
   * nothing, so the route segment is still valid.
   */
  const sellerProfileSlug = slugifyStoreName(product.seller) || 'seller';
  const productImages = product.images?.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const activeImage = selectedImage && productImages.includes(selectedImage)
    ? selectedImage
    : productImages[0];
  const toggleFavorite = () => {
    setFavorite((current) => !current);
    onToggleSaved?.(product);
  };
  const addProduct = () => {
    for (let index = 0; index < quantity; index += 1) onAddToCart(product, variantLabel || undefined);
    setAdded(true);
    // Restart the redirect timer on repeated taps so the buyer always gets a
    // full second of "Added" feedback before landing on the cart page.
    window.clearTimeout(buyTimer.current);
    buyTimer.current = window.setTimeout(() => navigate('/cart'), 1000);
  };
  const messageSeller = () => {
    const digits = String(product.sellerPhone || '').replace(/\D/g, '');
    if (!digits) return;
    const phone = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
    const details = [
      `Hello ${product.seller || 'Seller'}, I'm interested in buying:`,
      `Product: ${product.name}`,
      `Quantity: ${quantity}`,
      `Price: ${formatNaira(price * quantity)}`,
      variantLabel ? `Options: ${variantLabel}` : null,
      `Product link: ${window.location.href}`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(details)}`, '_blank', 'noopener,noreferrer');
  };

  return <MobileFrame active="search" cartCount={0} className="mm-product-page" showBottomNav={false}>
    <header className="mm-product-header"><button type="button" aria-label="Go back" onClick={() => navigate(-1)}><Icon name="arrowBack" /></button><span>{product.category || 'Audio & Tech'}</span><div><button type="button" aria-label="Share product"><Icon name="share" /></button><button type="button" aria-label="Add to wishlist" className={favorite ? 'favorite' : ''} onClick={toggleFavorite}><Icon name="heart" /></button></div></header>
    <main className="mm-scroll mm-product-scroll">
      <section className="mm-gallery"><div className="mm-gallery-art"><div className="mm-badges"><span className="mm-verified">Verified</span><span className="mm-condition">{conditionLabel}</span></div><button type="button" className="mm-zoom" aria-label="View product full screen" onClick={() => setFullscreen(true)}><Icon name="expand" /></button>{activeImage ? <ProductArt product={{ ...product, imageUrl: activeImage }} variant="gallery" /> : <ProductArt product={product} variant="gallery" />}<span className="mm-image-fallback"><ProductArt product={product} variant="gallery" /></span></div>{productImages.length > 1 && <div className="mm-thumbnails" aria-label="Product images">{productImages.map((image, index) => <button type="button" key={`${image}-${index}`} className={activeImage === image ? 'active' : ''} onClick={() => setSelectedImage(image)} aria-label={`View product image ${index + 1}`}><img src={image} alt="" /></button>)}</div>}</section>
      <section className="mm-product-info"><div className="mm-product-info-top"><span>{product.seller || 'Seller unavailable'}</span>{product.rating != null ? <em>★ {product.rating.toFixed(1)}{product.reviews != null ? ` (${product.reviews})` : ''}</em> : <em>No reviews yet</em>}</div><h1>{product.name}</h1><div className="mm-price-line"><strong>{formatProductPrice(product)}</strong>{product.price != null && product.salePrice != null && product.salePrice < product.price && <del>{formatNaira(product.price)}</del>}</div><div className="mm-pickup"><div><strong>Delivery location</strong><small>{deliveryLocation}</small></div><span className={stock != null && stock <= 0 ? 'mm-stock-out' : ''}>{stockLabel}</span></div></section>
      {product.sellerId && (
        <section className="mm-seller-row">
          <button type="button" className="mm-seller-btn" onClick={() => navigate(`/marketplace/seller/${product.sellerId}`)} aria-label={`View all products from ${product.seller || 'this seller'}`}>
            <span className="mm-seller-avatar">{product.sellerLogo ? <img src={product.sellerLogo} alt="" /> : (product.seller || 'S').trim().charAt(0).toUpperCase()}</span>
            <span className="mm-seller-text"><b>{product.seller || 'Campus Seller'}</b><small>View all products from this seller</small></span>
            <Icon name="arrowBack" className="mm-seller-arrow" />
          </button>
        </section>
      )}
      {isOwner && (
        <section className="mm-owner-row" aria-label="Seller actions">
          <button
            type="button"
            className="mm-owner-edit"
            onClick={() => navigate(`/seller/edit-product/${product.id}`)}
          >
            <Icon name="edit" /> Edit this product
          </button>
          <small>You are the seller of this listing.</small>
        </section>
      )}
      {variants.length > 0 && <section className="mm-variants" aria-label="Choose product options">{variants.map((variant) => { const current = selectedValue(variant); return <div className="mm-variant" key={variant.name}><div className="mm-variant-head"><label>{variant.name}: <b>{current}</b></label><small>{variant.values.length} {variant.values.length === 1 ? 'option' : 'options'}</small></div><div className="mm-editions">{variant.values.map((value) => <button type="button" key={value} className={value === current ? 'selected' : ''} aria-pressed={value === current} onClick={() => setSelectedVariants((previous) => ({ ...previous, [variant.name]: value }))}><b>{value}</b><small>{value === current ? 'Selected' : 'Available'}</small></button>)}</div></div>; })}</section>}
      {product.sellerPhone && <section className="mm-contact-seller" aria-label="Contact seller"><button type="button" className="mm-whatsapp" onClick={messageSeller}><WhatsAppGlyph /> Message seller on WhatsApp</button><small>Product details and link will be included</small></section>}
      {product.description ? <section className="mm-overview"><h2>Product Overview</h2><p>{product.description}</p></section> : null}
      {/* Bottom of the page: opens the seller's public profile
          (/marketplace/seller-profile/:sellerSlug). The seller id rides along in
          the query string so the profile resolves without a catalog scan; the
          path segment itself is the seller NAME. */}
      {product.sellerId && (
        <section className="mm-seller-profile-cta" aria-label="Seller profile">
          <button
            type="button"
            className="mm-seller-profile-btn"
            onClick={() => navigate(`/marketplace/seller-profile/${sellerProfileSlug}?sellerId=${encodeURIComponent(product.sellerId)}`)}
            aria-label={`View seller profile for ${product.seller || 'this seller'}`}
          >
            <Icon name="user" />
            <span>
              <b>View seller profile</b>
              <small>About {product.seller || 'this seller'}</small>
            </span>
            <Icon name="arrowBack" className="mm-seller-arrow" />
          </button>
        </section>
      )}
    </main>
    <footer className="mm-buy-bar"><div className="mm-buy-row"><div className="mm-stepper"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button><span>{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button></div><button type="button" className="mm-buy" aria-label={`Buy ${product.name}${variantLabel ? ` (${variantLabel})` : ''}`} onClick={addProduct}><span><Icon name="cart" />{added ? 'Added' : 'Buy Now'}</span><b>{formatNaira(price * quantity)} <i>→</i></b></button></div></footer>
      {fullscreen && activeImage && (
        <div
          className="mm-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label={`View ${product.name} full screen`}
          onClick={() => setFullscreen(false)}
        >
          <button type="button" className="mm-fullscreen-close" aria-label="Exit full screen" onClick={() => setFullscreen(false)}>
            <Icon name="close" />
          </button>
          <img src={activeImage} alt={product.imageAlt || product.name} />
          {productImages.length > 1 && (
            <div className="mm-fullscreen-thumbs" aria-label="Product images" onClick={(event) => event.stopPropagation()}>
              {productImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={image === activeImage ? 'active' : ''}
                  onClick={() => setSelectedImage(image)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
          <small>Tap anywhere to close</small>
        </div>
      )}
  </MobileFrame>;
}

function ProductState({ title, text, action, onAction }) { return <div className="mm-state"><h1>{title}</h1><p>{text}</p>{action && <button type="button" onClick={onAction}>{action}</button>}</div>; }
export default MarketplaceProductPage;
