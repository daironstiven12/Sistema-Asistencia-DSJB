const { ForbiddenError, UserNotFoundError } = require("./user-errors");
const { isAdminRole } = require("../../auth/domain/roles");

const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"];
const STATUS_ACTIONS = {
  ACTIVE: "user.activated",
  INACTIVE: "user.deactivated",
  BLOCKED: "user.blocked",
};

async function setUserStatus(
  { actorId, actorRoles, targetUserId, status, ip, userAgent },
  deps,
) {
  const { users, sessions, audit } = deps;
  if (!isAdminRole(actorRoles)) throw new ForbiddenError();
  if (!ALLOWED_STATUSES.includes(status)) {
    const error = new Error("INVALID_STATUS");
    error.code = "INVALID_STATUS";
    throw error;
  }
  const target = await users.findById(targetUserId);
  if (!target) throw new UserNotFoundError();
  if (target.status === status) return { updated: false };
  await users.updateStatus(targetUserId, status);
  let revoked = 0;
  if (status !== "ACTIVE") {
    revoked = await sessions.revokeAllForUser(targetUserId);
  }
  await audit.log({
    action: STATUS_ACTIONS[status],
    userId: String(actorId),
    entityType: "user",
    entityId: String(targetUserId),
    metadata: { from: target.status, to: status, sessionsRevoked: revoked },
    ip,
    userAgent,
  });
  return { updated: true, sessionsRevoked: revoked };
}

module.exports = { setUserStatus, ALLOWED_STATUSES };
