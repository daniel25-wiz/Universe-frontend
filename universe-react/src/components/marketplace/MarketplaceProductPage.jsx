import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import { Icon, MobileFrame, ProductArt, formatNaira, formatProductPrice } from './MobileMarketplaceShell';

function MarketplaceProductPage({ onAddToCart, savedProducts = [], onToggleSaved }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(productId);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(savedProducts.some((item) => item.id === productId));
  const [selectedImage, setSelectedImage] = useState(null);

  if (isLoading) return <ProductState title="Opening product" text="Loading product details..." />;
  if (isError || !product) return <ProductState title="Product not found" text="This product is no longer available." action="Back to marketplace" onAction={() => navigate('/marketplace')} />;

  const price = product.salePrice ?? product.price;
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
    for (let index = 0; index < quantity; index += 1) onAddToCart(product);
    setAdded(true);
  };

  return <MobileFrame active="search" cartCount={0} className="mm-product-page" showBottomNav={false}>
    <header className="mm-product-header"><button type="button" aria-label="Go back" onClick={() => navigate(-1)}><Icon name="arrowBack" /></button><span>{product.category || 'Audio & Tech'}</span><div><button type="button" aria-label="Share product"><Icon name="share" /></button><button type="button" aria-label="Add to wishlist" className={favorite ? 'favorite' : ''} onClick={toggleFavorite}><Icon name="heart" /></button></div></header>
    <main className="mm-scroll mm-product-scroll">
      <section className="mm-gallery"><div className="mm-gallery-art"><span className="mm-verified">Verified</span><span className="mm-condition">Mint Condition</span><button type="button" className="mm-zoom" aria-label="Zoom product">+</button>{activeImage ? <ProductArt product={{ ...product, imageUrl: activeImage }} variant="gallery" /> : <ProductArt product={product} variant="gallery" />}<span className="mm-image-fallback"><ProductArt product={product} variant="gallery" /></span><span className="mm-view-360">↻ 360° View</span></div>{productImages.length > 1 && <div className="mm-thumbnails" aria-label="Product images">{productImages.map((image, index) => <button type="button" key={`${image}-${index}`} className={activeImage === image ? 'active' : ''} onClick={() => setSelectedImage(image)} aria-label={`View product image ${index + 1}`}><img src={image} alt="" /></button>)}</div>}</section>
      <section className="mm-product-info"><div className="mm-product-info-top"><span>{product.seller || 'Apple Inc.'}</span><b>✓ Campus Authorized</b><em>★ {product.rating ?? '4.9'} <small>({product.reviews ?? 1248})</small></em></div><h1>{product.name}</h1><div className="mm-price-line"><strong>{formatProductPrice(product)}</strong>{product.price && product.salePrice && <del>{formatNaira(product.price)}</del>}<span>-40% OFF</span></div><div className="mm-pickup"><div><strong>⌖ Campus Pickup: <b>Main Gate Hub</b></strong><small>Ready in 25 mins · Free locker drop</small></div><span>In Stock</span></div></section>
      {product.description ? <section className="mm-overview"><h2>Product Overview</h2><p>{product.description}</p></section> : null}
    </main>
    <footer className="mm-buy-bar"><div className="mm-buy-row"><div className="mm-stepper"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button><span>{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button></div><button type="button" className="mm-buy" onClick={addProduct}><span><Icon name="cart" />{added ? 'Added' : 'Buy Now'}</span><b>{formatNaira(price * quantity)} <i>→</i></b></button></div></footer>
  </MobileFrame>;
}

function ProductState({ title, text, action, onAction }) { return <div className="mm-state"><h1>{title}</h1><p>{text}</p>{action && <button type="button" onClick={onAction}>{action}</button>}</div>; }
export default MarketplaceProductPage;
