const { ROLES } = require("../../../auth/domain/roles");
const { ABIERTA, BORRADOR, CERRADA, FIRMADA, assertTransition } = require("../../domain/attendance-status");
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceNotFoundError,
} = require("../attendance-errors");

function isAdmin(roles) {
  return (roles ?? []).includes(ROLES.ADMINISTRADOR);
}

function isRepresentative(roles) {
  return (roles ?? []).includes(ROLES.REPRESENTANTE);
}

function sessionStatusOf(session) {
  return session?.attendance_statuses?.code;
}

function assertOwnerOrAdmin(session, { userId, roles }) {
  if (isAdmin(roles)) return;
  if (String(session?.representative_user_id) !== String(userId)) {
    throw new AttendanceForbiddenError();
  }
}

function toDateOnly(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new AttendanceConflictError("INVALID_DATE");
  return date;
}

function toTimeOnly(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? ""));
  if (!match) throw new AttendanceConflictError("INVALID_TIME");
  return new Date(`1970-01-01T${match[1]}:${match[2]}:00.000Z`);
}

// La BD exige end_time > start_time (chk_attendance_session_time).
// Se valida aquí para devolver 400 amigable en vez de dejar que
// PostgreSQL detecte el error. Sin sesiones que crucen medianoche.
function invalidTimeOrderError() {
  const error = new Error("horario_invalido:startTime>=endTime");
  error.code = "INVALID_TIME";
  return error;
}

function invalidStatusError() {
  const error = new Error("estado_invalido");
  error.code = "INVALID_STATUS";
  return error;
}

function invalidRangeError() {
  const error = new Error("rango_fechas_invalido:dateFrom>dateTo");
  error.code = "INVALID_DATE";
  return error;
}

function toTimeRange(startTime, endTime) {
  const start = toTimeOnly(startTime);
  const end = toTimeOnly(endTime);
  if (!(start < end)) throw invalidTimeOrderError();
  return { start, end };
}

async function list({ userId, roles }, deps) {
  const { store } = deps;
  if (isAdmin(roles)) return store.sessionListAll();
  if (!isRepresentative(roles)) throw new AttendanceForbiddenError();
  return store.sessionListByRepresentative(userId);
}

async function get({ id, userId, roles }, deps) {
  const session = await deps.store.sessionGet(id);
  assertOwnerOrAdmin(session, { userId, roles });
  return session;
}

// Historial paginado: filtros y paginación en base de datos.
// El representante solo ve sesiones de sus grupos/períodos asignados
// (alcance derivado del JWT, nunca de parámetros del cliente).
async function history(
  { page, pageSize, status, dateFrom, dateTo, courseOfferingId, search, actorId, roles },
  deps,
) {
  const { store } = deps;
  const userId = actorId;
  let scope = null;
  if (isAdmin(roles)) {
    scope = null;
  } else if (!isRepresentative(roles)) {
    throw new AttendanceForbiddenError();
  } else {
    const pairs = await store.representativeScope(userId);
    if (pairs.length === 0) return emptyHistory(page ?? 1, pageSize ?? 10);
    scope = pairs;
  }
  const pageNum = page ?? 1;
  const sizeNum = pageSize ?? 10;
  if (status !== undefined && ![BORRADOR, ABIERTA, CERRADA, FIRMADA].includes(status)) {
    throw invalidStatusError();
  }
  const from = dateFrom === undefined ? undefined : toDateOnly(dateFrom);
  const to = dateTo === undefined ? undefined : toDateOnly(dateTo);
  if (from !== undefined && to !== undefined && !(from <= to)) throw invalidRangeError();
  const { total, rows } = await store.sessionHistory({
    scope,
    status,
    from,
    to,
    courseOfferingId,
    search: search === undefined ? undefined : String(search).trim(),
    skip: (pageNum - 1) * sizeNum,
    take: sizeNum,
  });
  return pageOf(rows, total, pageNum, sizeNum);
}

function emptyHistory(page, pageSize) {
  return pageOf([], 0, page, pageSize);
}

function pageOf(items, totalItems, page, pageSize) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 0);
  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

async function create(
  { courseOfferingId, sessionDate, startTime, endTime, topics, roles, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const userId = actorId;
  if (!isRepresentative(roles)) throw new AttendanceForbiddenError();
  const offering = await store.offeringGet(courseOfferingId);
  if (!offering) throw new AttendanceNotFoundError();
  const assignment = await store.assignmentFor({
    userId,
    groupId: offering.group_id,
    periodId: offering.academic_period_id,
  });
  if (!assignment) throw new AttendanceForbiddenError();
  const teacher = await store.teacherForOffering(courseOfferingId);
  if (!teacher) throw new AttendanceNotFoundError();
  const status = await store.statusByCode(BORRADOR);
  const { start: parsedStart, end: parsedEnd } = toTimeRange(startTime, endTime);
  const record = await store.sessionCreate({
    courseOfferingId,
    teacherUserId: teacher.user_id,
    representativeUserId: userId,
    statusId: status.id,
    sessionDate: toDateOnly(sessionDate),
    startTime: parsedStart,
    endTime: parsedEnd,
    topics,
  });
  await audit.log({
    action: "attendance.create",
    userId,
    entityType: "attendance_session",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function open({ id, roles, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const userId = actorId;
  const session = await deps.store.sessionGet(id);
  assertOwnerOrAdmin(session, { userId, roles });
  if (!isRepresentative(roles) && !isAdmin(roles)) throw new AttendanceForbiddenError();
  assertTransition(sessionStatusOf(session), ABIERTA);
  const status = await store.statusByCode(ABIERTA);
  let updated = await store.sessionSetStatus(id, { statusId: status.id, openedAt: new Date() });
  if (!updated.attendance_code) {
    updated = await store.sessionSetCode(id);
  }
  await audit.log({
    action: "attendance.open",
    userId,
    entityType: "attendance_session",
    entityId: id,
    ip,
    userAgent,
  });
  return updated;
}

async function close({ id, roles, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const userId = actorId;
  const session = await deps.store.sessionGet(id);
  assertOwnerOrAdmin(session, { userId, roles });
  if (!isRepresentative(roles) && !isAdmin(roles)) throw new AttendanceForbiddenError();
  assertTransition(sessionStatusOf(session), CERRADA);
  const status = await store.statusByCode(CERRADA);
  const updated = await store.sessionSetStatus(id, { statusId: status.id, closedAt: new Date() });
  await audit.log({
    action: "attendance.close",
    userId,
    entityType: "attendance_session",
    entityId: id,
    ip,
    userAgent,
  });
  return updated;
}

// Edición explícita de "Temas tratados" (único campo editable post-cierre).
// Solo el representante propietario (o admin). No toca estado, oferta,
// fechas, códigos ni firmas. Pensado para corregir la temática realmente
// desarrollada después de cerrar la asistencia.
async function updateTopics({ id, topics, roles, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const userId = actorId;
  const session = await deps.store.sessionGet(id);
  assertOwnerOrAdmin(session, { userId, roles });
  if (!isRepresentative(roles) && !isAdmin(roles)) throw new AttendanceForbiddenError();
  const value = String(topics ?? "").trim();
  if (!value) throw new AttendanceConflictError("INVALID_TOPICS");
  const updated = await store.sessionSetTopics(id, value);
  await audit.log({
    action: "attendance.update-topics",
    userId,
    entityType: "attendance_session",
    entityId: id,
    ip,
    userAgent,
  });
  return updated;
}

module.exports = { list, get, history, create, open, close, updateTopics };
