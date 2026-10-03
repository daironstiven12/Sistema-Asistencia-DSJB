const { ROLES } = require("../../../auth/domain/roles");
const { ABIERTA, CERRADA, FIRMADA, METODO_CODIGO, METODO_CODIGO_NOMBRE, PRESENTE } = require("../../domain/attendance-status");
const { toSignatureType } = require("./signatures");
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceInvalidReferenceError,
  AttendanceNotFoundError,
} = require("../attendance-errors");

function isAdmin(roles) {
  return (roles ?? []).includes(ROLES.ADMINISTRADOR);
}

function sessionStatusOf(session) {
  return session?.attendance_statuses?.code;
}

function openOrThrow(session) {
  const estado = sessionStatusOf(session);
  if (estado !== ABIERTA) {
    // CERRADA/FIRMADA: la sesión ya no admite registros. Cualquier otro
    // estado (p. ej. BORRADOR) aún no está disponible para registrar.
    throw new AttendanceConflictError(estado === CERRADA || estado === FIRMADA ? "session-closed" : "session-not-open");
  }
}

// Cédula: trim, sin espacios ni puntos, mayúsculas. Única función de
// normalización del caso de uso: la misma cédula siempre resuelve a la
// misma persona y, por tanto, al mismo student_id.
function normalizarIdentificacion(value) {
  return String(value ?? "").trim().toUpperCase().replace(/[\s.]/g, "");
}

function identificacionValida(value) {
  return /^[A-Z0-9-]{3,20}$/.test(value ?? "");
}

function normalizarNombre(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

// "María Fernanda Gómez Rojas" → first María, middle Fernanda,
// last Gómez, second Rojas. Mínimo nombre + apellido.
function dividirNombre(fullName) {
  const tokens = String(fullName ?? "").split(" ").filter(Boolean);
  if (tokens.length < 2) throw new AttendanceInvalidReferenceError("invalid-name");
  if (tokens.length === 2) {
    return { firstName: tokens[0], middleName: null, lastName: tokens[1], secondLastName: null };
  }
  if (tokens.length === 3) {
    return { firstName: tokens[0], middleName: tokens[1], lastName: tokens[2], secondLastName: null };
  }
  return {
    firstName: tokens[0],
    middleName: tokens.slice(1, -2).join(" "),
    lastName: tokens[tokens.length - 2],
    secondLastName: tokens[tokens.length - 1],
  };
}

// Registro por código + datos del acta. El código es la autorización: NO se
// exige pertenencia previa en group_students. La identidad del acta es la
// cédula normalizada (nunca el nombre). La cuenta autenticada solo aporta
// trazabilidad (created_by/auditoría); jamás se sobrescriben sus datos.
async function register(
  { code, fullName, identificationNumber, signatureType, signatureData, mimeType, roles, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const userId = actorId;
  const session = await store.sessionByCode(code);
  if (!session) throw new AttendanceNotFoundError();
  openOrThrow(session);
  const cedula = normalizarIdentificacion(identificationNumber);
  if (!identificacionValida(cedula)) {
    throw new AttendanceInvalidReferenceError("invalid-identification");
  }
  const nombre = normalizarNombre(fullName);
  if (nombre.length < 3 || nombre.length > 200) {
    throw new AttendanceInvalidReferenceError("invalid-name");
  }
  const partes = dividirNombre(nombre);
  let tipoFirma;
  try {
    tipoFirma = toSignatureType(signatureType);
  } catch {
    throw new AttendanceInvalidReferenceError("invalid-signature");
  }
  const trazo = String(signatureData ?? "").trim();
  if (!trazo) throw new AttendanceInvalidReferenceError("invalid-signature");
  // Reutilizar siempre la persona de la cédula; crearla (y su student) solo
  // si no existe. Nunca se modifican nombres ya almacenados.
  let person = await store.personByIdentificationNumber(cedula);
  if (!person) {
    person = await store.personCreate({
      firstName: partes.firstName,
      middleName: partes.middleName,
      lastName: partes.lastName,
      secondLastName: partes.secondLastName,
      identificationNumber: cedula,
    });
  }
  let student = await store.studentOfPerson(person.id);
  if (!student) {
    student = await store.studentCreate({ personId: person.id });
  }
  const status = await store.statusByCode(PRESENTE);
  const method = await store.methodByCode(METODO_CODIGO, METODO_CODIGO_NOMBRE);
  let record;
  try {
    record = await store.recordCreate({
      sessionId: session.id,
      studentId: student.id,
      statusId: status.id,
      methodId: method.id,
      userId,
    });
  } catch (error) {
    // uq_attendance_record_student protege la carrera entre dos peticiones
    // simultáneas para la misma cédula: el conflicto se responde 409.
    if (error instanceof AttendanceConflictError) {
      throw new AttendanceConflictError("already-registered");
    }
    throw error;
  }
  const signature = await store.signatureCreate({
    personId: person.id,
    type: tipoFirma,
    data: trazo,
    mime: mimeType ?? null,
  });
  await store.recordSignatureCreate({
    recordId: record.id,
    signatureId: signature.id,
    snapshot: trazo,
  });
  await audit.log({
    action: "attendance.register",
    userId,
    entityType: "attendance_record",
    entityId: record.id,
    ip,
    userAgent,
    metadata: { identification_number: cedula },
  });
  return record;
}

// Vista previa mínima por código (Paso 1 del wizard): solo sesiones
// ABIERTAS y sin datos sensibles (sin estudiantes, cédulas ni firmas).
async function preview({ code }, deps) {
  const { store } = deps;
  const session = await store.sessionByCode(code);
  if (!session) throw new AttendanceNotFoundError();
  openOrThrow(session);
  const offering = session.course_offerings ?? {};
  const subject = offering.curriculum_subjects?.subjects ?? {};
  return {
    code: session.attendance_code,
    subject: subject.name ?? null,
    subjectCode: subject.code ?? null,
    group: offering.academic_groups?.name ?? null,
    period: offering.academic_periods?.name ?? null,
    date: session.session_date ?? null,
    startTime: session.start_time ?? null,
    endTime: session.end_time ?? null,
  };
}

async function list({ sessionId, userId, roles }, deps) {
  const { store } = deps;
  const session = await store.sessionGet(sessionId);
  if (!session) throw new AttendanceNotFoundError();
  if (!isAdmin(roles) && String(session.representative_user_id) !== String(userId)) {
    throw new AttendanceForbiddenError();
  }
  return store.recordListBySession(sessionId);
}

module.exports = { register, preview, list };
