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

function WorkshopCard({ product, currentUser, onEdit, onDelete, onToggleStatus, menuOpenId, setMenuOpenId, actionPending }) {
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
        {isOwner && (
          <div className="ws-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="ws-card-menu"
              aria-label={`Options for ${product.name}`}
              aria-expanded={open}
              onClick={() => setMenuOpenId(open ? null : product.id)}
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {open && (
              <div className="ws-menu" role="menu">
                <button type="button" className="dh-menu-item" onClick={() => { setMenuOpenId(null); onEdit(product); }}>
                  <span className="material-symbols-outlined">edit</span> Edit product
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
                  <span className="material-symbols-outlined">
                    {product.status === 'active' ? 'unpublish' : 'publish'}
                  </span>
                  {product.status === 'active' ? 'Unpublish (draft)' : 'Publish'}
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
                  <span className="material-symbols-outlined">delete</span> Delete
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
  const toolbarRef = useRef(null);
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const { data: profile } = useSellerProfile();
  const { data: products, isLoading } = useProducts(
    user?.id ? { sellerId: user.id, pageSize: 200 } : { sellerId: '__loading__' },
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

  const handleToggleStatus = (product) => {
    updateProduct.mutate({
      id: product.id,
      data: { status: product.status === 'active' ? 'draft' : 'active' },
    });
  };

  /** Logo column — validate (2MB cap), base64 and persist as logoUrl. */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be 2MB or smaller.');
      return;
    }
    setLogoError('');
    const reader = new FileReader();
    reader.onload = () => updateProfile.mutate({ logoUrl: String(reader.result) });
    reader.onerror = () => setLogoError('Could not read that file. Try again.');
    reader.readAsDataURL(file);
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
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="sd-top-search">
              <span className="material-symbols-outlined">search</span>
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
              <span className="material-symbols-outlined">notifications</span>
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

          {/* ===== Workspace hero (my_workshop_template_selector_workspace.html) ===== */}
          <section className="ws-hero">
            <span className="ws-hero-glow ws-hero-glow-tl" aria-hidden="true" />
            <span className="ws-hero-glow ws-hero-glow-br" aria-hidden="true" />
            <div className="ws-hero-inner">
              <div className="ws-hero-badge">
                <span className="material-symbols-outlined">storefront</span>
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

          <div className="ws-header">
            <div>
              <h2 className="sd-page-title">My Workshop</h2>
              <p className="sd-page-sub">
                {products
                  ? `${products.length} product${products.length === 1 ? '' : 's'} · ${activeCount} active · ${draftCount} draft${draftCount === 1 ? '' : 's'}`
                  : 'Manage your active products and drafts.'}
              </p>
            </div>
            <div className="ws-toolbar" ref={toolbarRef}>
              <div className="ws-toolbar-wrap">
                <button
                  type="button"
                  className="sd-tool-btn"
                  onClick={() => setOpenMenu(openMenu === 'filter' ? null : 'filter')}
                  aria-expanded={openMenu === 'filter'}
                >
                  <span className="material-symbols-outlined">filter_list</span> {filterLabel}
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
                  <span className="material-symbols-outlined">sort</span> {sortLabel}
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

          {/* ===== Storefront config card (templates / logo / location / contact) ===== */}
          <section className="ws-config-card">
            <div className="ws-config-head">
              <div className="ws-config-namewrap">
                <span className="ws-config-shopname">
                  {getStoreDisplayName(profile?.storeName, user?.fullName)}
                </span>
                <button
                  type="button"
                  className="ws-config-editname"
                  title="Edit Store Name"
                  onClick={() => navigate('/seller/profile')}
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
              <p className="ws-config-namesub">Click to customize your public storefront branding</p>
            </div>

            <div className="ws-config-grid">
              {/* Column 2: Logo */}
              <div className="ws-col ws-col-logo" data-purpose="logo-upload">
                <h2 className="ws-col-title">Logo</h2>
                <label className="ws-logo-box" title="Upload shop logo">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoChange}
                    disabled={updateProfile.isPending}
                  />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Shop logo" className="ws-logo-img" />
                  ) : (
                    <span className="ws-logo-plus">
                      <span className="material-symbols-outlined">add</span>
                    </span>
                  )}
                </label>
                <div className="ws-logo-meta">
                  <h3>{logoPreview ? 'Change Logo' : 'Add Logo'}</h3>
                  <p>PNG, JPG or SVG. Max size 2MB</p>
                  {logoError && <p className="ws-field-error">{logoError}</p>}
                </div>
              </div>

              {/* Column 3: Location */}
              <div className="ws-col ws-col-location" data-purpose="location-picker">
                <div>
                  <Link to="/seller/add-product" className="ws-add-card ws-loc-add-card">
                    <div className="ws-add-icon">
                      <span className="material-symbols-outlined">add</span>
                    </div>
                    <h3 className="ws-add-title">Create New Product</h3>
                    <p className="ws-add-sub">Start a new draft or publish directly to your store.</p>
                  </Link>
                </div>
              </div>
              {/* Column 4: Contact */}
              <div className="ws-col ws-col-contact" data-purpose="contact-us">
                <h2 className="ws-col-title">Contact Us</h2>
                <div className="ws-contact-fields">
                  <label>
                    <span className="ws-field-label">WhatsApp / Hotline</span>
                    <div className="ws-phone-wrap">
                      <span className="ws-phone-prefix">🇳🇬 +234</span>
                      <input
                        type="tel"
                        value={phoneDraft}
                        placeholder="705 191 7468"
                        onChange={(e) => setPhoneDraft(e.target.value)}
                        onBlur={saveContact}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      />
                    </div>
                  </label>
                  <label>
                    <span className="ws-field-label">Support Email</span>
                    <input
                      type="email"
                      value={emailDraft}
                      placeholder="store@example.com"
                      onChange={(e) => setEmailDraft(e.target.value)}
                      onBlur={saveContact}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    />
                  </label>
                  {updateProfile.isPending && <p className="ws-save-pending">Saving…</p>}
                  {contactSaved && (
                    <p className="ws-save-note">
                      <span className="material-symbols-outlined">check_circle</span> Saved
                    </p>
                  )}
                </div>
              </div>
                <div className="ws-contact-note">
                  Buyers will see these details directly on your shop profile.
                </div>
            </div>

            {/* Bottom action bar — Add New Product */}
            <div className="ws-card-footer-bar">
              <button
                type="button"
                className="ws-add-product-btn"
                onClick={() => navigate('/seller/add-product')}
              >
                <span className="material-symbols-outlined">add</span>
                <span>Add New Product</span>
              </button>
            </div>
          </section>

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
                  onDelete={(p) => setPendingDelete(p)}
                />
              ))
            )}

            {/* Add New Product Card (Ghost/Dash style) */}
            <Link to="/seller/add-product" className="ws-add-card">
              <div className="ws-add-icon">
                <span className="material-symbols-outlined">add</span>
              </div>
              <h3 className="ws-add-title">Create New Product</h3>
              <p className="ws-add-sub">Start a new draft or publish directly to your store.</p>
            </Link>
          </div>

          {/* ===== Quick stats overview ===== */}
          <div className="ws-stats">
            <div className="ws-stat">
              <span className="ws-stat-icon ws-stat-icon-blue">
                <span className="material-symbols-outlined">inventory_2</span>
              </span>
              <div>
                <p className="ws-stat-label">Total Products</p>
                <p className="ws-stat-value">{products ? `${products.length} Item${products.length === 1 ? '' : 's'}` : '--'}</p>
              </div>
            </div>
            <div className="ws-stat">
              <span className="ws-stat-icon ws-stat-icon-green">
                <span className="material-symbols-outlined">check_circle</span>
              </span>
              <div>
                <p className="ws-stat-label">Store Status</p>
                <p className="ws-stat-value">Verified Seller</p>
              </div>
            </div>
            <div className="ws-stat">
              <span className="ws-stat-icon ws-stat-icon-purple">
                <span className="material-symbols-outlined">visibility</span>
              </span>
              <div>
                <p className="ws-stat-label">Shop Views this Week</p>
                <p className="ws-stat-value">1,482</p>
              </div>
            </div>
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