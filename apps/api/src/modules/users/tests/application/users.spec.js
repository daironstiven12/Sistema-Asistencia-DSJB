const { getUser } = require("../../application/get-user");
const { changePassword } = require("../../application/change-password");
const { setUserStatus } = require("../../application/set-user-status");
const {
  ForbiddenError,
  InvalidCurrentPasswordError,
  UserNotFoundError,
  WeakPasswordError,
} = require("../../application/user-errors");
const { Argon2PasswordHasher } = require("../../../auth/infrastructure/argon2-password-hasher");

function memoryUsers() {
  const rows = new Map([
    ["7", { id: "7", username: "jp Delegate", passwordHash: "HASH", status: "ACTIVE", roles: ["DOCENTE"], lastLoginAt: null }],
    ["9", { id: "9", username: "bloqueado", passwordHash: "HASH", status: "BLOCKED", roles: [], lastLoginAt: null }],
  ]);
  return {
    rows,
    async findById(id) {
      return rows.get(String(id)) ?? null;
    },
    async updateStatus(id, status) {
      rows.get(String(id)).status = status;
    },
    async updatePasswordHash(id, hash) {
      rows.get(String(id)).passwordHash = hash;
    },
  };
}

function memorySessions() {
  return {
    revoked: [],
    async revokeAllForUser(userId) {
      this.revoked.push(String(userId));
      return 1;
    },
  };
}

function makeDeps(users) {
  const audits = [];
  return {
    deps: {
      users: users ?? memoryUsers(),
      passwords: new Argon2PasswordHasher(),
      sessions: memorySessions(),
      audit: { log: async (e) => audits.push(e) },
    },
    audits,
  };
}

describe("get-user", () => {
  test("propio y admin leen sin password_hash", async () => {
    const { deps } = makeDeps();
    const self = await getUser({ requesterId: "7", requesterRoles: [], targetUserId: "7" }, deps);
    expect(self.passwordHash).toBeUndefined();
    expect(self).toMatchObject({ id: "7", username: "jp Delegate" });
    const admin = await getUser({ requesterId: "1", requesterRoles: ["ADMINISTRADOR"], targetUserId: "7" }, deps);
    expect(admin.id).toBe("7");
  });

  test("ajeno sin rol admin y ausente fallan", async () => {
    const { deps } = makeDeps();
    await expect(
      getUser({ requesterId: "7", requesterRoles: [], targetUserId: "9" }, deps),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      getUser({ requesterId: "1", requesterRoles: ["ADMINISTRADOR"], targetUserId: "99" }, deps),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe("change-password", () => {
  test("propia con actual correcta rota hash y revoca", async () => {
    const users = memoryUsers();
    users.rows.get("7").passwordHash = await new Argon2PasswordHasher().hash("Actual-123");
    const { deps, audits } = makeDeps(users);
    const out = await changePassword(
      { actorId: "7", actorRoles: [], targetUserId: "7", currentPassword: "Actual-123", newPassword: "Nueva-Clave-456" },
      deps,
    );
    expect(out).toEqual({ updated: true, sessionsRevoked: 1 });
    expect(users.rows.get("7").passwordHash).not.toContain("Nueva-Clave-456");
    expect(audits.map((a) => a.action)).toEqual(["user.password_changed"]);
  });

  test("actual incorrecta, débil y ajena sin admin fallan", async () => {
    const users = memoryUsers();
    users.rows.get("7").passwordHash = await new Argon2PasswordHasher().hash("Actual-123");
    const { deps } = makeDeps(users);
    await expect(
      changePassword({ actorId: "7", actorRoles: [], targetUserId: "7", currentPassword: "mal", newPassword: "Nueva-Clave-456" }, deps),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);
    await expect(
      changePassword({ actorId: "7", actorRoles: [], targetUserId: "7", currentPassword: "Actual-123", newPassword: "corta" }, deps),
    ).rejects.toBeInstanceOf(WeakPasswordError);
    await expect(
      changePassword({ actorId: "7", actorRoles: [], targetUserId: "9", newPassword: "Nueva-Clave-456" }, deps),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("admin restablece sin actual", async () => {
    const { deps } = makeDeps();
    const out = await changePassword(
      { actorId: "1", actorRoles: ["ADMINISTRADOR"], targetUserId: "7", newPassword: "Nueva-Clave-456" },
      deps,
    );
    expect(out.updated).toBe(true);
  });
});

describe("set-user-status", () => {
  test("admin cambia, audita y revoca al desactivar", async () => {
    const { deps, audits } = makeDeps();
    const out = await setUserStatus(
      { actorId: "1", actorRoles: ["ADMINISTRADOR"], targetUserId: "7", status: "BLOCKED" },
      deps,
    );
    expect(out).toEqual({ updated: true, sessionsRevoked: 1 });
    expect(audits.map((a) => a.action)).toEqual(["user.blocked"]);
  });

  test("no admin, estado inválido e igual no cambian", async () => {
    const { deps, audits } = makeDeps();
    await expect(
      setUserStatus({ actorId: "7", actorRoles: [], targetUserId: "9", status: "ACTIVE" }, deps),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      setUserStatus({ actorId: "1", actorRoles: ["ADMINISTRADOR"], targetUserId: "7", status: "ELIMINADO" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
    const same = await setUserStatus(
      { actorId: "1", actorRoles: ["ADMINISTRADOR"], targetUserId: "7", status: "ACTIVE" },
      deps,
    );
    expect(same).toEqual({ updated: false });
    expect(audits).toHaveLength(0);
  });
});
