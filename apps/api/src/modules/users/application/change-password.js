const { validate: validatePassword } = require("../../auth/domain/password-policy");
const {
  ForbiddenError,
  InvalidCurrentPasswordError,
  UserNotFoundError,
  WeakPasswordError,
} = require("./user-errors");
const { isAdminRole } = require("../../auth/domain/roles");

async function changePassword(
  { actorId, actorRoles, targetUserId, currentPassword, newPassword, ip, userAgent },
  deps,
) {
  const { users, passwords, sessions, audit } = deps;
  const self = String(actorId) === String(targetUserId);
  const admin = isAdminRole(actorRoles);
  if (!self && !admin) throw new ForbiddenError();
  const target = await users.findById(targetUserId);
  if (!target) throw new UserNotFoundError();
  if (!validatePassword(newPassword).ok) throw new WeakPasswordError();
  if (self && !admin) {
    const ok = await passwords.verify(target.passwordHash, currentPassword ?? "");
    if (!ok) throw new InvalidCurrentPasswordError();
  }
  const hash = await passwords.hash(newPassword);
  await users.updatePasswordHash(targetUserId, hash);
  const revoked = await sessions.revokeAllForUser(targetUserId);
  await audit.log({
    action: "user.password_changed",
    userId: String(actorId),
    entityType: "user",
    entityId: String(targetUserId),
    metadata: { byAdmin: admin && !self, sessionsRevoked: revoked },
    ip,
    userAgent,
  });
  return { updated: true, sessionsRevoked: revoked };
}

module.exports = { changePassword };
