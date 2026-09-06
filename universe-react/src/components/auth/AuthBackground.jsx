import { useEffect, useRef } from 'react';

const AuthBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Create decorative elements dynamically
    const container = containerRef.current;
    if (!container) return;

    // Create large faded circular shapes
    const circles = [
      { size: 600, top: -200, left: -200, opacity: 0.03 },
      { size: 400, bottom: -150, right: -150, opacity: 0.02 },
      { size: 300, top: '30%', left: '80%', opacity: 0.025 },
      { size: 250, bottom: '20%', left: '10%', opacity: 0.02 },
    ];

    circles.forEach((circle, i) => {
      const el = document.createElement('div');
      el.className = 'auth-bg-circle';
      el.style.cssText = `
        position: absolute;
        width: ${circle.size}px;
        height: ${circle.size}px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, var(--color-primary) 0%, transparent 70%);
        opacity: ${circle.opacity};
        pointer-events: none;
        z-index: 0;
        ${circle.top !== undefined ? `top: ${circle.top};` : ''}
        ${circle.bottom !== undefined ? `bottom: ${circle.bottom};` : ''}
        ${circle.left !== undefined ? `left: ${circle.left};` : ''}
        ${circle.right !== undefined ? `right: ${circle.right};` : ''}
        animation: float-slow ${8 + i * 2}s ease-in-out infinite;
        animation-delay: ${i * 0.5}s;
      `;
      container.appendChild(el);
    });

    // Create small outlined blue circles
    const smallCircles = [
      { top: '15%', left: '5%', size: 60 },
      { top: '25%', right: '8%', size: 40 },
      { bottom: '30%', left: '12%', size: 50 },
      { bottom: '15%', right: '15%', size: 45 },
      { top: '50%', left: '2%', size: 35 },
      { top: '60%', right: '3%', size: 30 },
    ];

    smallCircles.forEach((circle, i) => {
      const el = document.createElement('div');
      el.className = 'auth-bg-small-circle';
      el.style.cssText = `
        position: absolute;
        width: ${circle.size}px;
        height: ${circle.size}px;
        border-radius: 50%;
        border: 1px solid rgba(37, 99, 235, 0.15);
        pointer-events: none;
        z-index: 0;
        ${circle.top !== undefined ? `top: ${circle.top};` : ''}
        ${circle.bottom !== undefined ? `bottom: ${circle.bottom};` : ''}
        ${circle.left !== undefined ? `left: ${circle.left};` : ''}
        ${circle.right !== undefined ? `right: ${circle.right};` : ''}
        animation: float-slow ${10 + i * 1.5}s ease-in-out infinite;
        animation-delay: ${i * 0.3}s;
      `;
      container.appendChild(el);
    });

    // Create dotted square patterns
    const dotPatterns = [
      { top: '20%', left: '15%', cols: 4, rows: 4, spacing: 12, dotSize: 3 },
      { bottom: '25%', right: '20%', cols: 3, rows: 3, spacing: 10, dotSize: 2.5 },
      { top: '60%', left: '8%', cols: 5, rows: 2, spacing: 14, dotSize: 2 },
    ];

    dotPatterns.forEach((pattern, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'auth-bg-dot-pattern';
      wrapper.style.cssText = `
        position: absolute;
        pointer-events: none;
        z-index: 0;
        ${pattern.top !== undefined ? `top: ${pattern.top};` : ''}
        ${pattern.bottom !== undefined ? `bottom: ${pattern.bottom};` : ''}
        ${pattern.left !== undefined ? `left: ${pattern.left};` : ''}
        ${pattern.right !== undefined ? `right: ${pattern.right};` : ''}
        display: grid;
        grid-template-columns: repeat(${pattern.cols}, ${pattern.spacing}px);
        grid-template-rows: repeat(${pattern.rows}, ${pattern.spacing}px);
        gap: 0;
        animation: float-slow ${12 + i * 2}s ease-in-out infinite;
        animation-delay: ${i * 0.4}s;
      `;

      for (let r = 0; r < pattern.rows; r++) {
        for (let c = 0; c < pattern.cols; c++) {
          const dot = document.createElement('div');
          dot.style.cssText = `
            width: ${pattern.dotSize}px;
            height: ${pattern.dotSize}px;
            border-radius: 50%;
            background: rgba(37, 99, 235, ${0.15 + Math.random() * 0.1});
            margin: auto;
          `;
          wrapper.appendChild(dot);
        }
      }
      container.appendChild(wrapper);
    });

    // Create soft gradient orbs
    const gradientOrbs = [
      { top: '10%', right: '10%', size: 300, opacity: 0.04 },
      { bottom: '10%', left: '10%', size: 250, opacity: 0.035 },
    ];

    gradientOrbs.forEach((orb, i) => {
      const el = document.createElement('div');
      el.className = 'auth-bg-gradient-orb';
      el.style.cssText = `
        position: absolute;
        width: ${orb.size}px;
        height: ${orb.size}px;
        border-radius: 50%;
        background: radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%);
        opacity: ${orb.opacity};
        filter: blur(60px);
        pointer-events: none;
        z-index: 0;
        ${orb.top !== undefined ? `top: ${orb.top};` : ''}
        ${orb.bottom !== undefined ? `bottom: ${orb.bottom};` : ''}
        ${orb.left !== undefined ? `left: ${orb.left};` : ''}
        ${orb.right !== undefined ? `right: ${orb.right};` : ''}
        animation: float-slow ${14 + i * 3}s ease-in-out infinite;
        animation-delay: ${i * 0.6}s;
      `;
      container.appendChild(el);
    });

    return () => {
      // Cleanup on unmount
      container.innerHTML = '';
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="auth-background"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Base gradient layer */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%)',
          zIndex: -1,
        }}
      />
    </div>
  );
};

export default AuthBackground;