// Mínimo 6 (fase registro básico): también aplica al gate de longitud
// del login, que usa esta misma política. Argon2id sin cambios.
const MIN_LENGTH = 6;
const MAX_LENGTH = 128;

// Valores por defecto alineados con .env (Argon2id obligatorio).
// El runtime real se resuelve en infrastructure vía getPasswordHashConfig().
const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

function validate(password) {
  const reasons = [];
  if (typeof password !== "string" || password.length === 0) {
    reasons.push("required");
    return { ok: false, reasons };
  }
  if (password.length < MIN_LENGTH) reasons.push("min_length");
  if (password.length > MAX_LENGTH) reasons.push("max_length");
  return { ok: reasons.length === 0, reasons };
}

module.exports = { MIN_LENGTH, MAX_LENGTH, ARGON2_OPTIONS, validate };
