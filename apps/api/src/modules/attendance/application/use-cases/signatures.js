const { ROLES } = require("../../../auth/domain/roles");
const { FIRMADA, assertTransition } = require("../../domain/attendance-status");
const {
  AttendanceForbiddenError,
  AttendanceInvalidReferenceError,
  AttendanceNotFoundError,
} = require("../attendance-errors");

function isAdmin(roles) {
  return (roles ?? []).includes(ROLES.ADMINISTRADOR);
}

function isRepresentative(roles) {
  return (roles ?? []).includes(ROLES.REPRESENTANTE);
}

// chk_signature_type (PostgreSQL) acepta exactamente DRAWN/TYPED/UPLOAD.
// El frontend envía draw/type/upload (SignaturePad): se normaliza aquí,
// único punto de la cadena, sin tocar la restricción ni inventar valores.
const SIGNATURE_TYPES = {
  DRAW: "DRAWN",
  DRAWN: "DRAWN",
  TYPE: "TYPED",
  TYPED: "TYPED",
  UPLOAD: "UPLOAD",
};

function toSignatureType(value) {
  const normalized = SIGNATURE_TYPES[String(value ?? "").trim().toUpperCase()];
  if (!normalized) throw new AttendanceInvalidReferenceError();
  return normalized;
}

function sessionStatusOf(session) {
  return session?.attendance_statuses?.code;
}

// Firma del acta: el firmante es el usuario autenticado, solo sobre sus
// sesiones y únicamente en estado CERRADA → FIRMADA.
async function signSession(
  { sessionId, signatureType, signatureData, mimeType, roles, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const userId = actorId;
  if (!isRepresentative(roles) && !isAdmin(roles)) throw new AttendanceForbiddenError();
  const session = await store.sessionGet(sessionId);
  if (!isAdmin(roles) && String(session.representative_user_id) !== String(userId)) {
    throw new AttendanceForbiddenError();
  }
  assertTransition(sessionStatusOf(session), FIRMADA);
  const person = await store.personOfUser(userId);
  const role = await store.roleByName(ROLES.REPRESENTANTE);
  const signature = await store.signatureCreate({
    personId: person.id,
    type: toSignatureType(signatureType),
    data: signatureData,
    mime: mimeType,
  });
  const link = await store.sessionSignatureCreate({
    sessionId: session.id,
    userId,
    roleId: role.id,
    signatureId: signature.id,
    snapshot: signatureData,
  });
  const firmada = await store.statusByCode(FIRMADA);
  const updated = await store.sessionSetStatus(session.id, { statusId: firmada.id });
  await audit.log({
    action: "attendance.sign",
    userId,
    entityType: "attendance_session_signature",
    entityId: link.id,
    ip,
    userAgent,
  });
  return { signature, session: updated };
}

module.exports = { signSession, sessionSignatures, toSignatureType };

// Firmas del acta de una sesión (solo lectura): misma propiedad que el
// listado de registros (admin o representante de la sesión). Devuelve
// únicamente rol, nombre del firmante, tipo, snapshot y fecha.
async function sessionSignatures({ sessionId, userId, roles }, deps) {
  const { store } = deps;
  const session = await store.sessionGet(sessionId);
  if (!session) throw new AttendanceNotFoundError();
  if (!isAdmin(roles) && String(session.representative_user_id) !== String(userId)) {
    throw new AttendanceForbiddenError();
  }
  const rows = await store.sessionSignatureList(sessionId);
  return (rows ?? []).map((row) => {
    const person = row.users?.persons ?? {};
    const nombre = [person.first_name, person.middle_name, person.last_name, person.second_last_name]
      .filter(Boolean)
      .join(" ");
    return {
      role: row.roles?.name ?? null,
      signerName: nombre || null,
      signatureType: row.signatures?.signature_type ?? null,
      snapshot: row.signature_snapshot ?? row.signatures?.signature_data ?? null,
      signedAt: row.signed_at ?? null,
    };
  });
}
