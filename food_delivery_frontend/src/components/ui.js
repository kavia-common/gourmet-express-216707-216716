import React, { useEffect } from "react";

// PUBLIC_INTERFACE
export function Card({ title, right, children, footer }) {
  /** Retro card container with optional title/right/footer. */
  return (
    <section className="card">
      {(title || right) && (
        <div className="card-title">
          <div style={{ fontWeight: 900 }}>{title}</div>
          <div>{right}</div>
        </div>
      )}
      {children}
      {footer ? <div style={{ marginTop: 12 }}>{footer}</div> : null}
    </section>
  );
}

// PUBLIC_INTERFACE
export function Modal({ open, title, children, footer, onClose }) {
  /** Accessible modal dialog with overlay; closes on Escape and overlay click. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        // Only close if clicking the overlay, not inside the modal content
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title || "Dialog"}>
        <div className="modal-header">
          <div className="row">
            <div style={{ fontWeight: 900 }}>{title}</div>
            <button className="btn btn-sm" onClick={onClose} aria-label="Close dialog">
              Close
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function Toast({ open, title, message, onClose }) {
  /** Minimal toast; auto-closes after 3.2s. */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onClose?.(), 3200);
    return () => window.clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <div>
        <div className="row">
          <div className="toast-title">{title}</div>
          <button className="btn btn-sm" onClick={onClose}>
            Dismiss
          </button>
        </div>
        <div className="toast-msg">{message}</div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function StatusBadge({ status }) {
  /** Display a color-coded badge for order status strings. */
  const normalized = (status || "").toUpperCase();
  let cls = "badge primary";
  if (["DELIVERED", "COMPLETED"].includes(normalized)) cls = "badge success";
  if (["CANCELLED", "FAILED"].includes(normalized)) cls = "badge danger";
  if (["OUT_FOR_DELIVERY"].includes(normalized)) cls = "badge warning";

  return (
    <span className={cls} title={normalized}>
      <span className="dot" />
      {normalized || "UNKNOWN"}
    </span>
  );
}
