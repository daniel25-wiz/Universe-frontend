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

/**
 * Add New Product — port of add_new_product_blue.html
 * Rendered as a centered modal card on a tinted backdrop.
 * Fully wired to the API: name/SKU/description, category, publish-or-draft
 * status, and an image (file upload compressed in-browser, or a URL).
 */
function AddProductPage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const [serverError, setServerError] = useState(null);
  const [imageError, setImageError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '',
    category: '',
    status: 'active',
    imageUrl: '',
  });

  const goBack = () => navigate('/seller/marketplace');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch (err) {
      setImageError(err.message || 'Could not process that image.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError(null);
    createProduct.mutate(
      {
        name: form.name,
        sku: form.sku || undefined,
        description: form.description || undefined,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        stock: form.stock ? parseInt(form.stock, 10) : null,
        category: form.category || undefined,
        status: form.status,
        imageUrl: form.imageUrl || null,
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
    <main className="ap-backdrop">
      <div className="ap-modal">
        {/* Modal Header */}
        <header className="ap-header">
          <div className="ap-header-brand">
            <img src="/logo.png" alt="Global Store" className="ap-brand-logo" />
            <div>
              <h1 className="ap-title">Add New Product</h1>
              <p className="ap-sub">Fill in the details to list a new item in your Global Store.</p>
            </div>
          </div>
          <button className="ap-close" aria-label="Close modal" onClick={goBack}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Modal Body (Form) */}
        <div className="ap-body">
          <form className="ap-form" id="ap-form" onSubmit={handleSubmit}>
            {/* Server error */}
            {serverError && (
              <div className="ap-error">{serverError}</div>
            )}
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
                  <input
                    className="ap-input"
                    id="sku"
                    type="text"
                    placeholder="e.g. VASE-CER-001"
                    value={form.sku}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="category">Category</label>
                <select className="ap-input" id="category" value={form.category} onChange={handleChange}>
                  <option value="">Uncategorized</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="ap-textarea"
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
                    <span className="ap-prefix">$</span>
                    <input className="ap-input" id="price" type="number" placeholder="0.00" value={form.price} onChange={handleChange} />
                  </div>
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="salePrice">
                    Sale Price
                  </label>
                  <div className="ap-price-wrap">
                    <span className="ap-prefix">$</span>
                    <input className="ap-input" id="salePrice" type="number" placeholder="0.00" value={form.salePrice} onChange={handleChange} />
                  </div>
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="stock">
                    Initial Stock <span className="ap-required">*</span>
                  </label>
                  <input className="ap-input" id="stock" type="number" placeholder="0" value={form.stock} onChange={handleChange} />
                </div>
              </div>
            </section>

            {/* Visibility Section */}
            <section className="ap-section">
              <h2 className="ap-section-title">Visibility</h2>
              <div className="ap-grid-2">
                <label className="ap-field" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 0 }}>
                  <input type="radio" name="status" value="active" checked={form.status === 'active'} onChange={handleChange} />
                  <span className="ap-label" style={{ marginBottom: 0 }}>Publish now (visible in marketplace)</span>
                </label>
                <label className="ap-field" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 0 }}>
                  <input type="radio" name="status" value="draft" checked={form.status === 'draft'} onChange={handleChange} />
                  <span className="ap-label" style={{ marginBottom: 0 }}>Save as draft (only you can see it)</span>
                </label>
              </div>
            </section>

            {/* Media Section */}
            <section className="ap-section">
              <div className="ap-media-head">
                <h2 className="ap-section-title">Product Image</h2>
                <span className="ap-media-hint">Upload a file or paste an image URL</span>
              </div>

              {/* Upload Area (wired to a real file input, compressed in-browser) */}
              <label className="ap-upload" htmlFor="ap-image-input" style={{ cursor: 'pointer' }}>
                <div className="ap-upload-icon">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>
                <p className="ap-upload-text">
                  <strong>Click to upload</strong> or drag and drop
                </p>
                <p className="ap-upload-hint">PNG or JPG — compressed automatically in your browser</p>
                <input id="ap-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
              </label>
              {imageError && <p className="sd-field-error" style={{ marginTop: 8 }}>{imageError}</p>}

              <div className="ap-field" style={{ marginTop: 12 }}>
                <label className="ap-label" htmlFor="imageUrl">Image URL</label>
                <input className="ap-input" id="imageUrl" type="text" placeholder="https://…" value={form.imageUrl} onChange={handleChange} />
              </div>

              {/* Image Preview (live) */}
              {form.imageUrl ? (
                <div className="ap-preview">
                  <img src={form.imageUrl} alt="Product preview" />
                  <button
                    type="button"
                    className="ap-preview-remove"
                    aria-label="Remove image"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="ap-thumbs">
                  <div className="ap-thumb">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                </div>
              )}
            </section>
          </form>
        </div>

        {/* Modal Footer (Actions) */}
        <footer className="ap-footer">
          <button className="ap-btn-cancel" type="button" onClick={goBack} disabled={createProduct.isPending}>
            Cancel
          </button>
          <button className="ap-btn-save" type="submit" form="ap-form" disabled={createProduct.isPending}>
            <span className="material-symbols-outlined">save</span>
            {createProduct.isPending ? 'Saving...' : 'Save Product'}
          </button>
        </footer>
      </div>
    </main>
  );
}

export default AddProductPage;