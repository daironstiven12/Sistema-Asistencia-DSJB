const { numberFromEnv } = require("./env");

function required(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`configuracion_invalida:${name}`);
  }
  return value;
}

function optionalString(name, env, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  return String(raw);
}

function assertDuration(name, value) {
  if (!/^(\d+)([smhd])$/.test(String(value ?? ""))) {
    throw new Error(`configuracion_invalida:${name}`);
  }
  return String(value);
}

function isProd(env = process.env) {
  return env.NODE_ENV === "production";
}

// --- Hashing (Argon2id) ---
function getPasswordHashConfig(env = process.env) {
  const algorithm = optionalString("PASSWORD_HASH_ALGORITHM", env, "argon2id");
  if (algorithm !== "argon2id") {
    throw new Error("configuracion_invalida:PASSWORD_HASH_ALGORITHM");
  }
  const memoryCost = numberFromEnv("PASSWORD_HASH_MEMORY_COST", 65536, env);
  const timeCost = numberFromEnv("PASSWORD_HASH_TIME_COST", 3, env);
  const parallelism = numberFromEnv("PASSWORD_HASH_PARALLELISM", 1, env);
  for (const [name, value] of [
    ["PASSWORD_HASH_MEMORY_COST", memoryCost],
    ["PASSWORD_HASH_TIME_COST", timeCost],
    ["PASSWORD_HASH_PARALLELISM", parallelism],
  ]) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`configuracion_invalida:${name}`);
    }
  }
  return { algorithm, memoryCost, timeCost, parallelism };
}

// --- JWT ---
function getJwtConfig(env = process.env) {
  const prod = isProd(env);
  const secret = required("JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET);
  if (secret.length < 32) {
    throw new Error("configuracion_invalida:JWT_ACCESS_SECRET");
  }
  const issuer =
    env.JWT_ISSUER ?? (prod ? undefined : "sistema-asistencia-dev");
  const audience =
    env.JWT_AUDIENCE ?? (prod ? undefined : "sistema-asistencia-web-dev");
  if (prod) {
    required("JWT_ISSUER", issuer);
    required("JWT_AUDIENCE", audience);
  }
  const expiresIn = assertDuration(
    "JWT_ACCESS_EXPIRES_IN",
    env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  );
  return { secret, issuer, audience, expiresIn };
}

// --- Refresh ---
function getRefreshConfig(env = process.env) {
  const expiresIn = assertDuration(
    "REFRESH_TOKEN_EXPIRES_IN",
    env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  );
  return { expiresIn };
}

// --- Cookies ---
function getCookieConfig(env = process.env) {
  const rawSameSite = optionalString("COOKIE_SAMESITE", env, "lax").toLowerCase();
  if (!["lax", "strict", "none"].includes(rawSameSite)) {
    throw new Error("configuracion_invalida:COOKIE_SAMESITE");
  }
  let secure;
  const rawSecure = env.COOKIE_SECURE;
  if (rawSecure === undefined || rawSecure === "") {
    secure = isProd(env) || rawSameSite === "none";
  } else if (String(rawSecure).toLowerCase() === "true") {
    secure = true;
  } else if (String(rawSecure).toLowerCase() === "false") {
    secure = false;
  } else {
    throw new Error("configuracion_invalida:COOKIE_SECURE");
  }
  const domain = optionalString("COOKIE_DOMAIN", env, "");
  return {
    sameSite: rawSameSite,
    secure,
    domain: domain.length > 0 ? domain : undefined,
  };
}

// --- CORS ---
function getCorsOrigins(env = process.env) {
  const raw = env.CORS_ORIGINS ?? "http://localhost:3000";
  return String(raw)
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

// --- Rate limiting ---
function getThrottleConfig(env = process.env) {
  return {
    ttl: numberFromEnv("THROTTLE_TTL_MS", 60000, env),
    limit: numberFromEnv("THROTTLE_LIMIT", 100, env),
  };
}

function getAuthThrottle(env = process.env) {
  return {
    login: {
      limit: numberFromEnv("AUTH_LOGIN_LIMIT", 10, env),
      ttl: numberFromEnv("AUTH_LOGIN_TTL_MS", 60000, env),
    },
    refresh: {
      limit: numberFromEnv("AUTH_REFRESH_LIMIT", 20, env),
      ttl: numberFromEnv("AUTH_REFRESH_TTL_MS", 60000, env),
    },
  };
}

// --- Servidor ---
function getServerConfig(env = process.env) {
  const nodeEnv = optionalString("NODE_ENV", env, "development");
  const port = numberFromEnv("PORT", 3001, env);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("configuracion_invalida:PORT");
  }
  return { nodeEnv, port, prod: nodeEnv === "production" };
}

// --- Base de datos (no modifica valores, solo valida presencia) ---
function getDatabaseConfig(env = process.env) {
  return {
    databaseUrl: required("DATABASE_URL", env.DATABASE_URL),
    directUrl: required("DIRECT_URL", env.DIRECT_URL),
  };
}

// --- Observabilidad (opcional, sin secretos hardcodeados) ---
function getObserveConfig(env = process.env) {
  return {
    appKey: optionalString("OBSERVE_APP_KEY", env, ""),
    appSecret: optionalString("OBSERVE_APP_SECRET", env, ""),
    serviceId: optionalString("OBSERVE_SERVICE_ID", env, "api"),
  };
}

module.exports = {
  required,
  isProd,
  getPasswordHashConfig,
  getJwtConfig,
  getRefreshConfig,
  getCookieConfig,
  getCorsOrigins,
  getThrottleConfig,
  getAuthThrottle,
  getServerConfig,
  getDatabaseConfig,
  getObserveConfig,
};
