/* Selector de rol. Compartido por el shell nuevo y el del representante
   para que ambos paneles ofrezcan la misma forma de cambiar de identidad. */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, UsersRound } from "lucide-react";
import { ROLES, ROLE_META } from "./roleConfig";
import styles from "./RoleSwitcher.module.css";

export const ROLE_ROUTES = [
  { role: ROLES.ADMIN, href: "/admin" },
  { role: ROLES.DOCENTE, href: "/docente" },
  { role: ROLES.REPRESENTANTE, href: "/inicio" },
  { role: ROLES.ESTUDIANTE, href: "/estudiante" },
];

export default function RoleSwitcher({ current }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  /* Cierra al hacer clic fuera o con Escape: un menú que queda abierto
     tapa la vista y no responde al teclado. */
  useEffect(() => {
    if (!open) return;
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.roleSwitch} ref={ref}>
      <button
        type="button"
        className={styles.roleButton}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <UsersRound aria-hidden="true" />
        <span>Cambiar rol</span>
      </button>
      {open ? (
        <div className={styles.roleMenu} role="menu">
          {ROLE_ROUTES.map((entry) => {
            const option = ROLE_META[entry.role];
            const isCurrent = entry.role === current;
            return (
              <Link
                key={entry.role}
                href={entry.href}
                role="menuitem"
                className={`${styles.roleOption} ${isCurrent ? styles.roleOptionActive : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {option.persona.iniciales}
                </span>
                <span className={styles.roleOptionText}>
                  <strong>{option.label}</strong>
                  <small>{option.persona.nombre}</small>
                </span>
                {isCurrent ? <Check className={styles.roleOptionMark} aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
