import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    ['account', 'Account', '/auth/login', 'user'],
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
  const addToCart = () => {
    onAddToCart?.(product);
    setAdded(true);
    window.clearTimeout(addTimer.current);
    addTimer.current = window.setTimeout(() => setAdded(false), 1400);
  };
  return <article className="mm-product-card"><button type="button" aria-label={saved ? 'Remove from saved' : 'Add to wishlist'} className={`mm-heart ${saved ? 'saved' : ''}`} onClick={() => onToggleSaved?.(product)}><Icon name="heart" /></button><button type="button" className="mm-product-link" onClick={() => onOpen?.(product)}><div className="mm-product-art"><ProductArt product={product} /><span className="mm-image-fallback"><ProductArt product={{ name: product.name }} /></span></div><div className="mm-product-meta"><h2>{product.name}</h2><span>★ {product.rating ?? '4.9'}</span></div>{product.description ? <p className="mm-product-desc">{product.description}</p> : null}</button><div className="mm-product-footer"><p>{formatProductPrice(product)}</p>{onAddToCart && <button type="button" className={`mm-add-cart ${added ? 'added' : ''}`} aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`} onClick={addToCart}><Icon name={added ? 'check' : 'cart'} /><span>{added ? 'Added' : 'Add to cart'}</span></button>}</div></article>;
}

export function formatProductPrice(product) {
  const price = product?.salePrice ?? product?.price ?? 0;
  return formatNaira(price);
}

export function formatNaira(value) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function useMarketplaceNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  return { location, navigate };
}
