/* Operación académica. Tablas: academic_groups, group_students,
   course_offerings, teaching_assignments, representative_assignments,
   attendance_sessions, attendance_records, audit_logs. */

export const grupos = [
  { id: "gru-001", nombre: "VII-A", programaId: "prog-002", nivelId: "niv-004", periodoId: "per-001", capacidad: 36, aula: "Aula 204", estado: "Activo" },
  { id: "gru-002", nombre: "VII-B", programaId: "prog-002", nivelId: "niv-004", periodoId: "per-001", capacidad: 34, aula: "Aula 205", estado: "Activo" },
  { id: "gru-003", nombre: "II-A", programaId: "prog-001", nivelId: "niv-002", periodoId: "per-001", capacidad: 30, aula: "Aula 108", estado: "Activo" },
];

/* course_offerings: asignatura abierta en un grupo y periodo. */
export const offerings = [
  { id: "ofe-001", asignaturaId: "asg-004", grupoId: "gru-001", periodoId: "per-001", docenteId: "doc-001", horario: "L-V 14:00-16:00", estado: "ACTIVE" },
  { id: "ofe-002", asignaturaId: "asg-005", grupoId: "gru-001", periodoId: "per-001", docenteId: "doc-002", horario: "L-M 16:00-18:00", estado: "ACTIVE" },
  { id: "ofe-003", asignaturaId: "asg-006", grupoId: "gru-001", periodoId: "per-001", docenteId: "doc-001", horario: "S 08:00-10:00", estado: "ACTIVE" },
  { id: "ofe-004", asignaturaId: "asg-003", grupoId: "gru-003", periodoId: "per-001", docenteId: "doc-003", horario: "M-J 10:00-12:00", estado: "ACTIVE" },
  { id: "ofe-005", asignaturaId: "asg-001", grupoId: "gru-003", periodoId: "per-001", docenteId: "doc-004", horario: "V 14:00-16:00", estado: "CLOSED" },
];

/* teaching_assignments: docente → asignatura + grupo + nivel. */
export const teachingAssignments = [
  { id: "ta-001", docenteId: "doc-001", asignaturaId: "asg-004", grupoId: "gru-001", periodoId: "per-001", estado: "Activa" },
  { id: "ta-002", docenteId: "doc-001", asignaturaId: "asg-006", grupoId: "gru-001", periodoId: "per-001", estado: "Activa" },
  { id: "ta-003", docenteId: "doc-002", asignaturaId: "asg-005", grupoId: "gru-001", periodoId: "per-001", estado: "Activa" },
  { id: "ta-004", docenteId: "doc-003", asignaturaId: "asg-003", grupoId: "gru-003", periodoId: "per-001", estado: "Activa" },
  { id: "ta-005", docenteId: "doc-004", asignaturaId: "asg-001", grupoId: "gru-003", periodoId: "per-001", estado: "Inactiva" },
];

/* representative_assignments: representante → grupo. */
export const representativeAssignments = [
  { id: "ra-001", representanteId: "rep-001", grupoId: "gru-001", periodoId: "per-001", estado: "Activa" },
  { id: "ra-002", representanteId: "rep-002", grupoId: "gru-002", periodoId: "per-001", estado: "Activa" },
  { id: "ra-003", representanteId: "rep-003", grupoId: "gru-003", periodoId: "per-001", estado: "Inactiva" },
];

/* attendance_sessions: el objeto central del dominio. */
export const attendanceSessions = [
  { id: "ses-001", offeringId: "ofe-001", grupoId: "gru-001", periodoId: "per-001", fecha: "2026-09-30", horaInicio: "14:00", horaFin: "16:00", tema: "Gestión de procesos y planificación del CPU.", estado: "Cerrada", creadoPor: "doc-001" },
  { id: "ses-002", offeringId: "ofe-002", grupoId: "gru-001", periodoId: "per-001", fecha: "2026-09-30", horaInicio: "16:00", horaFin: "18:00", tema: "Modelo OSI y direccionamiento IP.", estado: "Abierta", creadoPor: "doc-002" },
  { id: "ses-003", offeringId: "ofe-003", grupoId: "gru-001", periodoId: "per-001", fecha: "2026-10-01", horaInicio: "08:00", horaFin: "10:00", tema: "Protocolos de enrutamiento dinámico: OSPF y EIGRP.", estado: "Programada", creadoPor: "doc-001" },
  { id: "ses-004", offeringId: "ofe-004", grupoId: "gru-003", periodoId: "per-001", fecha: "2026-09-29", horaInicio: "10:00", horaFin: "12:00", tema: "Modelo relacional y álgebra relacional.", estado: "Cerrada", creadoPor: "doc-003" },
  { id: "ses-005", offeringId: "ofe-001", grupoId: "gru-001", periodoId: "per-001", fecha: "2026-10-02", horaInicio: "14:00", horaFin: "16:00", tema: "Memoria virtual y paginación.", estado: "Borrador", creadoPor: "doc-001" },
  { id: "ses-006", offeringId: "ofe-002", grupoId: "gru-001", periodoId: "per-001", fecha: "2026-09-22", horaInicio: "16:00", horaFin: "18:00", tema: "Segmentación y subredes.", estado: "Firmada", creadoPor: "doc-002" },
  { id: "ses-007", offeringId: "ofe-004", grupoId: "gru-003", periodoId: "per-001", fecha: "2026-09-15", horaInicio: "10:00", horaFin: "12:00", tema: "Índices y árboles B.", estado: "Cerrada", creadoPor: "doc-003" },
  { id: "ses-008", offeringId: "ofe-003", grupoId: "gru-001", periodoId: "per-001", fecha: "2026-09-24", horaInicio: "08:00", horaFin: "10:00", tema: "Conmutación de capa 2 y STP.", estado: "Validada", creadoPor: "doc-001" },
];

/* attendance_records: un registro por estudiante y sesión. `metodo` es el
   canal de registro (QR, CODE o MANUAL); `manual` lo marca para que el
   reporte de registros manuales lo filtre sin recorrer el método. */
const PRESENTES = 0.82;
export const attendanceRecords = attendanceSessions.flatMap((session, si) => {
  const total = 20 + (si % 3) * 4;
  return Array.from({ length: total }).map((_, i) => {
    const presente = (i * 7 + si * 3) % 100 < PRESENTES * 100;
    const manual = presente && (i * 11 + si) % 13 === 0;
    const metodo = manual ? "MANUAL" : (i + si) % 3 === 0 ? "CODE" : "QR";
    return {
      id: `rec-${session.id}-${i + 1}`,
      sesionId: session.id,
      estudianteId: `est-${String((i % 20) + 1).padStart(3, "0")}`,
      estado: presente ? "Presente" : "Ausente",
      hora: presente ? `${String(14 + Math.floor(i / 12)).padStart(2, "0")}:${String((i * 5) % 60).padStart(2, "0")}` : "—",
      metodo,
      manual,
      justificacion: manual && presente ? "Registro corregido por coordinación." : "",
      firmaId: presente && i % 4 === 0 ? `fir-00${(si % 2) + 1}` : null,
    };
  });
});

/* attendance_record_signatures: evidencia de firma sobre un registro. */
export const recordSignatures = attendanceRecords
  .filter((r) => r.firmaId)
  .map((r, i) => ({
    id: `rsr-${String(i + 1).padStart(3, "0")}`,
    recordId: r.id,
    sesionId: r.sesionId,
    firmaId: r.firmaId,
    firmadoEn: "2026-09-30 15:20",
    rol: "Estudiante",
  }));

/* attendance_session_signatures: firma del acta por sesión, según el rol
   que interviene en cada estado del flujo. */
export const sessionSignatures = [
  { id: "sss-001", sesionId: "ses-006", rol: "Docente", firmaId: "fir-001", firmadoEn: "2026-09-22 18:05", estado: "Firmada" },
  { id: "sss-002", sesionId: "ses-006", rol: "Representante", firmaId: "fir-002", firmadoEn: "2026-09-22 19:10", estado: "Firmada" },
  { id: "sss-003", sesionId: "ses-008", rol: "Docente", firmaId: "fir-001", firmadoEn: "2026-09-24 17:40", estado: "Firmada" },
  { id: "sss-004", sesionId: "ses-008", rol: "Representante", firmaId: null, firmadoEn: null, estado: "Pendiente" },
  { id: "sss-005", sesionId: "ses-001", rol: "Docente", firmaId: "fir-001", firmadoEn: "2026-09-30 16:20", estado: "Firmada" },
  { id: "sss-006", sesionId: "ses-001", rol: "Representante", firmaId: null, firmadoEn: null, estado: "Pendiente" },
];

/* audit_logs. */
export const auditLogs = [
  { id: "log-001", usuario: "Coordinación Académica", rol: "Administrador", accion: "Creó", modulo: "Asignaturas", entidad: "Sistemas Operativos", descripcion: "Alta de asignatura con 4 créditos.", fecha: "2026-09-30", hora: "08:12" },
  { id: "log-002", usuario: "Dr. Carlos Andrés Meza", rol: "Docente", accion: "Abrió", modulo: "Asistencias", entidad: "Sistemas Operativos · VII-A", descripcion: "Sesión abierta para registro de estudiantes.", fecha: "2026-09-30", hora: "14:02" },
  { id: "log-003", usuario: "Dr. Carlos Andrés Meza", rol: "Docente", accion: "Cerró", modulo: "Asistencias", entidad: "Sistemas Operativos · VII-A", descripcion: "Cierre de sesión con 28 de 36 presentes.", fecha: "2026-09-30", hora: "16:01" },
  { id: "log-004", usuario: "Jeanpier Polanco", rol: "Representante", accion: "Validó", modulo: "Asistencias", entidad: "Redes de Computadores · VII-A", descripcion: "Revisión de registros previa a firma.", fecha: "2026-09-29", hora: "17:24" },
  { id: "log-005", usuario: "Coordinación Académica", rol: "Administrador", accion: "Asignó", modulo: "Grupos", entidad: "VII-A", descripcion: "34 estudiantes inscritos en el grupo.", fecha: "2026-09-28", hora: "09:40" },
  { id: "log-006", usuario: "Dra. María Fernanda Rentería", rol: "Docente", accion: "Programó", modulo: "Asistencias", entidad: "Redes de Computadores · VII-A", descripcion: "Sesión programada para el 1 de octubre.", fecha: "2026-09-28", hora: "11:15" },
  { id: "log-007", usuario: "Coordinación Académica", rol: "Administrador", accion: "Desactivó", modulo: "Asignaturas", entidad: "Inteligencia Artificial", descripcion: "Asignatura retirada del plan 2026-2.", fecha: "2026-09-25", hora: "15:03" },
  { id: "log-008", usuario: "Coordinación Académica", rol: "Administrador", accion: "Creó", modulo: "Periodos", entidad: "2027-1", descripcion: "Periodo académico creado con estado Próximo.", fecha: "2026-09-24", hora: "10:00" },
  { id: "log-009", usuario: "Lic. Nayra Acosta Palacios", rol: "Docente", accion: "Actualizó", modulo: "Usuarios", entidad: "per-005", descripcion: "Actualizó su número de contacto.", fecha: "2026-09-22", hora: "16:48" },
  { id: "log-010", usuario: "Coordinación Académica", rol: "Administrador", accion: "Reactivó", modulo: "Facultades", entidad: "Facultad de Educación", descripcion: "Facultad reabierta para el periodo 2026-2.", fecha: "2026-09-20", hora: "08:55" },
];
