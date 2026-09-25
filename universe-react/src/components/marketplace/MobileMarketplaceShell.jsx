import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resolveDeliveryLocation } from '../../api/types';
import './mobile-marketplace.css';

export function Icon({ name, className = '' }) {
  const paths = {
    arrowBack: <path d="M15.75 19.5L8.25 12l7.5-7.5" />,
    bell: <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />,
    cart: <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />,
    home: <path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
    search: <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
    heart: <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
    user: <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
    check: <path d="M4.5 12.75l6 6 9-13.5" />,
    plus: <path d="M12 5v14m-7-7h14" />,
    minus: <path d="M5 12h14" />,
    close: <path d="M6 18L18 6M6 6l12 12" />,
    sliders: <><path d="M3 4h18M3 12h18M3 20h18" /><circle cx="8" cy="4" r="2.5" /><circle cx="16" cy="12" r="2.5" /><circle cx="9" cy="20" r="2.5" /></>,
    share: <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />,
    expand: <><path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9.5 9.5M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L14.5 9.5M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9.5 14.5M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L14.5 14.5" /></>,
    whatsapp: <><path d="M20.25 11.75a8.25 8.25 0 01-12.17 7.26L3.75 20.25l1.3-4.17A8.25 8.25 0 1120.25 11.75z" /><path d="M8.7 8.4c.2-.25.42-.27.7-.27.17 0 .35.02.5.36l.55 1.3c.1.24.06.43-.08.61l-.43.53c-.14.16-.1.31-.03.45.27.54 1.02 1.62 2.29 2.2.18.08.3.07.42-.08l.55-.68c.14-.18.3-.2.5-.12l1.3.61c.2.1.34.15.39.26.05.12.05.67-.16 1.05-.2.38-.75.65-1.03.68-.27.04-.63.05-1.02-.08-.24-.08-.56-.18-.96-.36-1.68-.73-2.78-2.43-2.87-2.55-.08-.12-.68-.9-.68-1.72 0-.82.43-1.22.58-1.39z" /></>,
    edit: <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />,
    locationPin: <><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></>,
  };
  return <svg className={`mm-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function StatusBar() {
  return <header className="mm-status"><Link to="/marketplace" aria-label="UNIVERSE marketplace home"><img src="/logo.png" alt="UNIVERSE" /></Link></header>;
}

export function BottomNav({ active = 'home', cartCount = 0 }) {
  const items = [
    ['home', 'Home', '/marketplace', 'home'],
    ['search', 'Search', '/marketplace/search', 'search'],
    ['saved', 'Saved', '/saved', 'heart'],
    ['cart', 'Cart', '/cart', 'cart'],
    ['account', 'Account', '/account', 'user'],
  ];
  return <footer className="mm-bottom"><nav aria-label="Main navigation">{items.map(([key, label, to, icon]) => <Link key={key} to={to} className={active === key ? 'active' : ''}>
    <span className="mm-nav-icon"><Icon name={icon} />{key === 'cart' && cartCount > 0 && <b>{cartCount}</b>}</span><span>{label}</span>
  </Link>)}</nav></footer>;
}

export function MobileFrame({ children, active, cartCount = 0, className = '', showBottomNav = true }) {
  return <div className={`mm-page ${className}`}><div className="mm-device"><StatusBar />{children}{showBottomNav && <BottomNav active={active} cartCount={cartCount} />}</div></div>;
}

export function ScreenHeader({ title, onBack, right = true }) {
  const navigate = useNavigate();
  return <section className="mm-screen-header"><button type="button" aria-label="Go back" onClick={onBack || (() => navigate(-1))}><Icon name="arrowBack" /></button><h1>{title}</h1>{right ? <button type="button" aria-label="Notifications" className="mm-notification"><Icon name="bell" /><i /></button> : <span className="mm-header-spacer" />}</section>;
}

export function ProductArt({ product, variant = '' }) {
  const name = `${product?.name || ''} ${variant}`.toLowerCase();
  const fallback = name.includes('iphone')
    ? <div className="mm-art mm-phone"><i /><span /></div>
    : name.includes('macbook') || name.includes('laptop')
      ? <div className="mm-art mm-laptop"><i /><span /></div>
      : name.includes('xbox') || name.includes('console') || name.includes('controller')
        ? <div className="mm-art mm-console"><i /><span /></div>
        : <div className="mm-art mm-airpods"><i /><span /></div>;

  if (!product?.imageUrl) return fallback;
  return <img className="mm-product-image" src={product.imageUrl} alt={product.imageAlt || product.name} onError={(event) => {
    const fallbackElement = event.currentTarget.nextElementSibling;
    if (fallbackElement) fallbackElement.style.display = 'grid';
    event.currentTarget.remove();
  }} />;
}

export function ProductCard({ product, saved, onToggleSaved, onOpen, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const addTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(addTimer.current), []);
  // Delivery hub of the listing — the platform default ("Motion Ground At DHL
  // Building") for products created through the seller's Add Product page.
  const deliveryLocation = resolveDeliveryLocation(product.deliveryLocation);
  const addToCart = () => {
    onAddToCart?.(product);
    setAdded(true);
    window.clearTimeout(addTimer.current);
    addTimer.current = window.setTimeout(() => setAdded(false), 1400);
  };
  return <article className="mm-product-card"><button type="button" aria-label={saved ? 'Remove from saved' : 'Add to wishlist'} className={`mm-heart ${saved ? 'saved' : ''}`} onClick={() => onToggleSaved?.(product)}><Icon name="heart" /></button><button type="button" className="mm-product-link" onClick={() => onOpen?.(product)}><div className="mm-product-art"><ProductArt product={product} /><span className="mm-image-fallback"><ProductArt product={{ name: product.name }} /></span></div><div className="mm-product-meta"><h2>{product.name}</h2><span>{product.rating != null ? `★ ${product.rating.toFixed(1)}${product.reviews != null ? ` (${product.reviews})` : ''}` : 'No reviews yet'}</span></div><small className="mm-product-location"><Icon name="locationPin" /><span>{deliveryLocation}</span></small>{product.description ? <p className="mm-product-desc">{product.description}</p> : null}</button><div className="mm-product-footer"><p>{formatProductPrice(product)}</p>{onAddToCart && <button type="button" className={`mm-add-cart ${added ? 'added' : ''}`} aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`} onClick={addToCart}><Icon name={added ? 'check' : 'cart'} /><span>{added ? 'Added' : 'Add to cart'}</span></button>}</div></article>;
}

/**
 * Filled WhatsApp brand glyph for "Message seller" buttons.
 *
 * Defined once here and shared by every WhatsApp action (the product page's
 * contact strip and the seller profile) so the brand mark lives in a single
 * place. The stroked `Icon name="whatsapp"` outline stays reserved for small
 * inline/nav usage. Sizing comes from the button's CSS (`.mm-whatsapp svg`).
 */
export function WhatsAppGlyph() {
  return <svg className="mm-whatsapp-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>;
}

export function formatProductPrice(product) {
  const price = product?.salePrice ?? product?.price;
  return price == null ? 'Price unavailable' : formatNaira(price);
}

export function formatNaira(value) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function useMarketplaceNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  return { location, navigate };
}
