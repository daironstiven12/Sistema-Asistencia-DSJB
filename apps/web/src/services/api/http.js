/* Cliente HTTP base para la API real (NestJS).
   Base centralizada: NEXT_PUBLIC_API_URL o http://localhost:3001 por defecto.
   El accessToken se lee de localStorage (clave "sa.accessToken") en cada
   petición; lo establecerá la futura integración del login. Nunca se
   hardcodea ningún token ni secreto en el código. */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const TOKEN_KEY = "sa.accessToken";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function defaultMessage(status) {
  switch (status) {
    case 400:
      return "Datos inválidos. Revisa los campos del formulario.";
    case 401:
      return "No autenticado. Inicia sesión nuevamente para continuar.";
    case 403:
      return "No tienes permiso para realizar esta acción (se requiere ADMINISTRADOR).";
    case 404:
      return "Registro no encontrado.";
    case 409:
      return "Registro duplicado. Ya existe una institución con esos datos.";
    default:
      return "Error interno. Intenta nuevamente más tarde.";
  }
}

export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = getAccessToken();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // include: la sesión refresh viaja en cookie HttpOnly (SameSite/path /auth).
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(
      0,
      "No se pudo conectar con la API. Verifica que el backend esté en ejecución.",
    );
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data.message === "string" && data.message.length > 0
        ? data.message
        : defaultMessage(response.status);
    throw new ApiError(response.status, message);
  }
  return data;
}
