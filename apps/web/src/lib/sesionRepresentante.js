"use client";

import { EVENTO_SESION } from "@/services/api/auth";

/* Datos reales del usuario autenticado (localStorage "sa.session",
   guardado por authApi.login). Sin mocks ni nombres hardcodeados. */

function capitalizar(fragmento) {
  const f = String(fragmento ?? "").trim();
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : "";
}

export function nombreDesdeUsername(username) {
  const partes = String(username ?? "")
    .split(/[. _-]+/)
    .filter(Boolean)
    .map(capitalizar);
  return partes.length > 0 ? partes.join(" ") : "Usuario";
}

export function inicialesDe(nombre) {
  const partes = String(nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

export function rolPrincipal(roles) {
  const lista = Array.isArray(roles) ? roles : [];
  return lista.length > 0 ? lista[0] : "";
}

/* Snapshot para useSyncExternalStore: el VALOR RAW de sa.session
   (string primitivo o null). React lo compara por valor: estable entre
   renders mientras la sesión no cambie. Nunca se crea un objeto aquí. */
export function leerSnapshotSesion() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("sa.session");
  } catch {
    return null;
  }
}

/* Suscripción estable: avisa en cambios de la misma pestaña (evento
   propio, porque "storage" solo llega a otras pestañas) y entre pestañas. */
export function suscribirSesion(notificar) {
  window.addEventListener("storage", notificar);
  window.addEventListener(EVENTO_SESION, notificar);
  return () => {
    window.removeEventListener("storage", notificar);
    window.removeEventListener(EVENTO_SESION, notificar);
  };
}

/* Deriva el usuario visible desde el snapshot (uso con useMemo). */
export function usuarioDesdeSnapshot(raw) {
  if (!raw) return null;
  let user = null;
  try {
    const parsed = JSON.parse(raw);
    user = parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
  if (!user) return null;
  const nombre = nombreDesdeUsername(user.username);
  return {
    id: user.id ?? null,
    username: user.username ?? "",
    nombre,
    iniciales: inicialesDe(nombre),
    roles: Array.isArray(user.roles) ? user.roles : [],
    rol: rolPrincipal(user.roles),
  };
}

export function leerUsuarioSesion() {
  return usuarioDesdeSnapshot(leerSnapshotSesion());
}
