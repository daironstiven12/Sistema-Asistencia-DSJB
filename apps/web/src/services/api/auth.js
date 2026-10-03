/* Sesión real contra /auth del backend.
   Guarda únicamente accessToken (clave "sa.accessToken", compatible con
   http.js) y datos mínimos de navegación (id, username, roles). Nada de
   secretos: el refresh token vive en cookie HttpOnly del backend. */

import { apiRequest, getAccessToken } from "./http";
import { ROLE_META, ROLES } from "@/features/shared/roleConfig";

const TOKEN_KEY = "sa.accessToken";
const SESSION_KEY = "sa.session";

/* Evento mismo-pestaña: "storage" solo avisa a OTRAS pestañas. */
export const EVENTO_SESION = "sa:session-changed";

export function notificarCambioSesion() {
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_SESION));
  } catch {
    /* entorno sin DOM */
  }
}

const ROL_A_CLAVE = {
  ADMINISTRADOR: ROLES.ADMIN,
  DOCENTE: ROLES.DOCENTE,
  REPRESENTANTE: ROLES.REPRESENTANTE,
  ESTUDIANTE: ROLES.ESTUDIANTE,
};

function guardarSesion({ accessToken, user }) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const minimal = {
    id: user?.id ?? null,
    username: user?.username ?? "",
    email: user?.email ?? null,
    roles,
  };
  try {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(minimal));
    notificarCambioSesion();
  } catch {
    /* almacenamiento no disponible: la sesión queda solo en memoria. */
  }
  return minimal;
}

export function leerSesion() {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const raw = window.localStorage.getItem(SESSION_KEY);
    return { token, user: raw ? JSON.parse(raw) : null };
  } catch {
    return { token: getAccessToken(), user: null };
  }
}

export function cerrarSesionLocal() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    notificarCambioSesion();
  } catch {
    /* nada que limpiar */
  }
}

/* Destino post-login según el primer rol conocido (orden del backend). */
export function rutaPorRol(roles) {
  const rol = (Array.isArray(roles) ? roles : []).find((r) => ROL_A_CLAVE[r]);
  const clave = (rol && ROL_A_CLAVE[rol]) || ROLES.REPRESENTANTE;
  return ROLE_META[clave].home;
}

export const authApi = {
  /* POST /auth/login → { accessToken, user }. Identificador: correo. */
  async login({ email, password }) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: String(email ?? "").trim(), password },
    });
    if (!data?.accessToken || !data?.user) {
      throw new Error("Respuesta de autenticación incompleta.");
    }
    const user = guardarSesion(data);
    return { token: data.accessToken, user, home: rutaPorRol(user.roles) };
  },

  /* Catálogo real de tipos de identificación para el registro. */
  async identificationTypes() {
    const rows = await apiRequest("/auth/identification-types");
    return Array.isArray(rows) ? rows : [];
  },

  /* POST /auth/register/student → cuenta básica de estudiante
     (sin auto-login). Payload mínimo: sin identificación, sin rol. */
  async registerStudent({ email, password, firstName, lastName }) {
    return apiRequest("/auth/register/student", {
      method: "POST",
      body: {
        email: String(email ?? "").trim(),
        password,
        firstName: String(firstName ?? "").trim(),
        lastName: String(lastName ?? "").trim(),
      },
    });
  },

  /* Preparación para refresh: renueva el access usando la cookie de sesión.
     Todavía sin reintento automático; las pantallas P0 usan el token guardado. */
  async refresh() {
    const data = await apiRequest("/auth/refresh", { method: "POST" });
    if (!data?.accessToken) throw new Error("Sesión inválida.");
    try {
      window.localStorage.setItem(TOKEN_KEY, data.accessToken);
    } catch {
      /* nada */
    }
    return data.accessToken;
  },

  async logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      /* aunque falle en red, se limpia lo local */
    }
    cerrarSesionLocal();
  },
};
