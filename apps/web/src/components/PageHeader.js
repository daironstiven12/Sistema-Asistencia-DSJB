"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Bell } from "lucide-react";
import {
  leerSnapshotSesion,
  suscribirSesion,
  usuarioDesdeSnapshot,
} from "@/lib/sesionRepresentante";
import styles from "./PageHeader.module.css";

/* Encabezado de la sección: título, descripción y zona de usuario con
   datos REALES de la sesión (sin nombres hardcodeados). */
export default function PageHeader({ title, subtitle }) {
  const snapshot = useSyncExternalStore(suscribirSesion, leerSnapshotSesion, () => null);
  const usuario = useMemo(() => usuarioDesdeSnapshot(snapshot), [snapshot]);

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
      </div>
      <div className={styles.right}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Notificaciones"
        >
          <Bell aria-hidden="true" />
        </button>
        <span className={styles.divider} aria-hidden="true" />
        {usuario ? (
          <>
            <span className={styles.userText}>
              <strong>{usuario.nombre}</strong>
              <small>{usuario.rol || "Representante"}</small>
            </span>
            <span className={styles.avatar} aria-hidden="true">
              {usuario.iniciales}
            </span>
          </>
        ) : (
          <>
            <span className={styles.userText} aria-hidden="true">
              <strong>···</strong>
            </span>
            <span className={styles.avatar} aria-hidden="true" />
          </>
        )}
      </div>
    </header>
  );
}
