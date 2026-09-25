import { useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCurrentUser } from '../../hooks/useAuth';
import { Icon, MobileFrame, ProductCard, ScreenHeader } from './MobileMarketplaceShell';

/**
 * Seller shop — reached from the "View all products from this seller" button
 * on the product page. Shows every product the seller has POSTED (active
 * ones; drafts stay private because the API only exposes active products to
 * non-owner viewers). Each seller features at most 2 products in the shared
 * marketplace catalog, but buyers can browse their full posted catalog here.
 */
function SellerShopPage({ savedProducts = [], onToggleSaved, onAddToCart }) {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  // NOTE: useProducts unwraps the paginated response and resolves to the
  // product array itself (see hooks/useProducts.ts) — not `{ items }`.
  const { data: products = [], isLoading } = useProducts(
    sellerId ? { sellerId, page: 1, pageSize: 50 } : undefined,
  );
  const savedIds = new Set(savedProducts.map((product) => product.id));
  const sellerName = products[0]?.seller || 'Campus Seller';
  const sellerLogo = products[0]?.sellerLogo;
  // A seller often lands on their own shop from one of their product pages;
  // offer a direct route back to the editing surface instead of making them
  // dig through the dashboard menu.
  const isOwner = Boolean(currentUser && sellerId && currentUser.id === sellerId);

  return <MobileFrame active="home" cartCount={0}>
    <ScreenHeader title={sellerName} />
    <main className="mm-scroll mm-seller-shop">
      <section className="mm-seller-shop-head">
        <span className="mm-seller-shop-avatar" aria-hidden="true">{sellerLogo ? <img src={sellerLogo} alt="" /> : sellerName.trim().charAt(0).toUpperCase()}</span>
        <div className="mm-seller-shop-id">
          <h2>{sellerName}</h2>
          <p>{isLoading ? 'Loading products…' : `${products.length} product${products.length === 1 ? '' : 's'} available`}</p>
        </div>
      </section>
      {isOwner && (
        <section className="mm-owner-row" aria-label="Seller actions">
          <button type="button" className="mm-owner-edit" onClick={() => navigate('/seller/marketplace')}>
            <Icon name="edit" /> Manage my products
          </button>
          <small>You are viewing your own shop — all products can be edited there.</small>
        </section>
      )}
      {isLoading ? <p className="mm-loading">Loading products...</p>
        : products.length ? (
          <section className="mm-product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                saved={savedIds.has(product.id)}
                onToggleSaved={onToggleSaved}
                onAddToCart={onAddToCart}
                onOpen={(item) => navigate(`/marketplace/product/${item.id}`)}
              />
            ))}
          </section>
        ) : (
          <section className="mm-empty-cart">
            <Icon name="search" />
            <h2>No products yet</h2>
            <p>This seller has no products posted right now. Check back soon.</p>
          </section>
        )}
    </main>
  </MobileFrame>;
}

export default SellerShopPage;
