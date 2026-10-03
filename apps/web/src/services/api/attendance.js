/* Adaptador Asistencias ↔ API real (/attendance).
   Mapea filas Prisma (snake_case, estados en mayúsculas) al modelo visual
   del panel (Borrador/Abierta/Cerrada/Firmada). Solo columnas reales. */

import { apiRequest } from "./http";

export const ESTADO_ES = {
  BORRADOR: "Borrador",
  ABIERTA: "Abierta",
  CERRADA: "Cerrada",
  FIRMADA: "Firmada",
};

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

function fmtHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function nombrePersona(persons) {
  if (!persons) return "—";
  return [
    persons.first_name,
    persons.middle_name,
    persons.last_name,
    persons.second_last_name,
  ]
    .filter(Boolean)
    .join(" ") || "—";
}

/* Valor para el acta: conserva el fallback histórico ("") cuando el dato
   no está disponible, en lugar de pintar el marcador "—" de la UI. */
export function valorActa(valor) {
  const texto = String(valor ?? "").trim();
  return texto && texto !== "—" ? texto : "";
}

export function toSesion(s) {
  const rawOffering = s.course_offerings ?? {};
  const vinculo = rawOffering.curriculum_subjects ?? {};
  const asignatura = vinculo.subjects ?? {};
  const docente = s.users_attendance_sessions_teacher_user_idTousers?.persons ?? null;
  return {
    id: String(s.id),
    courseOfferingId:
      s.course_offering_id != null
        ? String(s.course_offering_id)
        : (s.courseOfferingId != null ? String(s.courseOfferingId) : (rawOffering.id != null ? String(rawOffering.id) : null)),
    subject: asignatura.name ?? "—",
    subjectCode: asignatura.code ?? "",
    group: rawOffering.academic_groups?.name ?? "—",
    period: rawOffering.academic_periods?.name ?? "",
    date: fmtFecha(s.session_date),
    startTime: fmtHora(s.start_time),
    endTime: fmtHora(s.end_time),
    topics: s.topics ?? "",
    status: ESTADO_ES[s.attendance_statuses?.code] ?? s.attendance_statuses?.code ?? "—",
    statusCode: s.attendance_statuses?.code ?? null,
    facultad: rawOffering.academic_groups?.academic_programs?.faculties?.name ?? "—",
    docente: nombrePersona(docente),
    code: s.attendance_code ?? null,
    openedAt: s.opened_at ?? null,
    closedAt: s.closed_at ?? null,
  };
}

export function toRegistro(r) {
  const estudiante = r.students ?? {};
  const firmaLink = r.attendance_record_signatures ?? null;
  return {
    id: String(r.id),
    nombre: nombrePersona(estudiante.persons),
    identificacion: estudiante.persons?.identification_number ?? "—",
    hora: fmtHora(r.registered_at),
    metodo: r.attendance_registration_methods?.code ?? r.attendance_registration_methods?.name ?? "—",
    manual: Boolean(r.is_manual),
    motivo: r.manual_reason ?? "",
    firmado: Boolean(r.attendance_record_signatures),
    // Firma del acta para el PDF: snapshot congelado + tipo (DRAWN/TYPED/
    // UPLOAD). Null cuando el registro no tiene firma (celda vacía).
    firma: firmaLink?.signature_snapshot ?? null,
    tipoFirma: firmaLink?.signatures?.signature_type ?? null,
  };
}

export const attendanceApi = {
  async listOfferings() {
    const rows = await apiRequest("/attendance/offerings");
    return Array.isArray(rows) ? rows : [];
  },

  async list() {
    const rows = await apiRequest("/attendance/sessions");
    return (Array.isArray(rows) ? rows : []).map(toSesion);
  },

  /* GET /attendance/history?page=&pageSize=&status=&dateFrom=&dateTo=
     &courseOfferingId=&search= → { items, pagination }. Filtros y
     paginación se ejecutan en el backend, nunca en React. */
  async history({ page = 1, pageSize = 10, status, dateFrom, dateTo, courseOfferingId, search } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (courseOfferingId) params.set("courseOfferingId", String(courseOfferingId));
    if (search && String(search).trim()) params.set("search", String(search).trim());
    const data = await apiRequest(`/attendance/history?${params.toString()}`);
    const items = Array.isArray(data?.items)
      ? data.items.map((s) => ({ ...toSesion(s), recordsCount: s?._count?.attendance_records ?? 0 }))
      : [];
    const pagination = data?.pagination ?? {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    return { items, pagination };
  },

  async get(id) {
    return toSesion(await apiRequest(`/attendance/sessions/${id}`));
  },

  async create({ courseOfferingId, sessionDate, startTime, endTime, topics }) {
    const payload = { courseOfferingId, sessionDate, startTime, endTime };
    if (topics && topics.trim()) payload.topics = topics.trim();
    return toSesion(
      await apiRequest("/attendance/sessions", { method: "POST", body: payload }),
    );
  },

  async open(id) {
    return toSesion(await apiRequest(`/attendance/sessions/${id}/open`, { method: "POST" }));
  },

  async close(id) {
    return toSesion(await apiRequest(`/attendance/sessions/${id}/close`, { method: "POST" }));
  },

  async records(sessionId) {
    const rows = await apiRequest(`/attendance/sessions/${sessionId}/records`);
    return (Array.isArray(rows) ? rows : []).map(toRegistro);
  },

  /* Firmas del acta de la sesión (representante): rol, firmante, snapshot
     y fecha. Solo lectura; sin datos sensibles adicionales. */
  async sessionSignatures(sessionId) {
    const rows = await apiRequest(`/attendance/sessions/${sessionId}/signatures`);
    return Array.isArray(rows) ? rows : [];
  },

  async sign(sessionId, { signatureType, signatureData, mimeType }) {
    const payload = { signatureType };
    if (signatureData) payload.signatureData = signatureData;
    if (mimeType) payload.mimeType = mimeType;
    const out = await apiRequest(`/attendance/sessions/${sessionId}/sign`, {
      method: "POST",
      body: payload,
    });
    return { firma: out?.signature ?? null, sesion: out?.session ? toSesion(out.session) : null };
  },

  /* Solo TEMAS TRATADOS: el backend acepta únicamente `topics` (whitelist). */
  async updateTopics(id, topics) {
    return toSesion(
      await apiRequest(`/attendance/sessions/${id}`, {
        method: "PATCH",
        body: { topics },
      }),
    );
  },
};
