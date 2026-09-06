import { useEffect, useState } from 'react';
import './widgets.css';

/**
 * Reusable confirmation dialog.
 *
 * Used for destructive actions (delete product, delete account). Supports:
 * - danger styling
 * - a "type to confirm" phrase (e.g. type DELETE)
 * - extra children rendered between the message and actions (e.g. a password
 *   field for account deletion)
 * - busy state while the destructive mutation is in flight
 */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  requireText = null,
  busy = false,
  onConfirm,
  onCancel,
  children,
}) {
  const [typed, setTyped] = useState('');

  // Reset the typed confirmation each time the dialog opens.
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  // Escape closes (unless a request is in flight).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmed = !requireText || typed.trim() === requireText;

  return (
    <div
      className="sd-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel?.();
      }}
    >
      <div className="sd-modal">
        <h2 className="sd-modal-title">{title}</h2>
        {message && <p className="sd-modal-message">{message}</p>}

        {requireText && (
          <div className="sd-field">
            <label htmlFor="confirm-typed-input">
              Type <strong>{requireText}</strong> to confirm
            </label>
            <input
              id="confirm-typed-input"
              type="text"
              value={typed}
              autoComplete="off"
              spellCheck="false"
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireText}
            />
          </div>
        )}

        {children}

        <div className="sd-modal-actions">
          <button type="button" className="sd-btn sd-btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`sd-btn ${danger ? 'sd-btn-danger' : 'sd-btn-primary'}`}
            onClick={onConfirm}
            disabled={busy || !confirmed}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
