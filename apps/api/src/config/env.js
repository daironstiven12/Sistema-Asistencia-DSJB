function numberFromEnv(name, fallback, env = process.env) {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`configuracion_invalida:${name}`);
  }
  return value;
}

module.exports = { numberFromEnv };
