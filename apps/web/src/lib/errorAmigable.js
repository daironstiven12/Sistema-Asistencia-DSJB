import { ApiError } from "@/services/api/http";

/* Mensajes comprensibles para el representante. Nunca expone stack traces,
   errores de Prisma/SQL, nombres de restricciones, archivos internos ni
   secretos: ante cualquier contenido técnico se usa el mensaje por defecto. */

const TECNICO = [
  /prisma/i,
  /\bsql\b/i,
  /internal server error/i,
  /chk_[a-z_]+/i,
  /uq_[a-z_]+/i,
  /P20\d{2}/,
  /constraint/i,
  /foreign key/i,
  /_unique/i,
  /stack/i,
  /\.js\b/i,
  /\.ts\b/i,
  /at\s+\S+\s*\(/,
  /relation\s+"?[a-z_]+"?\s+does not exist/i,
  /violates/i,
];

export function esMensajeTecnico(texto) {
  const t = String(texto ?? "");
  if (!t.trim()) return true;
  return TECNICO.some((re) => re.test(t));
}

export function mensajeAmigable(error, defecto) {
  const crudo =
    error instanceof ApiError
      ? String(error.message ?? "")
      : String(error?.message ?? error ?? "");
  if (!crudo.trim() || esMensajeTecnico(crudo)) return defecto;
  return crudo;
}

export function defectoPorEstado(error) {
  const status = error instanceof ApiError ? error.status : null;
  switch (status) {
    case 0:
      return "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.";
    case 400:
      return "Los datos enviados no son válidos. Verifica la información e inténtalo nuevamente.";
    case 401:
      return "Tu sesión expiró. Inicia sesión nuevamente para continuar.";
    case 403:
      return "No tienes permiso para realizar esta acción con tu usuario actual.";
    case 404:
      return "La asistencia ya no está disponible. Actualiza la lista e inténtalo nuevamente.";
    case 409:
      return "Esta acción ya fue registrada anteriormente. Actualiza la información que ves en pantalla.";
    default:
      return "Se produjo un error al procesar la solicitud. Verifica la información e inténtalo nuevamente.";
  }
}
