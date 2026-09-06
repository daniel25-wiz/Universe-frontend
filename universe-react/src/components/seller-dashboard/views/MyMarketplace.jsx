import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import ConfirmDialog from '../ui/ConfirmDialog';
import '../seller-dashboard.css';
import './my-marketplace.css';
import '../ui/widgets.css';
import { useCurrentUser } from '../../../hooks/useAuth';
import { useDeleteProduct, useProducts, useUpdateProduct } from '../../../hooks/useProducts';
import { getUserInitials, getFirstName } from '../../../lib/user';

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
          <span className="ws-price">${product.salePrice ?? product.price}</span>
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
  const { data: products, isLoading } = useProducts(
    user?.id ? { sellerId: user.id, pageSize: 200 } : { sellerId: '__loading__' },
  );
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

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
        <div className="sd-page">
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