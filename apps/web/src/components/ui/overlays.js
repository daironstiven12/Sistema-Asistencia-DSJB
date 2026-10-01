"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import styles from "./ui.module.css";

/* Diálogo modal centrado. */
export function Modal({ open, onClose, title, sub, actions, children, wide = false, narrow = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className={`${styles.overlay} ${styles.overlayCenter}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={() => onClose?.()}
    >
      <div
        className={`${styles.dialog} ${wide ? styles.dialogWide : ""} ${narrow ? styles.dialogNarrow : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.dialogHead}>
          <div>
            <h2 id="modal-title">{title}</h2>
            {sub ? <p className={styles.dialogSub}>{sub}</p> : null}
          </div>
          <button
            type="button"
            className={styles.btnIcon}
            aria-label="Cerrar"
            onClick={() => onClose?.()}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className={styles.dialogBody}>{children}</div>
        {actions ? <div className={styles.dialogActions}>{actions}</div> : null}
      </div>
    </div>,
    document.body
  );
}

/* Hoja lateral derecha (drawer). */
export function Drawer({ open, onClose, title, sub, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className={`${styles.overlay} ${styles.overlayRight}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      onClick={() => onClose?.()}
    >
      <div className={styles.drawer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.dialogHead}>
          <div>
            <h2 id="drawer-title">{title}</h2>
            {sub ? <p className={styles.dialogSub}>{sub}</p> : null}
          </div>
          <button
            type="button"
            className={styles.btnIcon}
            aria-label="Cerrar"
            onClick={() => onClose?.()}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className={styles.dialogBody}>{children}</div>
        {actions ? <div className={styles.dialogActions}>{actions}</div> : null}
      </div>
    </div>,
    document.body
  );
}

/* Diálogo de confirmación: usa el mismo lenguaje del acta. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  text,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  icon: Icon,
}) {
  return (
    <Modal open={open} onClose={onClose} narrow title={title} onConfirm={onConfirm}>
      {Icon ? (
        <span className={danger ? styles.dialogIconDanger : styles.dialogIconInfo} aria-hidden="true">
          <Icon />
        </span>
      ) : null}
      <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{text}</p>
      <div className={`${styles.dialogActions} ${styles.dialogActionsFlush}`}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={danger ? styles.btnDanger : styles.btnPrimary}
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
