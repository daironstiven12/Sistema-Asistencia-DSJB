const { ForbiddenError, UserNotFoundError } = require("./user-errors");
const { isAdminRole } = require("../../auth/domain/roles");

function publicUser(record) {
  return {
    id: record.id,
    username: record.username,
    status: record.status,
    roles: record.roles,
    lastLoginAt: record.lastLoginAt ?? null,
  };
}

async function getUser({ requesterId, requesterRoles, targetUserId }, deps) {
  const { users } = deps;
  const self = String(requesterId) === String(targetUserId);
  if (!self && !isAdminRole(requesterRoles)) throw new ForbiddenError();
  const record = await users.findById(targetUserId);
  if (!record) throw new UserNotFoundError();
  return publicUser(record);
}

module.exports = { getUser };
