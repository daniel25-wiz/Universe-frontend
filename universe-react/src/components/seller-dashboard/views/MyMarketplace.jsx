import { uploadsApi } from '../../../api/services/uploads';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import ConfirmDialog from '../ui/ConfirmDialog';
import '../seller-dashboard.css';
import './my-marketplace.css';
import './my-workshop.css';
import '../ui/widgets.css';
import { useCurrentUser } from '../../../hooks/useAuth';
import { useSellerProfile, useUpdateSellerProfile } from '../../../hooks/useUser';
import { useDeleteProduct, useProducts, useUpdateProduct } from '../../../hooks/useProducts';
import { getUserInitials, getFirstName, formatMoney, getStoreDisplayName } from '../../../lib/user';

/**
 * How many products a seller may list in the shared public marketplace — the
 * same cap the API enforces (see MARKETPLACE_LISTING_LIMIT in products.mock.ts,
 * re-exported through the types barrel so the UI never hard-codes it twice).
 */
import { MARKETPLACE_LISTING_LIMIT, WORKSHOP_PRODUCT_LIMIT } from '../../../api/types';
import MaterialIcon from '../../../components/ui/MaterialIcon';

const FILTERS = [
  { key: 'all', label: 'All products' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Drafts' },
];

const SORTS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'name', label: 'Name A–Z' },
];

/** Inline SVG paths for the three template cards (ported from the mockup). */
const TEMPLATE_ICONS = {
  'modern-boutique': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  'campus-quick-mart': 'M13 10V3L4 14h7v7l9-11h-7z',
  'tech-essentials-pro':
    'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
};

/** Badge chip shown on each template card in the picker. */
const TEMPLATE_BADGES = {
  'modern-boutique': { label: 'Active', tone: 'blue' },
  'campus-quick-mart': { label: 'Fast Deals', tone: 'emerald' },
  'tech-essentials-pro': { label: 'Gadgets', tone: 'purple' },
};

/** "PNG, JPG or SVG. Max size 2MB" — enforced before base64-encoding. */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function WorkshopCard({ product, currentUser, onEdit, onDelete, onToggleStatus, onToggleFeatured, menuOpenId, setMenuOpenId, actionPending }) {
  const isOwner = currentUser && product.sellerId === currentUser.id;
  const open = menuOpenId === product.id;
  const menuRef = useRef(null);

  // Close the card menu on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpenId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setMenuOpenId]);

  return (
    <div className="ws-card">
      <div className="ws-card-media">
        <img src={product.imageUrl} alt="" data-alt={product.imageAlt} loading="lazy" decoding="async" />
        <span className={`ws-badge ${product.status === 'active' ? 'ws-badge-active' : 'ws-badge-draft'}`}>
          {product.status === 'active' ? 'Active' : 'Draft'}
        </span>
        {/* Listing state must always be readable: an ACTIVE product is either
            on the marketplace or not, and "no badge" was ambiguous — a seller
            who accidentally switched listing OFF saw nothing and assumed it
            was live. Drafts cannot be listed, so they read "Lists on publish". */}
        {product.status === 'active' ? (
          <span className={`ws-badge ${product.featuredInMarketplace ? 'ws-badge-featured' : 'ws-badge-unlisted'}`}>
            <MaterialIcon name="storefront" />
            {product.featuredInMarketplace ? 'On Marketplace' : 'Not listed'}
          </span>
        ) : product.featuredInMarketplace ? (
          <span className="ws-badge ws-badge-featured">
            <MaterialIcon name="storefront" />
            Lists on publish
          </span>
        ) : null}
        {isOwner && (
          <div className="ws-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="ws-card-menu"
              aria-label={`Options for ${product.name}`}
              aria-expanded={open}
              onClick={() => setMenuOpenId(open ? null : product.id)}
            >
              <MaterialIcon name="more_vert" />
            </button>
            {open && (
              <div className="ws-menu" role="menu">
                <button type="button" className="dh-menu-item" onClick={() => { setMenuOpenId(null); onEdit(product); }}>
                  <MaterialIcon name="edit" /> Edit product
                </button>
                <button
                  type="button"
                  className="dh-menu-item"
                  disabled={actionPending}
                  onClick={() => {
                    setMenuOpenId(null);
                    onToggleStatus(product);
                  }}
                >
                  <MaterialIcon name={product.status === "active" ? "unpublish" : "publish"} />
                  {product.status === 'active' ? 'Unpublish (draft)' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="dh-menu-item"
                  disabled={actionPending}
                  onClick={() => {
                    setMenuOpenId(null);
                    onToggleFeatured(product);
                  }}
                >
                  <MaterialIcon name="storefront" />
                  {product.featuredInMarketplace ? 'Remove from marketplace' : 'List on marketplace'}
                </button>
                <button
                  type="button"
                  className="dh-menu-item dh-menu-danger"
                  disabled={actionPending}
                  onClick={() => {
                    setMenuOpenId(null);
                    onDelete(product);
                  }}
                >
                  <MaterialIcon name="delete" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="ws-card-body">
        <h3 className="ws-card-title">{product.name}</h3>
        <p className="ws-card-desc">{product.description}</p>
        <div className="ws-card-footer">
          <span className="ws-price">{formatMoney(product.salePrice ?? product.price)}</span>
          <span className="ws-stock">Stock: {product.stock ?? '--'}</span>
        </div>
        {/*
          Primary edit action, always visible. Edit also lives in the “⋮” menu,
          but a control hidden behind a menu was not discoverable — sellers
          looking to change a product never found it.
        */}
        {isOwner && (
          <div className="ws-card-actions">
            <button
              type="button"
              className="ws-edit-btn"
              onClick={() => onEdit(product)}
              disabled={actionPending}
              aria-label={`Edit ${product.name}`}
            >
              <MaterialIcon name="edit" />
              Edit product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * My Workshop — port of my_workshop_blue.html.
 *
 * Shows ONLY the signed-in seller's products (active + drafts), fetched with
 * the session user's id; the API additionally scopes this server-side, so no
 * other user's products can ever appear here. Search / filter / sort are fully
 * working, and each card has working Edit / Publish / Delete actions.
 */
function MyMarketplace() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [openMenu, setOpenMenu] = useState(null); // 'filter' | 'sort' | null
  const [menuForId, setMenuForId] = useState(null); // product card menu
  const [pendingDelete, setPendingDelete] = useState(null);
  // Message from the API when the 2-marketplace-listing cap is hit (or any
  // other listing failure) — shown just above the product grid.
  const [listingError, setListingError] = useState('');
  const toolbarRef = useRef(null);
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const { data: profile } = useSellerProfile();
  const { data: products, isLoading } = useProducts(
    user?.id ? { sellerId: user.id, page: 1, pageSize: 50 } : { sellerId: '__loading__' },
  );
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProfile = useUpdateSellerProfile();

  // Logo column preview — the persisted profile logo (http(s) or data URL).
  const logoPreview = profile?.logoUrl ?? '';

  // Logo column — hidden file input behind the dashed upload box.
  const logoInputRef = useRef(null);
  const [logoError, setLogoError] = useState('');

  // Contact column — local drafts synced from the profile, saved on blur/Enter.
  const [phoneDraft, setPhoneDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [contactSaved, setContactSaved] = useState(false);
  useEffect(() => {
    setPhoneDraft(profile?.phone ?? '');
    setEmailDraft(profile?.supportEmail ?? '');
  }, [profile?.phone, profile?.supportEmail]);

  // Location column — product location draft synced from the profile, saved on blur/Enter.
  const [locationDraft, setLocationDraft] = useState('');
  const [locationSaved, setLocationSaved] = useState(false);
  useEffect(() => {
    setLocationDraft(profile?.pickupLocation ?? '');
  }, [profile?.pickupLocation]);

  // Close toolbar dropdowns on outside click / Escape.
  useEffect(() => {
    if (!openMenu) return undefined;
    const onMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) setOpenMenu(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  const visible = useMemo(() => {
    let list = products ?? [];
    if (filter !== 'all') list = list.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
      );
    }
    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      price_asc: (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
      price_desc: (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(sorters[sort] ?? sorters.newest);
  }, [products, filter, search, sort]);

  const activeCount = (products ?? []).filter((p) => p.status === 'active').length;
  const draftCount = (products ?? []).filter((p) => p.status === 'draft').length;
  const featuredCount = (products ?? []).filter(
    (p) => p.status === 'active' && p.featuredInMarketplace === true,
  ).length;
  const featuredSlotsLeft = Math.max(0, MARKETPLACE_LISTING_LIMIT - featuredCount);
  // Workshop product cap (active + drafts combined) — mirrors the API check.
  const workshopCount = (products ?? []).length;
  const workshopSlotsLeft = Math.max(0, WORKSHOP_PRODUCT_LIMIT - workshopCount);
  const canAddProduct = workshopSlotsLeft > 0;

  const handleToggleStatus = (product) => {
    updateProduct.mutate({
      id: product.id,
      data: { status: product.status === 'active' ? 'draft' : 'active' },
    });
  };

  /**
   * Feature / un-feature a product in the shared public marketplace. The API
   * caps each seller at 2 featured active products; when the cap is hit it
   * answers 422 and we surface that message above the grid.
   */
  const handleToggleFeatured = (product) => {
    setListingError('');
    updateProduct.mutate(
      {
        id: product.id,
        data: { featuredInMarketplace: !product.featuredInMarketplace },
      },
      {
        onError: (error) => {
          setListingError(error?.message ?? 'Could not update the marketplace listing. Try again.');
        },
      },
    );
  };

  /** Logo column — validate (2MB cap), base64 and persist as logoUrl. */
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be 2MB or smaller.');
      return;
    }
    setLogoError('');
    try {
      const uploaded = await uploadsApi.uploadImage(file);
      updateProfile.mutate({ logoUrl: uploaded.url });
    } catch (error) {
      setLogoError(error?.message || 'Could not upload that file. Try again.');
    }
  };

  /** Contact column — saves WhatsApp/phone + support email on blur/Enter. */
  const saveContact = () => {
    if (updateProfile.isPending) return;
    const phone = phoneDraft.trim();
    const email = emailDraft.trim();
    if (phone === (profile?.phone ?? '') && email === (profile?.supportEmail ?? '')) return;
    updateProfile.mutate(
      { phone, supportEmail: email },
      {
        onSuccess: () => {
          setContactSaved(true);
          window.setTimeout(() => setContactSaved(false), 2200);
        },
      },
    );
  };

  /** Location column — persists the product location on blur/Enter. */
  const saveLocation = () => {
    if (updateProfile.isPending) return;
    const location = locationDraft.trim();
    if (location === (profile?.pickupLocation ?? '')) return;
    updateProfile.mutate(
      { pickupLocation: location },
      {
        onSuccess: () => {
          setLocationSaved(true);
          window.setTimeout(() => setLocationSaved(false), 2200);
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteProduct.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
    });
  };

  const actionPending = updateProduct.isPending || deleteProduct.isPending;
  const filterLabel = FILTERS.find((f) => f.key === filter)?.label ?? 'All products';
  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? 'Newest first';

  return (
    <>
      <Sidebar active="workshop" mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} />

      <main className="sd-main">
        {/* TopAppBar */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button className="sd-topbar-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <MaterialIcon name="menu" />
            </button>
            <div className="sd-top-search">
              <MaterialIcon name="search" />
              <input
                type="text"
                placeholder="Search workshop..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
                                <div className="sd-topbar-actions">
            <button className="sd-icon-btn" aria-label="Notifications">
              <MaterialIcon name="notifications" />
              <span className="sd-notif-dot"></span>
            </button>
            <div className="sd-avatar-sm ws-avatar-initials" title={user?.fullName}>
              {getUserInitials(user?.fullName)}
              <span className="sd-avatar-name">Hi, {getFirstName(user?.fullName)}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="sd-page ws-page">

          {/* ===== Hero Banner ===== */}
          <section className="ws-hero">
            <span className="ws-hero-glow ws-hero-glow-tl" aria-hidden="true" />
            <span className="ws-hero-glow ws-hero-glow-br" aria-hidden="true" />
            <div className="ws-hero-inner">
              <div className="ws-hero-badge">
                <MaterialIcon name="storefront" />
                <span>My Workshop</span>
              </div>
              <h1 className="ws-hero-title">
                Manage Your Workshop
                <br />
                Grow Your Business
              </h1>
              <p className="ws-hero-sub">Everything you need to run your shop in one simple place.</p>
            </div>
          </section>

          {/* Page Header with Stats */}
          <div className="ws-header-section">
            <div className="ws-header-main">
              <div>
                <h2 className="sd-page-title">My Workshop</h2>
                <p className="sd-page-sub">
                  {products
                    ? `${products.length} product${products.length === 1 ? '' : 's'} · ${activeCount} active · ${draftCount} draft${draftCount === 1 ? '' : 's'}`
                    : 'Manage your active products and drafts'}
                </p>
              </div>
              <button
                type="button"
                className="ws-add-btn-primary"
                onClick={() => navigate('/seller/add-product')}
                disabled={!canAddProduct}
                title={
                  canAddProduct
                    ? undefined
                    : `Workshop is full — ${WORKSHOP_PRODUCT_LIMIT} of ${WORKSHOP_PRODUCT_LIMIT} products. Remove one to add another.`
                }
              >
                <MaterialIcon name="add" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="ws-stats-compact">
              <div className="ws-stat-compact">
                <MaterialIcon name="inventory_2" />
                <div>
                  <div className="ws-stat-value">{workshopCount}/{WORKSHOP_PRODUCT_LIMIT}</div>
                  <div className="ws-stat-label">Total Products</div>
                </div>
              </div>
              <div className="ws-stat-compact">
                <MaterialIcon name="check_circle" />
                <div>
                  <div className="ws-stat-value">{activeCount}</div>
                  <div className="ws-stat-label">Active</div>
                </div>
              </div>
              <div className="ws-stat-compact">
                <MaterialIcon name="storefront" />
                <div>
                  <div className="ws-stat-value">{featuredCount}/{MARKETPLACE_LISTING_LIMIT}</div>
                  <div className="ws-stat-label">On Marketplace</div>
                </div>
              </div>
            </div>

            {/* Filter & Sort Toolbar */}
            <div className="ws-toolbar-compact" ref={toolbarRef}>
              <div className="ws-toolbar-wrap">
                <button
                  type="button"
                  className="sd-tool-btn"
                  onClick={() => setOpenMenu(openMenu === 'filter' ? null : 'filter')}
                  aria-expanded={openMenu === 'filter'}
                >
                  <MaterialIcon name="filter_list" /> {filterLabel}
                </button>
                {openMenu === 'filter' && (
                  <div className="ws-menu">
                    {FILTERS.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className="dh-menu-item"
                        onClick={() => {
                          setFilter(f.key);
                          setOpenMenu(null);
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="ws-toolbar-wrap">
                <button
                  type="button"
                  className="sd-tool-btn"
                  onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
                  aria-expanded={openMenu === 'sort'}
                >
                  <MaterialIcon name="sort" /> {sortLabel}
                </button>
                {openMenu === 'sort' && (
                  <div className="ws-menu">
                    {SORTS.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        className="dh-menu-item"
                        onClick={() => {
                          setSort(s.key);
                          setOpenMenu(null);
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Store Settings Card - Simplified */}
          <section className="ws-settings-card">
            <div className="ws-settings-header">
              <div>
                <h3 className="ws-settings-title">Store Settings</h3>
                <p className="ws-settings-sub">Manage your storefront details</p>
              </div>
              <button
                type="button"
                className="ws-settings-expand"
                onClick={() => navigate('/seller/profile')}
              >
                <MaterialIcon name="tune" />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="ws-settings-grid">
              {/* Logo */}
              <div className="ws-setting-item">
                <div className="ws-setting-icon">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Shop logo" className="ws-setting-logo" />
                  ) : (
                    <MaterialIcon name="store" />
                  )}
                </div>
                <div className="ws-setting-info">
                  <div className="ws-setting-label">Store Logo</div>
                  <div className="ws-setting-value">
                    {getStoreDisplayName(profile?.storeName, user?.fullName)}
                  </div>
                </div>
                <label className="ws-setting-action">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoChange}
                    disabled={updateProfile.isPending}
                    style={{ display: 'none' }}
                  />
                  <MaterialIcon name="upload" />
                </label>
              </div>

              {/* Location */}
              <div className="ws-setting-item">
                <div className="ws-setting-icon">
                  <MaterialIcon name="location_on" />
                </div>
                <div className="ws-setting-info">
                  <div className="ws-setting-label">Pickup Location</div>
                  <input
                    type="text"
                    className="ws-setting-input"
                    value={locationDraft}
                    placeholder="e.g. Ago-Iwoye Main Campus Gate"
                    maxLength={120}
                    disabled={updateProfile.isPending}
                    onChange={(e) => {
                      setLocationDraft(e.target.value);
                      setLocationSaved(false);
                    }}
                    onBlur={saveLocation}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                </div>
                {locationSaved && (
                  <span className="ws-setting-saved">
                    <MaterialIcon name="check" />
                  </span>
                )}
              </div>

              {/* Contact */}
              <div className="ws-setting-item">
                <div className="ws-setting-icon">
                  <MaterialIcon name="phone" />
                </div>
                <div className="ws-setting-info">
                  <div className="ws-setting-label">WhatsApp / Hotline</div>
                  <div className="ws-phone-input-compact">
                    <span className="ws-phone-prefix-compact">+234</span>
                    <input
                      type="tel"
                      className="ws-setting-input"
                      value={phoneDraft}
                      placeholder="705 191 7468"
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      onBlur={saveContact}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    />
                  </div>
                </div>
                {contactSaved && (
                  <span className="ws-setting-saved">
                    <MaterialIcon name="check" />
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="ws-setting-item">
                <div className="ws-setting-icon">
                  <MaterialIcon name="mail" />
                </div>
                <div className="ws-setting-info">
                  <div className="ws-setting-label">Support Email</div>
                  <input
                    type="email"
                    className="ws-setting-input"
                    value={emailDraft}
                    placeholder="store@example.com"
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onBlur={saveContact}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Marketplace listing cap error (e.g. "you can list at most 2") */}
          {listingError && (
            <div className="ws-listing-error" role="alert">
              <MaterialIcon name="error" />
              {listingError}
              <button
                type="button"
                className="ws-listing-error-close"
                aria-label="Dismiss message"
                onClick={() => setListingError('')}
              >
                <MaterialIcon name="close" />
              </button>
            </div>
          )}

          <div className="ws-grid">
            {isLoading ? (
              <div className="ws-loading">Loading products...</div>
            ) : visible.length === 0 ? (
              <div className="ws-empty">
                <h3>No products found</h3>
                <p>
                  {search || filter !== 'all'
                    ? 'Try changing your search or filter.'
                    : 'Your workshop is empty — create your first product below.'}
                </p>
              </div>
            ) : (
              visible.map((product) => (
                <WorkshopCard
                  key={product.id}
                  product={product}
                  currentUser={user}
                  menuOpenId={menuForId}
                  setMenuOpenId={setMenuForId}
                  actionPending={actionPending}
                  onEdit={(p) => navigate(`/seller/edit-product/${p.id}`)}
                  onToggleStatus={handleToggleStatus}
                  onToggleFeatured={handleToggleFeatured}
                  onDelete={(p) => setPendingDelete(p)}
                />
              ))
            )}

            {/* Add New Product Card (Ghost/Dash style) */}
            <Link to="/seller/add-product" className="ws-add-card">
              <div className="ws-add-icon">
                <MaterialIcon name="add" />
              </div>
              <h3 className="ws-add-title">Create New Product</h3>
              <p className="ws-add-sub">Start a new draft or publish directly to your store.</p>
            </Link>
          </div>

        </div>
      </main>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete product?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed from your workshop. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete product"
        busy={deleteProduct.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

export default MyMarketplace;