const { buildAccessClaims } = require("../domain/token-claims");
const {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiresAt,
} = require("../domain/session-policy");
const {
  SessionExpiredError,
  SessionNotFoundError,
  SessionRevokedError,
  SessionReuseError,
} = require("./auth-errors");

async function refreshSession({ refreshToken, ip, userAgent }, deps) {
  const { users, tokens, sessions, audit, config } = deps;
  const meta = { ip, userAgent };
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await sessions.findByTokenHash(tokenHash);
  if (!session) {
    await audit.log({ action: "auth.refresh.failed", ...meta, metadata: { reason: "unknown" } });
    throw new SessionNotFoundError();
  }
  const sessionMeta = { ...meta, userId: session.userId };
  if (session.replacedByHash) {
    await sessions.revokeFamily(session.familyId);
    await audit.log({
      action: "auth.refresh.reuse_detected",
      ...sessionMeta,
      metadata: { familyId: session.familyId },
    });
    throw new SessionReuseError();
  }
  if (session.revokedAt) {
    await audit.log({ action: "auth.refresh.failed", ...sessionMeta, metadata: { reason: "revoked" } });
    throw new SessionRevokedError();
  }
  if (session.expiresAt <= new Date()) {
    await audit.log({ action: "auth.refresh.failed", ...sessionMeta, metadata: { reason: "expired" } });
    throw new SessionExpiredError();
  }
  const nextToken = generateRefreshToken();
  await sessions.markReplaced(session.id, hashRefreshToken(nextToken));
  const next = await sessions.create({
    userId: session.userId,
    tokenHash: hashRefreshToken(nextToken),
    familyId: session.familyId,
    expiresAt: refreshExpiresAt(new Date(), config.refreshExpiresIn),
    ip,
    userAgent,
  });
  const record = await users.findById(session.userId);
  if (!record || record.status !== "ACTIVE") {
    await sessions.revoke(session.id);
    await audit.log({ action: "auth.refresh.failed", ...sessionMeta, metadata: { reason: "inactive" } });
    throw new SessionRevokedError();
  }
  const accessToken = await tokens.signAccess(
    buildAccessClaims({ userId: session.userId, roles: record.roles, sessionId: next.id }),
  );
  const verified = await tokens.verifyAccess(accessToken);
  await audit.log({ action: "auth.refresh.success", ...sessionMeta });
  return {
    accessToken,
    refreshToken: nextToken,
    sessionId: next.id,
    expiresAt: new Date(verified.exp * 1000),
  };
}

module.exports = { refreshSession };
