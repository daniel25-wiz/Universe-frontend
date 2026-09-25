import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, MobileFrame, ProductArt, ScreenHeader, formatNaira, formatProductPrice } from './MobileMarketplaceShell';

/**
 * Turn a local Nigerian phone number ("0705...") into a wa.me destination
 * ("234705..."). Digits already in international format pass through as-is.
 */
function toWhatsappDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
}

/** Build the pre-filled WhatsApp order message for every item in the cart. */
function buildOrderMessage(items, subtotal, shipping, total) {
  const lines = [
    'Hello, I would like to place an order for the following items from my Universe cart:',
    '',
  ];
  items.forEach(({ product, quantity, options }, index) => {
    const price = product.salePrice ?? product.price;
    lines.push(`${index + 1}. ${product.name}`);
    if (product.description) lines.push(`   Description: ${product.description}`);
    if (product.category) lines.push(`   Category: ${product.category}`);
    if (product.sku) lines.push(`   SKU: ${product.sku}`);
    // Variant choices selected on the product page, e.g. "Color: Black · Size: M"
    // (stored on the cart item when it was added via "Buy Now").
    if (options) lines.push(`   Options: ${options}`);
    else if (Array.isArray(product.variants) && product.variants.length) {
      // No explicit choice stored — list the available option groups instead.
      const groups = product.variants
        .filter((variant) => variant?.name && Array.isArray(variant.values) && variant.values.length)
        .map((variant) => `${variant.name}: ${variant.values.join('/')}`)
        .join(' · ');
      if (groups) lines.push(`   Options: ${groups}`);
    }
    lines.push(`   Seller: ${product.seller || 'UNIVERSE Store'}`);
    lines.push(`   Quantity: ${quantity}`);
    lines.push(`   Price: ${formatNaira(price * quantity)}`);
    lines.push(`   Product link: ${window.location.origin}/marketplace/product/${product.id}`);
    lines.push('');
  });
  lines.push(`Sub-total: ${formatNaira(subtotal)}`);
  lines.push(`Shipping fee: ${formatNaira(shipping)}`);
  lines.push(`Total: ${formatNaira(total)}`);
  return lines.join('\n');
}

function CartPage({ cartItems = [], orders = [], onRemoveFromCart, onUpdateQuantity, onCheckout }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.product.salePrice ?? item.product.price) * item.quantity, 0);
  const shipping = cartItems.length ? 80 : 0;
  const total = subtotal + shipping;

  // Checkout creates a real order through the API, then opens WhatsApp.
  // This ensures the sale is tracked in analytics.
  const checkoutOnWhatsapp = async () => {
    if (!cartItems.length || isCheckingOut) return;
    
    setIsCheckingOut(true);
    setCheckoutError(null);
    
    try {
      const phone = toWhatsappDigits(cartItems.find((item) => item.product.sellerPhone)?.product.sellerPhone) || '2347051917468';
      const message = buildOrderMessage(cartItems, subtotal, shipping, total);
      
      // Call the checkout handler which creates the order in the backend.
      // This is what makes the sale appear in analytics.
      await onCheckout?.(cartItems);
      
      // After successful order creation, open WhatsApp
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Checkout failed:', error);
      setCheckoutError(error?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return <MobileFrame active="cart" cartCount={itemCount}>
    <ScreenHeader title="My Cart" />
    <main className="mm-scroll mm-cart-scroll">
      {checkoutError && (
        <div className="mm-checkout-error">
          <Icon name="close" />
          <p>{checkoutError}</p>
          <button type="button" onClick={() => setCheckoutError(null)}>Dismiss</button>
        </div>
      )}
      {cartItems.length ? cartItems.map(({ product, quantity }) => <article className="mm-cart-item" key={product.id}><div className="mm-cart-art"><ProductArt product={product} /></div><div className="mm-cart-info"><div className="mm-cart-title-row"><div><h2>{product.name}</h2><p>{product.seller || product.category || 'UNIVERSE Store'}</p></div><button type="button" aria-label={`Remove ${product.name}`} onClick={() => onRemoveFromCart(product.id)}><Icon name="close" /></button></div><div className="mm-cart-price-row"><strong>{formatProductPrice(product)}</strong><div className="mm-stepper"><button type="button" onClick={() => onUpdateQuantity(product.id, quantity - 1)}><Icon name="minus" /></button><span>{quantity}</span><button type="button" onClick={() => onUpdateQuantity(product.id, quantity + 1)}><Icon name="plus" /></button></div></div></div></article>) : <section className="mm-empty-cart"><Icon name="cart" /><h2>Your cart is empty</h2><p>Browse the marketplace and add something you like.</p><Link to="/marketplace">Browse products</Link></section>}
      {cartItems.length > 0 && <><section className="mm-summary"><div><span>Sub-total</span><strong>{formatNaira(subtotal)}</strong></div><div><span>VAT (%)</span><strong>{formatNaira(0)}</strong></div><div><span>Shipping fee</span><strong>{formatNaira(shipping)}</strong></div><div className="total"><span>Total</span><strong>{formatNaira(total)}</strong></div></section><button type="button" className="mm-checkout" onClick={checkoutOnWhatsapp} disabled={isCheckingOut} aria-label="Checkout on WhatsApp">{isCheckingOut ? 'Processing...' : 'Go To Checkout'} <Icon name="arrowBack" className="mm-arrow-right" /></button></>}
      {orders.length > 0 && (
        <section className="mm-ordered" aria-label="Ordered products">
          <h2>Ordered products</h2>
          {orders.map((order) => (
            <div className="mm-order" key={order.id}>
              <p className="mm-order-date">Placed {order.date ? new Date(order.date).toLocaleString() : ''}</p>
              {order.items.map(({ product, quantity, options }) => (
                <article className="mm-cart-item mm-order-item" key={product.id}>
                  <div className="mm-cart-art"><ProductArt product={product} /></div>
                  <div className="mm-cart-info">
                    <div className="mm-cart-title-row">
                      <div><h2>{product.name}</h2><p>{product.seller || product.category || 'UNIVERSE Store'}</p></div>
                      <span className="mm-order-badge">Ordered</span>
                    </div>
                    <div className="mm-cart-price-row">
                      <strong>{formatProductPrice(product)}</strong>
                      <span className="mm-order-qty">&times; {quantity}{options ? ` · ${options}` : ''}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>
      )}
    </main>
  </MobileFrame>;
}

export default CartPage;
