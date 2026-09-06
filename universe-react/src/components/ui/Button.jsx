import { useRef } from 'react';

const Button = ({ children, className = "", onClick, type = "button", ...props }) => {
  const btnRef = useRef(null);

  const handleClick = (e) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add("ripple");

    const existingRipple = btn.querySelector(".ripple");
    if (existingRipple) {
      existingRipple.remove();
    }

    btn.appendChild(ripple);

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={btnRef}
      type={type}
      className={`btn ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;