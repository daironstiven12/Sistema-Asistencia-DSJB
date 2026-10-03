"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./SessionModal.module.css";

/* Sistema reutilizable de modales del representante.
   Variantes (tone): confirm | success | error | info | warn | form.
   - Overlay con blur, tarjeta centrada, animación corta.
   - ESC y clic en overlay cierran solo cuando es seguro (no busy/persistent).
   - Bloquea el scroll del body y enfoca la acción principal. */

export function SessionModal({
  open,
  onClose,
  title,
  sub,
  icon: Icon,
  tone = "info",
  actions,
  children,
  busy = false,
  persistent = false,
  hideClose = false,
  flushActions = false,
}) {
  const cardRef = useRef(null);
  const canClose = !busy && !persistent;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && canClose) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const target =
        cardRef.current?.querySelector("[data-autofocus]") ??
        cardRef.current?.querySelector("button:not([disabled]), textarea, input");
      target?.focus?.({ preventScroll: true });
    }, 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose, canClose]);

  if (!open) return null;
  const toneClass =
    tone === "success"
      ? styles.toneSuccess
      : tone === "error"
        ? styles.toneError
        : tone === "warn"
          ? styles.toneWarn
          : tone === "form"
            ? styles.toneForm
            : tone === "confirm"
              ? styles.toneConfirm
              : styles.toneInfo;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={() => {
        if (canClose) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        className={`${styles.card} ${toneClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <div className={styles.titleWrap}>
            {Icon ? (
              <span className={styles.icon} aria-hidden="true">
                <Icon />
              </span>
            ) : null}
            <div>
              <h2 className={styles.title}>{title}</h2>
              {sub ? <p className={styles.sub}>{sub}</p> : null}
            </div>
          </div>
          {!hideClose && canClose ? (
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Cerrar"
              onClick={() => onClose?.()}
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {children ? <div className={styles.body}>{children}</div> : null}
        {actions ? (
          <div className={`${styles.actions} ${flushActions ? styles.actionsFlush : ""}`}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* Confirmación de acciones con riesgo de cambio de estado. */
export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  detail,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  icon: Icon,
}) {
  return (
    <SessionModal
      open={open}
      onClose={onCancel}
      title={title}
      tone="confirm"
      icon={Icon}
      busy={busy}
      actions={
        <>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-autofocus
            className={danger ? styles.btnDanger : styles.btnPrimary}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
      {detail ? <p className={styles.detail}>{detail}</p> : null}
    </SessionModal>
  );
}

/* Resultado: éxito, error o información. Un solo botón principal. */
export function ResultModal({
  open,
  onClose,
  tone = "success",
  title,
  message,
  detail,
  actionLabel = "Continuar",
  actionHref,
  icon: Icon,
}) {
  return (
    <SessionModal
      open={open}
      onClose={onClose}
      title={title}
      tone={tone}
      icon={Icon}
      actions={
        actionHref ? (
          <a href={actionHref} data-autofocus className={styles.btnPrimary}>
            {actionLabel}
          </a>
        ) : (
          <button
            type="button"
            data-autofocus
            className={styles.btnPrimary}
            onClick={onClose}
          >
            {actionLabel}
          </button>
        )
      }
    >
      <p>{message}</p>
      {detail ? <p className={styles.detail}>{detail}</p> : null}
    </SessionModal>
  );
}
