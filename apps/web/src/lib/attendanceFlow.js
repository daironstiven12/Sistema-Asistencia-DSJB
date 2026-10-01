/* Lógica pura del flujo de asistencias (sin React).
   Se prueba con node directamente. */

export const STATUSES = [
  "Borrador",
  "Programada",
  "Abierta",
  "Cerrada",
  "Validada",
  "Firmada",
];

const TRANSITIONS = {
  Borrador: ["Programada"],
  Programada: ["Abierta", "Cerrada"],
  Abierta: ["Cerrada"],
  Cerrada: ["Validada"],
  Validada: ["Firmada"],
  Firmada: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

const REQUIRED_FIELDS = [
  "faculty",
  "program",
  "level",
  "subject",
  "subjectCode",
  "period",
  "cds",
  "group",
  "date",
  "startTime",
  "endTime",
  "teacher",
  "topic",
];

export function missingFields(form) {
  return REQUIRED_FIELDS.filter((key) => !String(form[key] ?? "").trim());
}

let draftCounter = 0;

export function resetDraftCounter() {
  draftCounter = 0;
}

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/* 2026-09-30 -> "30 de septiembre de 2026". */
export function formatDisplayDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!match) return String(iso ?? "");
  const [, year, month, day] = match;
  const name = MONTHS[Number(month) - 1] ?? month;
  return `${Number(day)} de ${name} de ${year}`;
}

/* 2026-09-30 -> "30/09/2026". */
export function formatShortDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!match) return String(iso ?? "");
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/* Solo el grupo del período activo es operativo para el representante. */
export function isActiveRecord(record, assignment) {
  return (
    record.group === assignment.group && record.period === assignment.period
  );
}

const CLOSED_STATES = ["Cerrada", "Validada", "Firmada"];

/* Resuelve un código manual contra asistencias activas.
   Devuelve { result, recordId } con result en:
   "confirm" | "duplicate" | "closed" | "invalid". */
export function resolveCode(records, code, expectedCode, studentKey, assignment) {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized || normalized !== String(expectedCode).toUpperCase()) {
    return { result: "invalid", recordId: null };
  }
  const active = records.filter((r) => isActiveRecord(r, assignment));
  const open = active.find((r) => r.status === "Abierta");
  if (open) {
    const entry = open.students.find((s) => s.key === studentKey);
    if (entry?.status === "Presente") {
      return { result: "duplicate", recordId: open.id };
    }
    return { result: "confirm", recordId: open.id };
  }
  const closed = active.filter((r) => CLOSED_STATES.includes(r.status));
  if (closed.length > 0) {
    return { result: "closed", recordId: closed[closed.length - 1].id };
  }
  return { result: "invalid", recordId: null };
}

export function nextDraftId() {
  draftCounter += 1;
  return `borrador-${String(draftCounter).padStart(3, "0")}`;
}

export function createRecord(form, id) {
  return {
    id,
    faculty: form.faculty,
    program: form.program,
    level: form.level,
    subject: form.subject,
    subjectCode: form.subjectCode,
    period: form.period,
    cds: form.cds,
    group: form.group,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    teacher: form.teacher,
    topic: form.topic,
    status: "Borrador",
    openedAt: null,
    closedAt: null,
    students: [],
    repSignature: null,
    teacherSignature: null,
    audit: [],
  };
}

export function addAudit(record, at, actor, action, detail) {
  return {
    ...record,
    audit: [...record.audit, { at, actor, action, detail: detail ?? "" }],
  };
}

export function setStatus(record, to) {
  if (!canTransition(record.status, to)) {
    return {
      ok: false,
      record,
      message: `Transición no permitida de ${record.status} a ${to}.`,
    };
  }
  return { ok: true, record: { ...record, status: to }, message: "" };
}

/* Registro normal: solo con la asistencia abierta y sin duplicados. */
export function registerStudent(record, studentKey, at, extra = {}) {
  if (record.status !== "Abierta") {
    return {
      ok: false,
      record,
      message: "La asistencia no está abierta: no acepta registros.",
    };
  }
  const found = record.students.find((s) => s.key === studentKey);
  if (!found) {
    return { ok: false, record, message: "Estudiante no encontrado." };
  }
  if (found.status === "Presente") {
    return {
      ok: false,
      record,
      message: "Este estudiante ya tiene un registro de asistencia.",
    };
  }
  const students = record.students.map((s) =>
    s.key === studentKey
      ? {
          ...s,
          status: "Presente",
          time: at,
          manual: false,
          method: extra.method ?? s.method ?? null,
          sig: extra.signature ?? s.sig ?? null,
        }
      : s,
  );
  return { ok: true, record: { ...record, students }, message: "" };
}

/* Corrección posterior al cierre: exige justificación y marca manual. */
export function addManualRecord(record, { studentKey, status, justification, at, by }) {
  if (record.status !== "Cerrada" && record.status !== "Validada") {
    return {
      ok: false,
      record,
      message: "El registro manual solo es posible tras el cierre.",
    };
  }
  if (!String(justification ?? "").trim()) {
    return {
      ok: false,
      record,
      message: "La justificación es obligatoria.",
    };
  }
  const found = record.students.find((s) => s.key === studentKey);
  if (!found) {
    return { ok: false, record, message: "Estudiante no encontrado." };
  }
  if (found.status === "Presente" && !found.manual) {
    return {
      ok: false,
      record,
      message: "Este estudiante ya tiene un registro de asistencia.",
    };
  }
  const students = record.students.map((s) =>
    s.key === studentKey
      ? {
          ...s,
          status,
          time: at,
          manual: true,
          justification: justification.trim(),
          by,
        }
      : s,
  );
  return { ok: true, record: { ...record, students }, message: "" };
}

export function sign(record, role, signature) {
  if (record.status !== "Cerrada" && record.status !== "Validada") {
    return {
      ok: false,
      record,
      message: "Solo se puede firmar una asistencia cerrada.",
    };
  }
  if (role === "docente" && signature.kind !== "upload") {
    return {
      ok: false,
      record,
      message:
        "El representante no puede firmar por el docente: solo puede cargar una imagen de firma proporcionada.",
    };
  }
  const key = role === "docente" ? "teacherSignature" : "repSignature";
  const updated = { ...record, [key]: signature };
  if (updated.repSignature && updated.teacherSignature && updated.status === "Validada") {
    updated.status = "Firmada";
  }
  return { ok: true, record: updated, message: "" };
}
