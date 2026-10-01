/* Notificaciones mock del estudiante, derivadas del estado del prototipo. */

const CLOSED_STATES = ["Cerrada", "Validada", "Firmada"];

export function buildNotifications(records, studentKey, hasSignature) {
  const items = [];
  if (hasSignature) {
    items.push({
      id: "firma",
      kind: "ok",
      title: "Tu firma fue guardada correctamente.",
      detail: "Se asociará a tus próximos registros.",
    });
  }
  [...records].reverse().forEach((record) => {
    const entry = record.students.find((s) => s.key === studentKey);
    if (!entry) return;
    if (entry.status === "Presente") {
      items.push({
        id: `presente-${record.id}`,
        kind: "ok",
        title: "Tu asistencia fue registrada correctamente.",
        detail: `${record.subject} · ${record.date}${entry.time && entry.time !== "—" ? ` · ${entry.time}` : ""}`,
      });
    } else if (CLOSED_STATES.includes(record.status)) {
      items.push({
        id: `ausente-${record.id}`,
        kind: "warn",
        title: `No asististe a la clase de ${record.subject}.`,
        detail: `${record.date}`,
      });
    }
  });
  return items.slice(0, 5);
}
