/* Adaptador entre la máquina de estados y el modelo de datos normalizado.

   `attendanceFlow` es la fuente de la lógica de transiciones y trabaja con
   `record.status` + `record.students`. El estado normalizado usa
   `estado` + la colección `records`. Este módulo traduce en ambos sentidos
   para no duplicar las reglas ni alterar la máquina existente. */

import { canTransition, setStatus, STATUSES } from "@/lib/attendanceFlow";

/* Aplica una transición sobre una sesión normalizada. */
export function transicionarSesion(sesion, to) {
  const resultado = setStatus({ ...sesion, status: sesion.estado }, to);
  if (!resultado.ok) return { ok: false, sesion, message: resultado.message };
  const { status, ...resto } = resultado.record;
  return { ok: true, sesion: { ...resto, estado: status }, message: "" };
}

export function puedeTransicionar(estado, to) {
  return canTransition(estado, to);
}

/* Siguiente estado alcanzable: la primera transición válida en la lista. */
export function siguienteEstado(estado) {
  const orden = ["Programada", "Abierta", "Cerrada", "Validada", "Firmada"];
  return orden.find((to) => canTransition(estado, to)) ?? null;
}

/* Todas las transiciones posibles desde el estado actual. */
export function transicionesDesde(estado) {
  return STATUSES.filter((to) => canTransition(estado, to));
}

export { STATUSES };
