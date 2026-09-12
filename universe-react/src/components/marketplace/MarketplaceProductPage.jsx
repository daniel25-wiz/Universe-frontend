import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import { formatMoney } from '../../lib/user';
import './marketplace-commerce.css';

function MarketplaceProductPage({ onAddToCart }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(productId);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  if (isLoading) return <MarketplaceState title="Loading product" text="Fetching product details..." />;
  if (isError || !product) {
    return <MarketplaceState title="Product not found" text="This product is no longer available." action="Back to marketplace" onAction={() => navigate('/marketplace')} />;
  }

  const price = product.salePrice ?? product.price;
  const productImages = product.images?.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const activeImage = selectedImage && productImages.includes(selectedImage)
    ? selectedImage
    : productImages[0];
  const handleAddToCart = () => {
    onAddToCart(product);
    setAdded(true);
  };

  return (
    <div className="mc-root">
      <header className="mc-header">
        <Link className="mc-brand" to="/marketplace">MarketPlace</Link>
        <Link className="mc-cart-link" to="/cart">
          <span className="material-symbols-outlined">shopping_cart</span>
          View cart
        </Link>
      </header>
      <main className="mc-main">
        <Link className="mc-back" to="/marketplace">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to marketplace
        </Link>
        <article className="mc-product">
          <div className="mc-product-gallery">
            <div className="mc-product-image-wrap">
            {activeImage ? (
              <img className="mc-product-image" src={activeImage} alt={product.imageAlt || product.name} />
            ) : (
              <div className="mc-product-placeholder">No image available</div>
            )}
            </div>
            {productImages.length > 1 && (
              <div className="mc-thumbnails" aria-label="Product images">
                {productImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={`mc-thumbnail${activeImage === image ? ' active' : ''}`}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={activeImage === image}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mc-product-content">
            <span className="mc-eyebrow">{product.category || 'Marketplace product'}</span>
            <h1>{product.name}</h1>
            <div className="mc-rating">
              <span className="material-symbols-outlined mc-star">star</span>
              <strong>{product.rating?.toFixed(1) || '0.0'}</strong>
              <span>({product.reviews || 0} reviews)</span>
            </div>
            <p className="mc-description">{product.description || 'A quality product from a verified marketplace seller.'}</p>
            <div className="mc-price">{formatMoney(price)}</div>
            {product.stock != null && <p className="mc-stock">{product.stock} available</p>}
            <div className="mc-actions">
              <button type="button" className="mc-primary-button" onClick={handleAddToCart}>
                <span className="material-symbols-outlined">add_shopping_cart</span>
                {added ? 'Added to cart' : 'Add to cart'}
              </button>
              <Link className="mc-secondary-button" to="/cart">View cart</Link>
            </div>
            {added && <p className="mc-success" role="status">{product.name} is in your cart.</p>}
            {product.seller && <p className="mc-seller">Sold by <strong>{product.seller}</strong></p>}
          </div>
        </article>
      </main>
    </div>
  );
}

function MarketplaceState({ title, text, action, onAction }) {
  return (
    <div className="mc-root">
      <main className="mc-state">
        <span className="material-symbols-outlined">inventory_2</span>
        <h1>{title}</h1>
        <p>{text}</p>
        {action && <button type="button" className="mc-primary-button" onClick={onAction}>{action}</button>}
      </main>
    </div>
  );
}

export default MarketplaceProductPage;
