import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStorefront } from '../../hooks/useStorefront';
import { slugifyStoreName } from '../../lib/storeDomain';
import './product-detail.css';
import MaterialIcon from '../../components/ui/MaterialIcon';

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
  // Map of variant name → chosen value. Values default to the first option so a
  // buyer can add to basket without touching the selectors.
  const [selectedVariants, setSelectedVariants] = useState({});

  // Variant option groups entered by the seller on the Add Product page.
  const variants = (product.variants ?? []).filter(
    (variant) => variant?.name && Array.isArray(variant.values) && variant.values.length > 0,
  );
  const selectedValue = (variant) => selectedVariants[variant.name] ?? variant.values[0];
  const variantLabel = variants
    .map((variant) => `${variant.name}: ${selectedValue(variant)}`)
    .join(' · ');

  return (
    <main className="pd-root">
      <div className="pd-shell">
        <Link className="pd-back" to={`/store/${store.slug}`}>
          <MaterialIcon name="arrow_back" />
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
              {product.rating != null ? (
                <>
                  <MaterialIcon name="star" fill />
                  <strong>{product.rating.toFixed(1)}</strong>
                  <span>{`(${product.reviews ?? 0} reviews)`}</span>
                </>
              ) : (
                <span>No reviews yet</span>
              )}
            </div>
            {product.description && <p className="pd-description">{product.description}</p>}
            <div className="pd-price-row">
              <strong>{product.priceLabel ?? '—'}</strong>
              {product.oldPriceLabel && <span>{product.oldPriceLabel}</span>}
            </div>
            <div className="pd-stock">
              <MaterialIcon name="inventory_2" />
              {product.stock == null ? 'Availability confirmed with seller' : `${product.stock} available`}
            </div>
            {variants.length > 0 && (
              <div className="pd-variants" aria-label="Choose product options">
                {variants.map((variant) => {
                  const current = selectedValue(variant);
                  return (
                    <div className="pd-variant" key={variant.name}>
                      <span className="pd-variant-label">
                        {variant.name}: <strong>{current}</strong>
                      </span>
                      <div className="pd-variant-values">
                        {variant.values.map((value) => (
                          <button
                            type="button"
                            key={value}
                            className={value === current ? 'pd-variant-value active' : 'pd-variant-value'}
                            aria-pressed={value === current}
                            onClick={() => setSelectedVariants((previous) => ({ ...previous, [variant.name]: value }))}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="pd-actions">
              <button type="button" className="pd-add" onClick={() => window.alert(`${product.name}${variantLabel ? ` (${variantLabel})` : ''} added to basket`)}>
                <MaterialIcon name="shopping_bag" />
                Add to basket
              </button>
              <button type="button" className="pd-buy" onClick={() => window.alert(`Proceeding to checkout for ${product.name}${variantLabel ? ` (${variantLabel})` : ''}`)}>
                Buy now
                <MaterialIcon name="arrow_forward" />
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
        <MaterialIcon name="inventory_2" className="pd-state-icon" />
        <h1>{title}</h1>
        <p>{text}</p>
        {action && <button type="button" className="pd-buy" onClick={onAction}>{action}</button>}
      </div>
    </main>
  );
}

export default ProductDetailPage;
