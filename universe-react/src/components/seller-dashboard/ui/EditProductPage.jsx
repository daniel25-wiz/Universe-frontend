import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../../../hooks/useAuth';
import { useProduct, useUpdateProduct, useProducts } from '../../../hooks/useProducts';
import { MARKETPLACE_LISTING_LIMIT } from '../../../api/types';
import { uploadsApi } from '../../../api/services/uploads';
import '../seller-dashboard.css';
import './add-product.css';
import './widgets.css';
import MaterialIcon from '../../../components/ui/MaterialIcon';

const CATEGORIES = [
  'Fashion',
  'Electronics',
  'Gadgets',
  'Books',
  'Others',
];

const MAX_IMAGES = 5;

/**
 * Edit Product — same layout as Add New Product, prefilled from the product
 * record. Only the OWNER can edit: the API rejects non-owned ids with 404 and
 * the UI additionally checks ownership before submitting.
 */
function EditProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { data: user } = useCurrentUser();
  const { data: product, isLoading, error } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  // Other active products this seller already has, minus the one being edited,
  // so the UI can pre-empt the 2-listing cap before the API rejects the save.
  const { data: myProducts = [] } = useProducts(
    user ? { sellerId: user.id, status: 'active', page: 1, pageSize: 50 } : undefined,
  );
  const featuredActiveCount = myProducts.filter(
    (p) => p.id !== productId && p.featuredInMarketplace === true,
  ).length;
  const canAddListing = featuredActiveCount < MARKETPLACE_LISTING_LIMIT;

  const [serverError, setServerError] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '',
    category: '',
    condition: 'new',
    status: 'active',
    featuredInMarketplace: false,
    images: [],
  });
  const [loaded, setLoaded] = useState(false);

  // Prefill the form once the product arrives.
  useEffect(() => {
    if (product && !loaded) {
      setForm({
        name: product.name ?? '',
        sku: product.sku ?? '',
        description: product.description ?? '',
        price: product.price != null ? String(product.price) : '',
        salePrice: product.salePrice != null ? String(product.salePrice) : '',
        stock: product.stock != null ? String(product.stock) : '',
        category: product.category ?? '',
        // Unknown/legacy conditions fall back to the Add Product default.
        condition: product.condition === 'used' ? 'used' : 'new',
        status: product.status ?? 'active',
        featuredInMarketplace: product.featuredInMarketplace === true,
        images:
          product.images?.length > 0
            ? product.images
            : product.imageUrl
              ? [product.imageUrl]
              : [],
      });
      setLoaded(true);
    }
  }, [product, loaded]);

  const goBack = () => navigate('/seller/marketplace');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  };

  /** Condition radio ("Brand New" / "Fairly Used") shown on the marketplace badge. */
  const selectCondition = (condition) => {
    setForm((f) => ({ ...f, condition }));
  };

  /** Append raw image sources (data URLs from uploads, or pasted URLs). */
  const addImages = (urls) => {
    setImageError(null);
    setForm((f) => {
      const clean = urls.filter((u) => u && u.trim());
      if (!clean.length) return f;
      const remaining = MAX_IMAGES - f.images.length;
      return { ...f, images: [...f.images, ...clean.slice(0, remaining)] };
    });
  };

  /** First human-readable message from an ApiError-shaped upload rejection. */
  const imageErrorMessage = (error) => (
    (error?.fieldErrors && Object.values(error.fieldErrors)[0])
    || error?.message
    || 'Could not process that image.'
  );

  const handleImageFiles = async (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same file(s)
    if (!files.length) return;
    setImageError(null);
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setImageError(`You can add up to ${MAX_IMAGES} images — remove one to make room.`);
      return;
    }
    const selected = files.slice(0, remaining);
    // Report the cap instead of silently dropping the extra files.
    if (files.length > selected.length) {
      setImageError(`Only ${selected.length} of ${files.length} images were uploaded — ${MAX_IMAGES} is the maximum.`);
    }
    setImageUploading(true);
    try {
      // Uploads go through the documented endpoint (POST /uploads/images); the
      // mock adapter compresses locally and resolves with the same URL shape.
      // allSettled: one rejected file must not discard the ones that uploaded.
      const results = await Promise.allSettled(
        selected.map((file) => uploadsApi.uploadImage(file)),
      );
      const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.url);
      if (urls.length) addImages(urls);
      const failed = results.find((r) => r.status === 'rejected');
      if (failed) setImageError(imageErrorMessage(failed.reason));
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index) => {
    if (imageUploading) return;
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleImageUrlAdd = () => {
    if (imageUploading) return;
    const url = imageUrl.trim();
    if (!url) return;
    // Mirrors the API validator (products.mock.ts) so the form fails early.
    if (!/^(https?:\/\/|data:image\/)/i.test(url)) {
      setImageError('Image must be an http(s) URL or an uploaded image.');
      return;
    }
    if (form.images.length >= MAX_IMAGES) {
      setImageError(`You can add up to ${MAX_IMAGES} images — remove one to make room.`);
      return;
    }
    addImages([url]);
    setImageUrl('');
  };

  const handleImageUrlKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleImageUrlAdd();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError(null);

    if (user && product && product.sellerId !== user.id) {
      setServerError('You can only edit your own products.');
      return;
    }

    updateProduct.mutate(
      {
        id: productId,
        data: {
          name: form.name,
          sku: form.sku || undefined,
          description: form.description || undefined,
          price: parseFloat(form.price),
          salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
          stock: form.stock ? parseInt(form.stock, 10) : null,
          category: form.category || undefined,
          condition: form.condition,
          status: form.status,
          featuredInMarketplace: form.featuredInMarketplace,
          imageUrl: form.images[0] || null,
          images: form.images.length ? form.images : null,
        },
      },
      {
        onSuccess: goBack,
        onError: (err) => {
          if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
            setServerError(String(Object.values(err.fieldErrors)[0]));
          } else {
            setServerError(err.message || 'Failed to update product.');
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <main className="ap-page-shell">
        <div className="ap-card">
          <p style={{ padding: 24 }}>Loading product…</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="ap-page-shell">
        <div className="ap-card">
          <p style={{ padding: 24 }}>
            {error?.status === 404
              ? 'Product not found — it may have been deleted, or it belongs to another seller.'
              : error?.message || 'Could not load this product.'}
          </p>
          <div className="ap-action-bar">
            <button type="button" className="ap-clear-btn" onClick={goBack}>
              Back to workshop
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ap-page-shell">
      <div className="ap-card">
        {/* Modal Header */}
        <header className="ap-header">
          <div className="ap-header-brand">
            <img src="/logo.png" alt="Global Store" className="ap-brand-logo" />
            <div>
              <h1 className="ap-title">Edit Product</h1>
              <p className="ap-subtitle">Update the details of &ldquo;{product.name}&rdquo;.</p>
            </div>
          </div>
          <button className="ap-close" aria-label="Close modal" onClick={goBack}>
            <MaterialIcon name="close" />
          </button>
        </header>

        {/* Modal Body (Form) */}
        <div className="ap-body">
          <form className="ap-form" id="ap-form" onSubmit={handleSubmit}>
            {serverError && <div className="ap-error">{serverError}</div>}
            {/* Basic Info Section */}
            <section className="ap-section">
              <h2 className="ap-section-title">Basic Information</h2>
              <div className="ap-grid-2">
                <div className="ap-field">
                  <label className="ap-label" htmlFor="productName">
                    Product Name <span className="ap-required">*</span>
                  </label>
                  <input
                    className="ap-input"
                    id="productName"
                    type="text"
                    placeholder="e.g. Minimalist Ceramic Vase"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="sku">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input className="ap-input" id="sku" type="text" placeholder="e.g. ELEC-HP-001" value={form.sku} onChange={handleChange} />
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="category">Category</label>
                <select className="ap-input" id="category" value={form.category} onChange={handleChange}>
                  <option value="">Uncategorized</option>
                  {[...new Set(form.category && !CATEGORIES.includes(form.category) ? [form.category, ...CATEGORIES] : CATEGORIES)].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Same condition selector as the Add Product page — the choice is
                  what buyers see as the "New" / "Used" badge on the product page. */}
              <div className="ap-row ap-row-2 ap-brand-row">
                <button
                  type="button"
                  className={`ap-brand-option ${form.condition === 'new' ? 'selected' : ''}`}
                  onClick={() => selectCondition('new')}
                >
                  <span className="ap-option-box" aria-hidden="true" />
                  <span>Brand New</span>
                </button>
                <button
                  type="button"
                  className={`ap-brand-option ${form.condition === 'used' ? 'selected' : ''}`}
                  onClick={() => selectCondition('used')}
                >
                  <span className="ap-option-box" aria-hidden="true" />
                  <span>Fairly Used</span>
                </button>
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="description">Description</label>
                <textarea
                  className="ap-input"
                  id="description"
                  rows="4"
                  placeholder="Describe the product features, materials, and care instructions..."
                  value={form.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </section>

            {/* Pricing & Inventory Section */}
            <section className="ap-section">
              <h2 className="ap-section-title">Pricing &amp; Inventory</h2>
              <div className="ap-grid-3">
                <div className="ap-field">
                  <label className="ap-label" htmlFor="price">
                    Regular Price <span className="ap-required">*</span>
                  </label>
                  <div className="ap-price-wrap">
                    <span className="ap-prefix">₦</span>
                    <input className="ap-input" id="price" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={handleChange} />
                  </div>
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="salePrice">
                    Sale Price
                  </label>
                  <div className="ap-price-wrap">
                    <span className="ap-prefix">₦</span>
                    <input className="ap-input" id="salePrice" type="number" min="0" step="0.01" placeholder="0.00" value={form.salePrice} onChange={handleChange} />
                  </div>
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="stock">
                    Stock
                  </label>
                  <input className="ap-input" id="stock" type="number" min="0" step="1" placeholder="0" value={form.stock} onChange={handleChange} />
                </div>
              </div>
            </section>

            {/* Visibility Section */}
            <section className="ap-section">
              <h2 className="ap-section-title">Visibility</h2>
              <div className="ap-grid-2">
                <label className="ap-field" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 0 }}>
                  <input type="radio" name="status" value="active" checked={form.status === 'active'} onChange={handleChange} />
                  <span className="ap-label" style={{ marginBottom: 0 }}>Published (visible in marketplace)</span>
                </label>
                <label className="ap-field" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 0 }}>
                  <input type="radio" name="status" value="draft" checked={form.status === 'draft'} onChange={handleChange} />
                  <span className="ap-label" style={{ marginBottom: 0 }}>Draft (only you can see it)</span>
                </label>
              </div>
              {/* Public marketplace listing toggle (at most 2 per seller). */}
              <div className="ap-toggle-row" style={{ marginTop: 14 }}>
                <div className="ap-toggle-block">
                  <div className="ap-toggle-line">
                    <span className="ap-toggle-label">List on marketplace</span>
                    <button
                      type="button"
                      className={`ap-switch ${form.featuredInMarketplace ? 'on' : ''}`}
                      aria-label={form.featuredInMarketplace ? 'Remove from marketplace' : 'List on marketplace'}
                      disabled={!form.featuredInMarketplace && !canAddListing}
                      title={
                        !form.featuredInMarketplace && !canAddListing
                          ? `You already have ${MARKETPLACE_LISTING_LIMIT} products listed on the marketplace. Remove one first.`
                          : undefined
                      }
                      onClick={() => {
                        if (!form.featuredInMarketplace && !canAddListing) return;
                        setForm((f) => ({ ...f, featuredInMarketplace: !f.featuredInMarketplace }));
                      }}
                    >
                      <span className="ap-switch-thumb" />
                    </button>
                  </div>
                  <p style={{ fontSize: 11, marginTop: 4 }}>
                    {form.featuredInMarketplace
                      ? form.status === 'draft'
                        ? 'Listed on the marketplace as soon as you publish it.'
                        : 'This product appears in the public marketplace.'
                      : `List on the public marketplace (${featuredActiveCount}/${MARKETPLACE_LISTING_LIMIT} used)`}
                  </p>
                </div>
              </div>
            </section>

            {/* Media Section */}
            <section className="ap-section">
              <div className="ap-media-head">
                <h2 className="ap-section-title">Product Images</h2>
                <span className="ap-media-hint">
                  Up to {MAX_IMAGES} images · first image is the cover
                </span>
              </div>

              {/* Upload Area (multi-file, wired to a real file input, uploaded via the API) */}
              <label className="ap-upload" htmlFor="ap-image-input" style={{ cursor: imageUploading ? 'progress' : 'pointer' }}>
                <div className="ap-upload-icon">
                  <MaterialIcon name="cloud_upload" />
                </div>
                <p className="ap-upload-text">
                  <strong>Click to upload</strong> or drag and drop
                </p>
                <p className="ap-upload-hint">
                  {imageUploading
                    ? 'Uploading…'
                    : `PNG or JPG — compressed automatically in your browser (${form.images.length}/${MAX_IMAGES} added)`}
                </p>
                <input
                  id="ap-image-input"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={imageUploading}
                  style={{ display: 'none' }}
                  onChange={handleImageFiles}
                />
              </label>
              {imageError && <p className="sd-field-error" style={{ marginTop: 8 }}>{imageError}</p>}

              <div className="ap-image-url-row">
                <input
                  className="ap-input"
                  type="text"
                  placeholder="Paste an image URL and press Enter to add"
                  value={imageUrl}
                  disabled={imageUploading}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={handleImageUrlKeyDown}
                />
                <button
                  type="button"
                  className="ap-btn-add-url"
                  onClick={handleImageUrlAdd}
                  disabled={imageUploading || !imageUrl.trim()}
                >
                  Add
                </button>
              </div>

              {/* Image Thumbnails (live previews, remove + cover badge) */}
              {form.images.length > 0 ? (
                <div className="ap-thumbs">
                  {form.images.map((src, i) => (
                    <div className="ap-preview" key={`${i}-${src.slice(0, 24)}`}>
                      <img src={src} alt={`Product image ${i + 1}`} />
                      {i === 0 && <span className="ap-cover-badge">Cover</span>}
                      <button
                        type="button"
                        className="ap-preview-remove"
                        aria-label={`Remove image ${i + 1}`}
                        onClick={() => removeImage(i)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {form.images.length < MAX_IMAGES && (
                    <label className="ap-thumb-add" htmlFor="ap-image-input" style={{ cursor: 'pointer' }}>
                      <MaterialIcon name="add" />
                    </label>
                  )}
                </div>
              ) : (
                <div className="ap-thumbs">
                  <div className="ap-thumb">
                    <MaterialIcon name="image" />
                  </div>
                </div>
              )}
            </section>
          </form>
        </div>

        {/* Modal Footer (Actions) */}
        <footer className="ap-action-bar">
          <button className="ap-clear-btn" type="button" onClick={goBack} disabled={updateProduct.isPending}>
            Cancel
          </button>
          <button className="ap-submit-btn" type="submit" form="ap-form" disabled={updateProduct.isPending}>
            <MaterialIcon name="save" />
            {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </footer>
      </div>
    </main>
  );
}

export default EditProductPage;
