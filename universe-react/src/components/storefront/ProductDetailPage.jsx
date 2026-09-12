import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStorefront } from '../../hooks/useStorefront';
import { slugifyStoreName } from '../../lib/storeDomain';
import './product-detail.css';

function ProductDetailPage() {
  const { storeSlug, productSlug } = useParams();
  const navigate = useNavigate();
  const { data: store, isLoading, isError, error, refetch } = useStorefront(storeSlug);

  if (isLoading) {
    return <ProductDetailState title="Opening product" text="Loading product details from this storefront." />;
  }

  const product = store?.products.find((item) => slugifyStoreName(item.name) === productSlug);

  if (isError || !store) {
    return <ProductDetailState title="Storefront unavailable" text={error?.message || 'We could not load this private marketplace.'} action="Try again" onAction={() => refetch()} />;
  }

  if (!product) {
    return <ProductDetailState title="Product not found" text="This product may have been removed or the link may be outdated." action="Back to store" onAction={() => navigate(`/store/${store.slug}`)} />;
  }

  const productImages = product.images?.length ? product.images : [product.image];
  return <ProductDetails store={store} product={product} productImages={productImages} />;
}

function ProductDetails({ store, product, productImages }) {
  const [selectedImage, setSelectedImage] = useState(productImages[0]);

  return (
    <main className="pd-root">
      <div className="pd-shell">
        <Link className="pd-back" to={`/store/${store.slug}`}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to {store.name}
        </Link>

        <article className="pd-card">
          <div className="pd-image-panel">
            <img src={selectedImage} alt={product.imageAlt || product.name} className="pd-image" />
            {productImages.length > 1 && (
              <div className="pd-gallery" aria-label="Product images">
                {productImages.map((image, index) => (
                  <button
                    type="button"
                    className={selectedImage === image ? 'pd-thumbnail active' : 'pd-thumbnail'}
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="pd-content">
            <span className="pd-category">{product.categoryLabel}</span>
            <h1>{product.name}</h1>
            <div className="pd-rating">
              <span className="material-symbols-outlined sf-fill">star</span>
              <strong>{product.rating.toFixed(1)}</strong>
              <span>({product.reviews} reviews)</span>
            </div>
            <p className="pd-description">{product.description}</p>
            <div className="pd-price-row">
              <strong>{product.priceLabel}</strong>
              {product.oldPriceLabel && <span>{product.oldPriceLabel}</span>}
            </div>
            <div className="pd-stock">
              <span className="material-symbols-outlined">inventory_2</span>
              {product.stock == null ? 'Availability confirmed with seller' : `${product.stock} available`}
            </div>
            <div className="pd-actions">
              <button type="button" className="pd-add" onClick={() => window.alert(`${product.name} added to basket`)}>
                <span className="material-symbols-outlined">shopping_bag</span>
                Add to basket
              </button>
              <button type="button" className="pd-buy" onClick={() => window.alert(`Proceeding to checkout for ${product.name}`)}>
                Buy now
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            <p className="pd-seller">Sold by <strong>{store.name}</strong></p>
          </div>
        </article>
      </div>
    </main>
  );
}

function ProductDetailState({ title, text, action, onAction }) {
  return (
    <main className="pd-root">
      <div className="pd-state">
        <span className="material-symbols-outlined pd-state-icon">inventory_2</span>
        <h1>{title}</h1>
        <p>{text}</p>
        {action && <button type="button" className="pd-buy" onClick={onAction}>{action}</button>}
      </div>
    </main>
  );
}

export default ProductDetailPage;
