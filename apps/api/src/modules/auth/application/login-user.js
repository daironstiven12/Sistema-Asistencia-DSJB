const { validate: validatePassword } = require("../domain/password-policy");
const {
  buildAccessClaims,
} = require("../domain/token-claims");
const {
  generateRefreshToken,
  hashRefreshToken,
  newFamilyId,
  refreshExpiresAt,
} = require("../domain/session-policy");
const { InvalidCredentialsError } = require("./auth-errors");

// Hash fijo para igualar tiempos cuando el usuario no existe.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$oKtACWzhOmmQhygjasFMRw$4r1v652Lf9BNTItnZ0apoZVPkgrI9v8ck/JmvULtEMA";

async function fail(audit, meta, reason) {
  await audit.log({
    action: "auth.login.failed",
    userId: meta.userId ?? null,
    entityType: "user",
    metadata: { reason },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  throw new InvalidCredentialsError();
}

async function loginUser({ email, password, ip, userAgent }, deps) {
  const { users, passwords, tokens, sessions, audit, config } = deps;
  const meta = { ip, userAgent };
  const identifier = String(email ?? "").trim();
  let record = await users.findByEmail(identifier.toLowerCase());
  if (!record && !identifier.includes("@")) {
    // Compatibilidad: usuarios históricos sin correo (p. ej. admin) aún
    // pueden acceder con su username. Todo correo válido va por email.
    record = await users.findByUsername(identifier);
  }
  const policy = validatePassword(password);
  const ok =
    policy.ok &&
    (await passwords.verify(record ? record.passwordHash : DUMMY_HASH, password));
  if (!record) return fail(audit, meta, "unknown_user");
  if (!ok) return fail(audit, { ...meta, userId: record.id }, "bad_password");
  if (record.status !== "ACTIVE") {
    return fail(audit, { ...meta, userId: record.id }, "inactive");
  }
  const refreshToken = generateRefreshToken();
  const session = await sessions.create({
    userId: record.id,
    tokenHash: hashRefreshToken(refreshToken),
    familyId: newFamilyId(),
    expiresAt: refreshExpiresAt(new Date(), config.refreshExpiresIn),
    ip,
    userAgent,
  });
  const accessToken = await tokens.signAccess(
    buildAccessClaims({
      userId: record.id,
      roles: record.roles,
      sessionId: session.id,
    }),
  );
  const verified = await tokens.verifyAccess(accessToken);
  await audit.log({
    action: "auth.login.success",
    userId: record.id,
    entityType: "user",
    entityId: record.id,
    ip,
    userAgent,
  });
  return {
    user: {
      id: record.id,
      username: record.username,
      email: record.email ?? null,
      roles: record.roles,
      status: record.status,
    },
    accessToken,
    refreshToken,
    sessionId: session.id,
    expiresAt: new Date(verified.exp * 1000),
  };
}

module.exports = { loginUser };
