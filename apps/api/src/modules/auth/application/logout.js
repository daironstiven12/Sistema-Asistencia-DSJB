const { hashRefreshToken } = require("../domain/session-policy");

async function logout({ sessionId, refreshToken, userId, ip, userAgent }, deps) {
  const { sessions, audit } = deps;
  let resolvedId = sessionId ?? null;
  if (!resolvedId && refreshToken) {
    const found = await sessions.findByTokenHash(hashRefreshToken(refreshToken));
    if (found) {
      resolvedId = found.id;
      userId = userId ?? found.userId;
    }
  }
  if (resolvedId) await sessions.revoke(resolvedId);
  await audit.log({
    action: "auth.logout",
    userId: userId ?? null,
    entityType: "session",
    entityId: resolvedId,
    ip,
    userAgent,
  });
  return { revoked: true };
}

module.exports = { logout };
