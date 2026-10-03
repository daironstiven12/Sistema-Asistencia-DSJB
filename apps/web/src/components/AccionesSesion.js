"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Clock, LogOut, Settings, Users, X } from "lucide-react";
import { authApi } from "@/services/api/auth";
import styles from "./AccionesSesion.module.css";

/* Acciones del encabezado del detalle: campana de notificaciones y menú
   de perfil. Solo datos reales (sesión + registros del API). Sin tabla
   de notificaciones en el backend: el panel deriva de los registros
   existentes y se actualiza con cada recarga. */

function useCerrarAlExterior(abierto, onCerrar) {
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onCerrar();
    }
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onCerrar();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [abierto, onCerrar]);
  return ref;
}

export default function AccionesSesion({ sesion, registros, usuario }) {
  const router = useRouter();
  const [panel, setPanel] = useState(null);
  const [saliendo, setSaliendo] = useState(false);
  const cerrar = () => setPanel(null);
  const ref = useCerrarAlExterior(panel !== null, cerrar);

  async function cerrarSesion() {
    if (saliendo) return;
    setSaliendo(true);
    try {
      await authApi.logout();
    } finally {
      router.push("/");
    }
  }

  const total = Array.isArray(registros) ? registros.length : 0;
  const ultimo = total > 0 ? registros[total - 1] : null;
  const hayActividad = sesion?.status === "Abierta" && total > 0;
  const nombre = usuario?.nombre ?? "Usuario";
  const iniciales = usuario?.iniciales ?? "U";
  const rol = usuario?.rol ?? "Representante";

  return (
    <div className={styles.acciones} ref={ref}>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Notificaciones"
        aria-expanded={panel === "notis"}
        onClick={() => setPanel(panel === "notis" ? null : "notis")}
      >
        <Bell aria-hidden="true" />
        {hayActividad ? <i className={styles.dot} aria-hidden="true" /> : null}
      </button>

      <button
        type="button"
        className={styles.perfilBtn}
        aria-label="Menú de perfil"
        aria-expanded={panel === "perfil"}
        onClick={() => setPanel(panel === "perfil" ? null : "perfil")}
      >
        <span className={styles.avatar} aria-hidden="true">
          {iniciales}
        </span>
      </button>

      {panel === "notis" ? (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.panelHead}>
            <strong>Notificaciones</strong>
            <button type="button" className={styles.x} aria-label="Cerrar notificaciones" onClick={cerrar}>
              <X aria-hidden="true" />
            </button>
          </div>
          <ul className={styles.lista}>
            <li>
              <span className={styles.itemIcon} aria-hidden="true">
                <Users />
              </span>
              <span className={styles.itemText}>
                <b>{total === 0 ? "Sin registros todavía" : `${total} registro${total === 1 ? "" : "s"} en esta sesión`}</b>
                <small>
                  {total === 0
                    ? "Los estudiantes aparecerán aquí al registrarse"
                    : "Estudiantes que ya registraron su asistencia"}
                </small>
              </span>
            </li>
            {ultimo ? (
              <li>
                <span className={styles.itemIcon} aria-hidden="true">
                  <Clock />
                </span>
                <span className={styles.itemText}>
                  <b>Último registro: {ultimo.nombre}</b>
                  <small>{ultimo.hora && ultimo.hora !== "—" ? `Hora ${ultimo.hora}` : "Registro manual o sin hora"}</small>
                </span>
              </li>
            ) : null}
            <li>
              <span className={styles.itemIcon} aria-hidden="true">
                <CheckCheck />
              </span>
              <span className={styles.itemText}>
                <b>Estado actual: {sesion?.status ?? "—"}</b>
                <small>{sesion?.subject ?? ""}{sesion?.group ? ` · ${sesion.group}` : ""}</small>
              </span>
            </li>
          </ul>
          <p className={styles.panelFoot}>No hay más notificaciones</p>
        </div>
      ) : null}

      {panel === "perfil" ? (
        <div className={styles.panel} role="dialog" aria-label="Menú de perfil">
          <div className={styles.perfilHead}>
            <span className={styles.avatarGrande} aria-hidden="true">
              {iniciales}
            </span>
            <span className={styles.perfilText}>
              <strong>{nombre}</strong>
              <small>{rol}</small>
            </span>
          </div>
          <Link href="/configuracion" className={styles.menuItem} onClick={cerrar}>
            <Settings aria-hidden="true" />
            Configuración
          </Link>
          <button
            type="button"
            className={`${styles.menuItem} ${styles.salir}`}
            onClick={cerrarSesion}
            disabled={saliendo}
          >
            <LogOut aria-hidden="true" />
            {saliendo ? "Cerrando…" : "Cerrar sesión"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
