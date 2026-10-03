const crypto = require("node:crypto");

// Códigos canónicos de attendance_statuses (P0: sin VALIDADA).
const BORRADOR = "BORRADOR";
const ABIERTA = "ABIERTA";
const CERRADA = "CERRADA";
const FIRMADA = "FIRMADA";

// Estado de registro al crear (misma tabla de estados).
const PRESENTE = "PRESENTE";

// Método de registro para el flujo P0 (código/QR).
const METODO_CODIGO = "CODIGO";
const METODO_CODIGO_NOMBRE = "Código de asistencia";

const TRANSITIONS = {
  [BORRADOR]: [ABIERTA],
  [ABIERTA]: [CERRADA],
  [CERRADA]: [FIRMADA],
  [FIRMADA]: [],
};

function invalidTransitionError(from, to) {
  const error = new Error(`transicion_invalida:${from}->${to}`);
  error.code = "INVALID_TRANSITION";
  return error;
}

function assertTransition(from, to) {
  if (!(TRANSITIONS[from] ?? []).includes(to)) {
    throw invalidTransitionError(from, to);
  }
  return to;
}

// Código aleatorio por sesión (sin información sensible).
// Alfabeto sin caracteres ambiguos (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateAttendanceCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `ASIS-${code}`;
}

module.exports = {
  BORRADOR,
  ABIERTA,
  CERRADA,
  FIRMADA,
  PRESENTE,
  METODO_CODIGO,
  METODO_CODIGO_NOMBRE,
  TRANSITIONS,
  assertTransition,
  invalidTransitionError,
  generateAttendanceCode,
};
