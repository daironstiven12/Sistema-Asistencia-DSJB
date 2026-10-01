const { refreshExpiresInMs } = require("./auth-config");
const { getCookieConfig } = require("../../../config/app-config");

const REFRESH_COOKIE = "refresh_token";
const COOKIE_PATH = "/auth";

// En HTTP local Secure debe ser false o el navegador descarta la cookie.
// COOKIE_SECURE=true/false tiene prioridad; si falta, prod o SameSite=none => true.
function cookieOptions(env = process.env) {
  const { sameSite, secure, domain } = getCookieConfig(env);
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: COOKIE_PATH,
    ...(domain ? { domain } : {}),
    maxAge: refreshExpiresInMs(env),
  };
}

function clearCookieOptions(env = process.env) {
  const { maxAge, ...rest } = cookieOptions(env);
  return rest;
}

module.exports = { REFRESH_COOKIE, COOKIE_PATH, cookieOptions, clearCookieOptions };
