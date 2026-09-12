import { Link } from 'react-router-dom';
import { formatMoney } from '../../lib/user';
import './marketplace-commerce.css';

function CartPage({ cartItems, onRemoveFromCart, onUpdateQuantity }) {
  const subtotal = cartItems.reduce((total, item) => total + (item.product.salePrice ?? item.product.price) * item.quantity, 0);

  return (
    <div className="mc-root">
      <header className="mc-header">
        <Link className="mc-brand" to="/marketplace">MarketPlace</Link>
        <Link className="mc-cart-link" to="/marketplace">
          <span className="material-symbols-outlined">arrow_back</span>
          Continue shopping
        </Link>
      </header>
      <main className="mc-main mc-cart-main">
        <div className="mc-page-heading">
          <span className="mc-eyebrow">Your selections</span>
          <h1>Shopping cart</h1>
          <p>{cartItems.reduce((total, item) => total + item.quantity, 0)} item(s)</p>
        </div>
        {cartItems.length === 0 ? (
          <section className="mc-empty">
            <span className="material-symbols-outlined">shopping_cart</span>
            <h2>Your cart is empty</h2>
            <p>Browse the marketplace and add something you like.</p>
            <Link className="mc-primary-button" to="/marketplace">Browse products</Link>
          </section>
        ) : (
          <div className="mc-cart-layout">
            <section className="mc-cart-items" aria-label="Cart items">
              {cartItems.map(({ product, quantity }) => (
                <article className="mc-cart-item" key={product.id}>
                  <Link to={`/marketplace/product/${product.id}`} className="mc-cart-image-wrap">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.imageAlt || product.name} /> : <span>No image</span>}
                  </Link>
                  <div className="mc-cart-item-content">
                    <Link to={`/marketplace/product/${product.id}`} className="mc-cart-item-title">{product.name}</Link>
                    <span className="mc-cart-item-price">{formatMoney(product.salePrice ?? product.price)}</span>
                    <div className="mc-cart-item-actions">
                      <label>
                        Quantity
                        <select value={quantity} onChange={(event) => onUpdateQuantity(product.id, Number(event.target.value))}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </label>
                      <button type="button" className="mc-remove" onClick={() => onRemoveFromCart(product.id)}>Remove</button>
                    </div>
                  </div>
                  <strong className="mc-line-total">{formatMoney((product.salePrice ?? product.price) * quantity)}</strong>
                </article>
              ))}
            </section>
            <aside className="mc-summary">
              <h2>Order summary</h2>
              <div className="mc-summary-row"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
              <div className="mc-summary-row mc-summary-muted"><span>Delivery</span><span>Calculated at checkout</span></div>
              <div className="mc-summary-total"><span>Total</span><strong>{formatMoney(subtotal)}</strong></div>
              <button type="button" className="mc-primary-button mc-checkout-button">Proceed to checkout</button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default CartPage;
