/* Datos simulados del Representante. Solo visual: sin API ni persistencia. */

export const representative = {
  name: "Jeanpier Polanco",
  initials: "JP",
  role: "Representante",
};

/* Asignación operativa: un representante, un grupo, un período activo. */
export const activeAssignment = {
  period: "2026-2",
  group: "VII - A",
  students: 36,
  program: "Ingeniería de Telecomunicaciones e Informática",
  level: "VII",
  subjects: [
    "Teoría y Técnicas de Ruteo y Switcheo",
    "Sistemas Operativos",
    "Redes de Computadores",
    "Bases de Datos",
    "Inteligencia Artificial",
  ],
  next: "Hoy · 2:00 PM · Ruteo y Switcheo",
};

export const pastAssignments = [
  { period: "2026-1", group: "VI - B", status: "Finalizado" },
];

export const quickActions = [
  { key: "prepare", label: "Preparar asistencia", hint: "Programa una sesión" },
  { key: "groups", label: "Ver mi grupo", hint: "Grupo VII-A asignado" },
  { key: "history", label: "Ver historial", hint: "Actividad reciente" },
];
