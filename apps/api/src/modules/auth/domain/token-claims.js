function buildAccessClaims({ userId, roles, sessionId }) {
  return {
    sub: String(userId),
    roles: Array.isArray(roles) ? roles : [],
    sid: String(sessionId),
  };
}

function assertAccessClaims(claims) {
  if (!claims || typeof claims.sub !== "string" || claims.sub.length === 0) {
    throw new Error("claim_sub_requerido");
  }
  if (typeof claims.sid !== "string" || claims.sid.length === 0) {
    throw new Error("claim_sid_requerido");
  }
  if (!Array.isArray(claims.roles)) {
    throw new Error("claim_roles_requerido");
  }
  return claims;
}

module.exports = { buildAccessClaims, assertAccessClaims };
