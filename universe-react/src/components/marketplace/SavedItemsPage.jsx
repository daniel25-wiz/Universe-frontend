import { useProducts } from '../../hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import { Icon, MobileFrame, ProductCard, ScreenHeader } from './MobileMarketplaceShell';

function SavedItemsPage({ savedProducts = [], onToggleSaved, cartItems = [] }) {
  const navigate = useNavigate();
  const { data: products } = useProducts({ status: 'active', pageSize: 200 });
  const items = savedProducts;
  const savedIds = new Set(savedProducts.map((product) => product.id));
  return <MobileFrame active="saved" cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)}>
    <ScreenHeader title="Saved Items" />
    <main className="mm-scroll mm-saved-scroll">{items.length ? <section className="mm-product-grid">{items.map((product) => <ProductCard key={product.id} product={product} saved={savedIds.has(product.id) || !savedProducts.length} onToggleSaved={onToggleSaved} onOpen={(item) => navigate(`/marketplace/product/${item.id}`)} />)}</section> : <section className="mm-empty-cart"><Icon name="heart" /><h2>No saved items yet</h2><p>Tap the heart on a product to keep it here.</p></section>}</main>
  </MobileFrame>;
}

export default SavedItemsPage;
