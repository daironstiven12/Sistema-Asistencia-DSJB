async function revokeUserSessions({ userId, ip, userAgent }, deps) {
  const { sessions, audit } = deps;
  const count = await sessions.revokeAllForUser(userId);
  await audit.log({
    action: "auth.session.revoked",
    userId,
    entityType: "user",
    entityId: userId,
    metadata: { count },
    ip,
    userAgent,
  });
  return { revoked: count };
}

module.exports = { revokeUserSessions };
