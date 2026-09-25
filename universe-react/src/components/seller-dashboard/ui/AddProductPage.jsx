import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProduct, useProducts } from '../../../hooks/useProducts';
import { useCurrentUser } from '../../../hooks/useAuth';
import { DEFAULT_DELIVERY_LOCATION, MARKETPLACE_LISTING_LIMIT, WORKSHOP_PRODUCT_LIMIT } from '../../../api/types';
import { uploadsApi } from '../../../api/services/uploads';
import { MAX_SOURCE_IMAGE_BYTES, fileToProductImageFile } from '../../../lib/image';
import '../seller-dashboard.css';
import './add-product.css';
import './widgets.css';
import MaterialIcon from '../../../components/ui/MaterialIcon';

/**
 * Represents an image in the form: either a preview (local File not yet
 * processed) or a final uploaded URL string.
 */
const IMAGE_TYPE = {
  PREVIEW: 'preview', // Local File, shown via URL.createObjectURL
  UPLOADED: 'uploaded', // Already uploaded, stored as URL string
};

const CATEGORIES = [
  'Fashion',
  'Electronics',
  'Gadgets',
  'Books',
  'Others',
];

const MAX_IMAGES = 5;

/** Caps mirrored by the API validator (see products.mock.ts). */
const MAX_VARIANTS = 10;
const MAX_VARIANT_VALUES = 20;

/** A blank variant option group ("Size" → "Small"), used for a fresh row. */
function createVariant() {
  return { name: '', values: [''] };
}

/**
 * Add New Product — port of add_new_product_blue.html
 * Rendered as a centered modal card on a tinted backdrop.
 * Fully wired to the API: name/SKU/description, category, publish-or-draft
 * status, up to 5 images, and variant option groups (e.g. Size → Small /
 * Medium) that buyers pick from on the product pages of the public
 * marketplace and the seller's storefront.
 *
 * DELIVERY LOCATION — a locked platform constant, never a seller input: every
 * product is delivered from DEFAULT_DELIVERY_LOCATION ("Motion Ground At DHL
 * Building") and the public marketplace shows that hub on the product card and
 * the product page. The old free-text "Location" field was removed.
 *
 * IMAGE PIPELINE — deferred to submit:
 *  1. Selecting an image creates a local preview only (URL.createObjectURL).
 *     No compression or upload happens yet.
 *  2. Seller fills in the rest of the form fields.
 *  3. Clicking "SET UP" triggers compression and upload behind a full-screen
 *     "Setting up product..." loading state that blocks interaction.
 *  4. Each image File is compressed client-side to a single ~70KB WebP file
 *     (discarding the original). This one file is used for BOTH product card
 *     and detail view — no separate card/detail or HD/zoom variants.
 *  5. Compressed files are uploaded via POST /uploads/images.
 *  6. On success: loading dismisses, success shown, form resets/redirects.
 *  7. On failure: loading dismisses, error shown, form data intact for retry.
 *
 * The first image is the cover (primary) image shown in marketplace cards.
 */
function AddProductPage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { data: user } = useCurrentUser();
  // ALL products this seller owns (active + drafts) — needed for BOTH caps:
  // the 20-product workshop cap and the 2-slot featured-listing cap.
  // While the user is still loading we pass a non-existent seller id rather
  // than `undefined`: an unfiltered query IS the public catalog, which would
  // count OTHER sellers' products and wrongly lock the form.
  const { data: myProducts = [] } = useProducts(
    user ? { sellerId: user.id, page: 1, pageSize: 50 } : { sellerId: '__loading__' },
  );
    const featuredActiveCount = myProducts.filter(
    (p) => p.featuredInMarketplace === true,
  ).length;
  const canAddListing = featuredActiveCount < MARKETPLACE_LISTING_LIMIT;
  // Workshop product cap — a seller may hold at most WORKSHOP_PRODUCT_LIMIT
  // products (active + drafts combined). The API enforces the same number.
  const workshopCount = myProducts.length;
  const canAddProduct = workshopCount < WORKSHOP_PRODUCT_LIMIT;

    // A newly loaded quota can invalidate the default-on listing choice.
    // Unlist this new product immediately so the form cannot submit a listing
    // after the seller has filled every marketplace slot.
    useEffect(() => {
      if (!canAddListing) {
        setForm((current) => (
          current.featuredInMarketplace
            ? { ...current, featuredInMarketplace: false }
            : current
        ));
      }
    }, [canAddListing]);

  const [serverError, setServerError] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Slot the NEXT file selection targets: `null` appends into the free slots,
  // a number replaces that image. Captured when the hidden input is opened.
  const [replaceIndex, setReplaceIndex] = useState(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    discount: '',
    length: '',
    stock: '',
    category: '',
    status: 'active',
    featuredInMarketplace: true,
    soldOut: false,
    brand: 'Brand New',
    // Array of image entries: { type: 'preview', file: File } or { type: 'uploaded', url: string }
    images: [],
    variants: [createVariant()],
  });

  const goBack = () => navigate('/seller/marketplace');
  const imageSlots = Array.from({ length: MAX_IMAGES }, (_, index) => form.images[index] ?? null);

  // Clean up object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      // Revoke all object URLs on unmount
      form.images.forEach((imageEntry) => {
        if (imageEntry?.type === IMAGE_TYPE.PREVIEW && imageEntry.file) {
          const objectUrl = URL.createObjectURL(imageEntry.file);
          URL.revokeObjectURL(objectUrl);
        }
      });
    };
  }, [form.images]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  };

  const toggleField = (field) => {
    setForm((f) => ({ ...f, [field]: !f[field] }));
  };

  const selectBrand = (brand) => {
    setForm((f) => ({ ...f, brand }));
  };

  /* ------------------------------- Variants ------------------------------- */

  const updateVariantName = (variantIndex, name) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((variant, index) => (index === variantIndex ? { ...variant, name } : variant)),
    }));
  };

  const updateVariantValue = (variantIndex, valueIndex, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((variant, index) => {
        if (index !== variantIndex) return variant;
        // Defensive: typing into a row that has no value slot yet appends one.
        const values = variant.values.length > valueIndex
          ? variant.values.map((v, i) => (i === valueIndex ? value : v))
          : [...variant.values, value];
        return { ...variant, values };
      }),
    }));
  };

  /** Append another selectable value to an existing variant name. */
  const addVariantValue = (variantIndex) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((variant, index) => (
        index === variantIndex && variant.values.length < MAX_VARIANT_VALUES
          ? { ...variant, values: [...variant.values, ''] }
          : variant
      )),
    }));
  };

  const removeVariantValue = (variantIndex, valueIndex) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((variant, index) => (
        index === variantIndex
          ? { ...variant, values: variant.values.filter((_, i) => i !== valueIndex) }
          : variant
      )),
    }));
  };

  const addVariant = () => {
    setForm((f) => (f.variants.length >= MAX_VARIANTS ? f : { ...f, variants: [...f.variants, createVariant()] }));
  };

  const removeVariant = (variantIndex) => {
    setForm((f) => (f.variants.length <= 1 ? f : { ...f, variants: f.variants.filter((_, i) => i !== variantIndex) }));
  };

  /**
   * Trimmed variant groups for the API. Blank rows are dropped, so a single
   * untouched "Variant Name / Variant Value" pair simply means "no variants".
   */
  const collectVariants = () => form.variants
    .map((variant) => ({
      name: variant.name.trim(),
      values: variant.values.map((value) => value.trim()).filter(Boolean),
    }))
    .filter((variant) => variant.name && variant.values.length > 0);

  /**
   * A row is only valid when it has BOTH a name and at least one value, so a
   * half-filled row blocks the submit instead of silently losing what was typed.
   */
  const hasHalfFilledVariant = () => form.variants.some((variant) => (
    Boolean(variant.name.trim()) !== variant.values.some((value) => value.trim())
  ));

  /* -------------------------------- Images -------------------------------- */

  /**
   * Helper to get a displayable URL for an image entry.
   * - For preview entries (File): create an object URL
   * - For uploaded entries (string): return the URL directly
   */
  const getImageDisplayUrl = (imageEntry) => {
    if (!imageEntry) return null;
    if (imageEntry.type === IMAGE_TYPE.PREVIEW) {
      return URL.createObjectURL(imageEntry.file);
    }
    return imageEntry.url;
  };

  /** Append image entries (preview Files or already-uploaded URLs). */
  const addImages = (entries) => {
    setImageError(null);
    setForm((f) => {
      if (!entries.length) return f;
      const remaining = MAX_IMAGES - f.images.length;
      return { ...f, images: [...f.images, ...entries.slice(0, remaining)] };
    });
  };

  /**
   * Open the hidden file picker. An EMPTY slot appends (multi-select); a FILLED
   * slot replaces that one image (single file). `multiple` is set imperatively
   * because the picker reads it the moment it opens — before React could
   * re-render from the `replaceIndex` state change.
   */
  const openImagePicker = (index) => {
    const input = document.getElementById('ap-image-input');
    if (!input || isSubmitting) return;
    setImageError(null);
    setReplaceIndex(index);
    input.multiple = index === null;
    input.click();
  };

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same file(s)
    const target = replaceIndex;
    setReplaceIndex(null);
    if (!files.length) return;

    const isReplace = target !== null;
    const free = MAX_IMAGES - form.images.length;
    const selected = isReplace ? files.slice(0, 1) : files.slice(0, Math.max(0, free));
    
    if (!selected.length) {
      setImageError(`You can add up to ${MAX_IMAGES} images — remove one to make room.`);
      return;
    }
    
    // Validate file sizes
    const oversized = selected.filter((file) => file.size > MAX_SOURCE_IMAGE_BYTES);
    if (oversized.length > 0) {
      setImageError(`Image must be ${Math.round(MAX_SOURCE_IMAGE_BYTES / 1024 / 1024)}MB or smaller.`);
      return;
    }

    // Report the cap instead of silently dropping extra files
    if (files.length > selected.length) {
      setImageError(`Only ${selected.length} of ${files.length} images were added — ${MAX_IMAGES} is the maximum.`);
    }

    // Create preview entries
    const previewEntries = selected.map((file) => ({
      type: IMAGE_TYPE.PREVIEW,
      file,
    }));

    if (isReplace) {
      setForm((f) => {
        if (target >= f.images.length) return f;
        const images = [...f.images];
        images[target] = previewEntries[0];
        return { ...f, images };
      });
    } else {
      addImages(previewEntries);
    }
  };

  const removeImage = (index) => {
    if (isSubmitting) return;
    setImageError(null);
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Workshop product cap — block submission before hitting the API.
    if (!canAddProduct) {
      setServerError(`Your workshop is full — you can store up to ${WORKSHOP_PRODUCT_LIMIT} products. Remove one first.`);
      return;
    }

    if (hasHalfFilledVariant()) {
      setServerError('Every variant needs a name and at least one value — for example "size" and "small".');
      return;
    }

    // Show full-screen loading state
    setIsSubmitting(true);

    try {
      // Process images: compress previews and upload them
      const processedImageUrls = [];
      
      for (const imageEntry of form.images) {
        if (imageEntry.type === IMAGE_TYPE.UPLOADED) {
          // Already an uploaded URL, use it directly
          processedImageUrls.push(imageEntry.url);
        } else if (imageEntry.type === IMAGE_TYPE.PREVIEW) {
          // Compress the File to ~70KB WebP, then upload
          const compressedFile = await fileToProductImageFile(imageEntry.file);
          const uploaded = await uploadsApi.uploadImage(compressedFile);
          processedImageUrls.push(uploaded.url);
        }
      }

      const resolvedName = (form.name || form.category || 'New Product').trim() || 'New Product';
      const resolvedPrice = Number.parseFloat(form.price || '0');
      const variants = collectVariants();

      await createProduct.mutateAsync({
        name: resolvedName,
        sku: form.sku || undefined,
        description: form.description || undefined,
        price: Number.isFinite(resolvedPrice) ? resolvedPrice : 0,
        salePrice: form.discount ? parseFloat(form.discount) : null,
        stock: form.stock ? parseInt(form.stock, 10) : null,
        category: form.category || undefined,
        // Delivery location is locked to the platform default hub — there is no
        // seller input for it on this page, and the public marketplace shows it.
        deliveryLocation: DEFAULT_DELIVERY_LOCATION,
        status: form.status,
        featuredInMarketplace: form.featuredInMarketplace,
        imageUrl: processedImageUrls[0] || null,
        images: processedImageUrls.length ? processedImageUrls : null,
        variants: variants.length ? variants : null,
        // Persist the seller's condition choice so the marketplace badge can
        // show "New" / "Used" instead of a hardcoded state.
        condition: form.brand === 'Fairly Used' ? 'used' : 'new',
      });

      // Success: dismiss loading, navigate back
      setIsSubmitting(false);
      goBack();
    } catch (error) {
      // Failure: dismiss loading, show error, keep form data intact
      setIsSubmitting(false);
      
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setServerError(String(Object.values(error.fieldErrors)[0]));
      } else {
        setServerError(error?.message || 'Failed to create product. Please try again.');
      }
    }
  };

  return (
    <main className="ap-page-shell">
      {/* Full-screen loading overlay during submit */}
      {isSubmitting && (
        <div className="ap-loading-overlay">
          <div className="ap-loading-content">
            <MaterialIcon name="cloud_upload" className="ap-loading-icon" />
            <p className="ap-loading-text">Setting up product...</p>
          </div>
        </div>
      )}

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
          {!canAddProduct && (
            <div className="ap-error" role="alert">
              Your workshop is full ({workshopCount}/{WORKSHOP_PRODUCT_LIMIT} products). Remove a product before adding a new one.
            </div>
          )}

          <section className="ap-section">
            <div className="ap-section-header">
              <h2>Product Images</h2>
              <p>
                Select up to {MAX_IMAGES} images of the product — the first image is the cover.
                Use Replace on an image to swap it for another.
              </p>
            </div>

            <div className="ap-upload-grid">
              {imageSlots.map((imageEntry, index) => {
                const displayUrl = imageEntry ? getImageDisplayUrl(imageEntry) : null;
                return (
                  <div
                    key={`slot-${index}`}
                    className="ap-upload-slot"
                  >
                    <button
                      type="button"
                      className={`ap-upload-box ${displayUrl ? 'has-image' : ''}`}
                      aria-label={displayUrl ? `Replace product image ${index + 1}` : `Add product image ${index + 1}`}
                      disabled={isSubmitting}
                      onClick={() => openImagePicker(displayUrl ? index : null)}
                    >
                      {displayUrl ? (
                        <img src={displayUrl} alt={`Product ${index + 1}`} className="ap-upload-preview" />
                      ) : (
                        <MaterialIcon name="add" />
                      )}
                    </button>

                    {displayUrl && index === 0 && <span className="ap-cover-badge">Cover</span>}

                    {/*
                      Transparent overlay so a mistaken pick can be swapped for
                      another image without removing it first.
                    */}
                    {displayUrl && (
                      <button
                        type="button"
                        className="ap-upload-replace"
                        aria-label={`Replace product image ${index + 1}`}
                        disabled={isSubmitting}
                        onClick={() => openImagePicker(index)}
                      >
                        <MaterialIcon name="sync" />
                        Replace
                      </button>
                    )}

                    {displayUrl && (
                      <button
                        type="button"
                        className="ap-upload-remove"
                        aria-label={`Remove image ${index + 1}`}
                        disabled={isSubmitting}
                        onClick={() => removeImage(index)}
                      >
                        <MaterialIcon name="close" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {imageError && (
              <p className="sd-field-error" role="alert" style={{ marginTop: 8 }}>{imageError}</p>
            )}

            <input
              id="ap-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageFiles}
              className="ap-hidden-input"
            />
          </section>

          <label className="ap-field ap-field-full ap-product-name-field">
            <span>Product Name</span>
            <div className="ap-input-wrap ap-no-icon">
              <input
                id="name"
                type="text"
                placeholder="Enter product name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <div className="ap-row ap-row-2">
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
          </div>

          <div className="ap-row ap-row-2">
            <label className="ap-field">
              <span>Amount of Goods in Stock</span>
              <div className="ap-input-wrap">
                <MaterialIcon name="inventory_2" className="ap-loc-icon" />
                <input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter amount in stock"
                  value={form.stock}
                  onChange={handleChange}
                />
              </div>
            </label>
          </div>

          <div className="ap-toggle-row">
            <div className="ap-toggle-block ap-toggle-block--wide">
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

            <div className="ap-toggle-block ap-toggle-block--wide">
              <div className="ap-toggle-line">
                <span className="ap-toggle-label">Marketplace</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.featuredInMarketplace}
                  className={`ap-switch ${form.featuredInMarketplace ? 'on' : ''}`}
                  aria-label={
                    form.featuredInMarketplace
                      ? 'Remove this product from the public marketplace'
                      : 'List this product on the public marketplace'
                  }
                  disabled={!canAddListing}
                  onClick={() => {
                    if (!canAddListing) return;
                    toggleField('featuredInMarketplace');
                  }}
                >
                  <span className="ap-switch-thumb" />
                </button>
              </div>
              {/*
                This switch STARTS ON, so tapping it turns the listing OFF.
                The sentence therefore describes the resulting state instead of
                naming an action ("Add to public marketplace") — otherwise a
                seller "switching marketplace on" silently unlisted the product.
              */}
              <p className={`ap-listing-state ${form.featuredInMarketplace ? 'is-listed' : ''}`}>
                {form.featuredInMarketplace ? (
                  <>
                    <strong>Listed.</strong> Buyers can find it under Discover in the public marketplace.
                  </>
                ) : (
                  <>
                    <strong>Not listed.</strong> It only shows on your shop page — switch this on to list it
                    {' '}({featuredActiveCount}/{MARKETPLACE_LISTING_LIMIT} slots used).
                  </>
                )}
              </p>
              {!form.featuredInMarketplace && !canAddListing && (
                <p className="ap-listing-cap">
                  <MaterialIcon name="error" />
                  All {MARKETPLACE_LISTING_LIMIT} marketplace slots are in use. Remove a listing in My Workshop first.
                </p>
              )}
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
            <div className="ap-input-wrap ap-no-icon">
              <input
                id="length"
                type="text"
                placeholder="Enter length of roll or use"
                value={form.length}
                onChange={handleChange}
              />
            </div>
          </label>

          {/*
            Locked delivery location — the platform ships every product from the
            same campus hub, so this is not a seller input. It is sent with the
            product and rendered on the public marketplace (card + product page).
          */}
          <div className="ap-location-box ap-field-full">
            <MaterialIcon name="location_on" />
            <div className="ap-location-copy">
              <span>{DEFAULT_DELIVERY_LOCATION}</span>
              <small>Delivery location for this product — buyers see it on the marketplace</small>
            </div>
            <MaterialIcon name="lock" className="ap-lock-icon" />
          </div>

          <label className="ap-field ap-field-full">
            <span>Category</span>
            <div className="ap-select-wrap">
              <MaterialIcon name="category" className="ap-category-icon" />
              <select id="category" value={form.category} onChange={handleChange}>
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <MaterialIcon name="expand_more" className="ap-caret" />
            </div>
          </label>

          <section className="ap-section ap-variants">
            <div className="ap-section-header">
              <h2>Variants</h2>
              <p>
                Add options like size, colour or edition so buyers can pick the exact version they want.
                Leave the name and value empty if the product comes in one version.
              </p>
            </div>

            {form.variants.map((variant, variantIndex) => (
              <div className="ap-variant-block" key={`variant-${variantIndex}`}>
                <div className="ap-variant-head">
                  <span className="ap-variant-index">Variant {variantIndex + 1}</span>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      className="ap-variant-remove"
                      onClick={() => removeVariant(variantIndex)}
                    >
                      <MaterialIcon name="delete" />
                      Remove variant
                    </button>
                  )}
                </div>

                <div className="ap-row ap-row-2 ap-variant-fields">
                  <label className="ap-field">
                    <span>Variant Name</span>
                    <div className="ap-input-wrap ap-no-icon">
                      <input
                        type="text"
                        placeholder="size"
                        value={variant.name}
                        onChange={(e) => updateVariantName(variantIndex, e.target.value)}
                      />
                    </div>
                  </label>

                  <label className="ap-field">
                    <span>Variant Value</span>
                    <div className="ap-input-wrap ap-variant-value-wrap">
                      <input
                        type="text"
                        placeholder="small"
                        value={variant.values[0] ?? ''}
                        onChange={(e) => updateVariantValue(variantIndex, 0, e.target.value)}
                      />
                    </div>
                  </label>
                </div>

                {variant.values.length > 1 && (
                  <div className="ap-variant-extra-values">
                    {variant.values.slice(1).map((value, offset) => {
                      const valueIndex = offset + 1;
                      return (
                        <label className="ap-field" key={`variant-${variantIndex}-value-${valueIndex}`}>
                          <span>Variant Value</span>
                          <div className="ap-input-wrap ap-variant-value-wrap">
                            <input
                              type="text"
                              placeholder="small"
                              value={value}
                              onChange={(e) => updateVariantValue(variantIndex, valueIndex, e.target.value)}
                            />
                            <button
                              type="button"
                              className="ap-variant-value-remove"
                              aria-label={`Remove value ${valueIndex + 1} from variant ${variantIndex + 1}`}
                              onClick={() => removeVariantValue(variantIndex, valueIndex)}
                            >
                              ×
                            </button>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  className="ap-variant-add-value"
                  onClick={() => addVariantValue(variantIndex)}
                  disabled={variant.values.length >= MAX_VARIANT_VALUES}
                >
                  <MaterialIcon name="add" />
                  Add another value
                </button>
              </div>
            ))}

            <button
              type="button"
              className="ap-variant-add"
              onClick={addVariant}
              disabled={form.variants.length >= MAX_VARIANTS}
            >
              <MaterialIcon name="add" />
              Add another variant
            </button>
          </section>
        </form>

        <div className="ap-action-bar">
          <button type="button" className="ap-clear-btn" onClick={goBack}>
            <MaterialIcon name="delete" />
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