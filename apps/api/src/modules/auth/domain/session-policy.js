const crypto = require("node:crypto");

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const REFRESH_BYTES = 32;

function msFromExpiresIn(value, fallbackMs) {
  const match = /^(\d+)([smhd])$/.exec(String(value ?? ""));
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return amount * factor;
}

function parseDurationMs(value) {
  const ms = msFromExpiresIn(value, NaN);
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new Error("duracion_invalida");
  }
  return ms;
}

function refreshExpiresAt(now = new Date(), expiresIn = REFRESH_EXPIRES_IN) {
  return new Date(now.getTime() + msFromExpiresIn(expiresIn, 7 * 86400000));
}

function generateRefreshToken() {
  return crypto.randomBytes(REFRESH_BYTES).toString("base64url");
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function newFamilyId() {
  return crypto.randomUUID();
}

module.exports = {
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  REFRESH_BYTES,
  msFromExpiresIn,
  parseDurationMs,
  refreshExpiresAt,
  generateRefreshToken,
  hashRefreshToken,
  newFamilyId,
};
