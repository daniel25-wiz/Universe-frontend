import { Link } from 'react-router-dom';
import { Icon, MobileFrame, ProductArt, ScreenHeader, formatNaira, formatProductPrice } from './MobileMarketplaceShell';

function CartPage({ cartItems = [], onRemoveFromCart, onUpdateQuantity }) {
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.product.salePrice ?? item.product.price) * item.quantity, 0);
  const shipping = cartItems.length ? 80 : 0;
  const total = subtotal + shipping;

  return <MobileFrame active="cart" cartCount={itemCount}>
    <ScreenHeader title="My Cart" />
    <main className="mm-scroll mm-cart-scroll">
      {cartItems.length ? cartItems.map(({ product, quantity }) => <article className="mm-cart-item" key={product.id}><div className="mm-cart-art"><ProductArt product={product} /></div><div className="mm-cart-info"><div className="mm-cart-title-row"><div><h2>{product.name}</h2><p>{product.seller || product.category || 'UNIVERSE Store'}</p></div><button type="button" aria-label={`Remove ${product.name}`} onClick={() => onRemoveFromCart(product.id)}><Icon name="close" /></button></div><div className="mm-cart-price-row"><strong>{formatProductPrice(product)}</strong><div className="mm-stepper"><button type="button" onClick={() => onUpdateQuantity(product.id, quantity - 1)}><Icon name="minus" /></button><span>{quantity}</span><button type="button" onClick={() => onUpdateQuantity(product.id, quantity + 1)}><Icon name="plus" /></button></div></div></div></article>) : <section className="mm-empty-cart"><Icon name="cart" /><h2>Your cart is empty</h2><p>Browse the marketplace and add something you like.</p><Link to="/marketplace">Browse products</Link></section>}
      {cartItems.length > 0 && <><section className="mm-summary"><div><span>Sub-total</span><strong>{formatNaira(subtotal)}</strong></div><div><span>VAT (%)</span><strong>{formatNaira(0)}</strong></div><div><span>Shipping fee</span><strong>{formatNaira(shipping)}</strong></div><div className="total"><span>Total</span><strong>{formatNaira(total)}</strong></div></section><button type="button" className="mm-checkout">Go To Checkout <Icon name="arrowBack" className="mm-arrow-right" /></button></>}
    </main>
  </MobileFrame>;
}

export default CartPage;
