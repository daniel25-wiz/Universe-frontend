import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProduct } from '../../../hooks/useProducts';
import { fileToCompressedDataUrl } from '../../../lib/image';
import '../seller-dashboard.css';
import './add-product.css';
import './widgets.css';

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home',
  'Beauty',
  'Sports',
  'Books',
  'Toys',
  'Other',
];

const MAX_IMAGES = 5;

/**
 * Add New Product — port of add_new_product_blue.html
 * Rendered as a centered modal card on a tinted backdrop.
 * Fully wired to the API: name/SKU/description, category, publish-or-draft
 * status, and up to 5 images (file uploads compressed in-browser, or URLs).
 * The first image is the cover (primary) image shown in marketplace cards.
 */
function AddProductPage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const [serverError, setServerError] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    discount: '',
    location: '',
    length: '',
    stock: '',
    category: '',
    status: 'active',
    soldOut: false,
    negotiable: false,
    brand: 'Brand New',
    images: [],
  });

  const goBack = () => navigate('/seller/marketplace');
  const imageSlots = Array.from({ length: MAX_IMAGES }, (_, index) => form.images[index] ?? null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  };

  const toggleField = (field) => {
    setForm((f) => ({ ...f, [field]: !f[field] }));
  };

  const selectBrand = (brand) => {
    setForm((f) => ({ ...f, brand }));
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

  const handleImageFiles = async (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same file(s)
    if (!files.length) return;
    setImageError(null);
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setImageError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    try {
      const results = await Promise.all(
        files.slice(0, remaining).map((file) => fileToCompressedDataUrl(file)),
      );
      addImages(results);
    } catch (err) {
      setImageError(err.message || 'Could not process that image.');
    }
  };

  const removeImage = (index) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleImageUrlAdd = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (form.images.length >= MAX_IMAGES) {
      setImageError(`You can add up to ${MAX_IMAGES} images.`);
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

    const resolvedName = (form.name || form.category || 'New Product').trim() || 'New Product';
    const resolvedPrice = Number.parseFloat(form.price || '0');

    createProduct.mutate(
      {
        name: resolvedName,
        sku: form.sku || undefined,
        description: form.description || undefined,
        price: Number.isFinite(resolvedPrice) ? resolvedPrice : 0,
        salePrice: form.discount ? parseFloat(form.discount) : null,
        stock: form.stock ? parseInt(form.stock, 10) : null,
        category: form.category || undefined,
        status: form.status,
        imageUrl: form.images[0] || null,
        images: form.images.length ? form.images : null,
      },
      {
        onSuccess: goBack,
        onError: (error) => {
          if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
            setServerError(String(Object.values(error.fieldErrors)[0]));
          } else {
            setServerError(error.message || 'Failed to create product.');
          }
        },
      },
    );
  };

  return (
    <main className="ap-page-shell">
      <div className="ap-card">
        <header className="ap-header">
          <h1 className="ap-title">Add New Product</h1>
          <p className="ap-subtitle">
            Fill in the details below to add a new product
            <br />
            to your store.
          </p>
        </header>

        <form className="ap-form" id="ap-form" onSubmit={handleSubmit}>
          {serverError && <div className="ap-error">{serverError}</div>}

          <section className="ap-section">
            <div className="ap-section-header">
              <h2>Product Images</h2>
              <p>Select 5 images of the product</p>
            </div>

            <div className="ap-upload-grid">
              {imageSlots.map((image, index) => (
                <button
                  key={`slot-${index}`}
                  type="button"
                  className={`ap-upload-box ${image ? 'has-image' : ''}`}
                  aria-label={image ? `Product image ${index + 1}` : 'Add product image'}
                  onClick={() => document.getElementById('ap-image-input')?.click()}
                >
                  {image ? (
                    <img src={image} alt={`Product ${index + 1}`} className="ap-upload-preview" />
                  ) : (
                    <span className="material-symbols-outlined">add</span>
                  )}
                </button>
              ))}
            </div>

            <input
              id="ap-image-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFiles}
              className="ap-hidden-input"
            />
          </section>

          <label className="ap-field ap-field-full ap-product-name-field">
            <span>Product Name</span>
            <input
              id="name"
              type="text"
              placeholder="Enter product name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <div className="ap-row ap-row-3">
            <label className="ap-field">
              <span>Price</span>
              <div className="ap-input-wrap">
                <span className="ap-prefix">₦</span>
                <input id="price" type="number" placeholder="Enter price" value={form.price} onChange={handleChange} />
              </div>
            </label>

            <label className="ap-field">
              <span>Discount Price (Optional)</span>
              <div className="ap-input-wrap">
                <span className="ap-prefix">₦</span>
                <input id="discount" type="number" placeholder="Enter discount price" value={form.discount} onChange={handleChange} />
              </div>
            </label>

            <label className="ap-field">
              <span>Location</span>
              <div className="ap-input-wrap location-wrap">
                <span className="material-symbols-outlined ap-loc-icon">location_on</span>
                <input id="location" type="text" placeholder="Enter location" value={form.location} onChange={handleChange} />
              </div>
            </label>
          </div>

          <div className="ap-toggle-row">
            <div className="ap-toggle-block">
              <div className="ap-toggle-line">
                <span className="ap-toggle-label">Sold Out</span>
                <button
                  type="button"
                  className={`ap-switch ${form.soldOut ? 'on' : ''}`}
                  aria-label="Toggle sold out"
                  onClick={() => toggleField('soldOut')}
                >
                  <span className="ap-switch-thumb" />
                </button>
              </div>
              <p>Do you want your product unavailable</p>
            </div>

            <div className="ap-toggle-block">
              <div className="ap-toggle-line">
                <span className="ap-toggle-label">Negotiate</span>
                <button
                  type="button"
                  className={`ap-switch ${form.negotiable ? 'on' : ''}`}
                  aria-label="Toggle negotiate"
                  onClick={() => toggleField('negotiable')}
                >
                  <span className="ap-switch-thumb" />
                </button>
              </div>
              <p>Do you want your product negotiable</p>
            </div>
          </div>

          <div className="ap-row ap-row-2 ap-brand-row">
            <button
              type="button"
              className={`ap-brand-option ${form.brand === 'Brand New' ? 'selected' : ''}`}
              onClick={() => selectBrand('Brand New')}
            >
              <span className="ap-option-box" aria-hidden="true" />
              <span>Brand New</span>
            </button>

            <button
              type="button"
              className={`ap-brand-option ${form.brand === 'Fairly Used' ? 'selected' : ''}`}
              onClick={() => selectBrand('Fairly Used')}
            >
              <span className="ap-option-box" aria-hidden="true" />
              <span>Fairly Used</span>
            </button>
          </div>

          <label className="ap-field ap-field-full">
            <span>Description</span>
            <textarea
              id="description"
              rows="4"
              placeholder="Write a detailed description..."
              value={form.description}
              onChange={handleChange}
            />
          </label>

          <label className="ap-field ap-field-full">
            <span>Length of roll / Use</span>
            <input
              id="length"
              type="text"
              placeholder="Enter length of roll or use"
              value={form.length}
              onChange={handleChange}
            />
          </label>

          <div className="ap-location-box ap-field-full">
            <span className="material-symbols-outlined">location_on</span>
            <span>Motion Ground At DHL Building</span>
            <span className="material-symbols-outlined ap-lock-icon">lock</span>
          </div>

          <label className="ap-field ap-field-full">
            <span>Category</span>
            <div className="ap-select-wrap">
              <span className="material-symbols-outlined ap-category-icon">category</span>
              <select id="category" value={form.category} onChange={handleChange}>
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <span className="material-symbols-outlined ap-caret">expand_more</span>
            </div>
          </label>

          <button type="button" className="ap-add-variant">
            <span className="material-symbols-outlined">add</span>
            Add Variant
          </button>
        </form>

        <div className="ap-action-bar">
          <button type="button" className="ap-clear-btn" onClick={goBack}>
            <span className="material-symbols-outlined">delete</span>
            Clear Product
          </button>
          <button type="submit" form="ap-form" className="ap-submit-btn">
            SET UP
          </button>
        </div>
      </div>
    </main>
  );
}

export default AddProductPage;