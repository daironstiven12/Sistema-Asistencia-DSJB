const { loginUser } = require("../../application/login-user");
const { refreshSession } = require("../../application/refresh-session");
const { logout } = require("../../application/logout");
const { revokeUserSessions } = require("../../application/revoke-user-sessions");
const {
  InvalidCredentialsError,
  SessionExpiredError,
  SessionNotFoundError,
  SessionReuseError,
  SessionRevokedError,
} = require("../../application/auth-errors");
const { Argon2PasswordHasher } = require("../../infrastructure/argon2-password-hasher");
const { JwtTokenIssuer } = require("../../infrastructure/jwt-token-issuer");
const {
  hashRefreshToken,
} = require("../../domain/session-policy");

function memorySessions() {
  const rows = [];
  return {
    rows,
    async create(data) {
      const row = {
        id: String(rows.length + 1),
        userId: data.userId,
        familyId: data.familyId,
        replacedByHash: null,
        expiresAt: data.expiresAt,
        revokedAt: null,
      };
      rows.push({ ...data, ...row, tokenHash: data.tokenHash });
      return row;
    },
    async findByTokenHash(hash) {
      return rows.find((r) => r.tokenHash === hash) ?? null;
    },
    async markReplaced(id, hash) {
      rows.find((r) => r.id === String(id)).replacedByHash = hash;
    },
    async revoke(id) {
      const row = rows.find((r) => r.id === String(id));
      if (row) row.revokedAt = new Date();
    },
    async revokeFamily(familyId) {
      let count = 0;
      rows.forEach((r) => {
        if (r.familyId === familyId && !r.revokedAt) {
          r.revokedAt = new Date();
          count += 1;
        }
      });
      return count;
    },
    async revokeAllForUser(userId) {
      let count = 0;
      rows.forEach((r) => {
        if (r.userId === String(userId) && !r.revokedAt) {
          r.revokedAt = new Date();
          count += 1;
        }
      });
      return count;
    },
  };
}

const USER = {
  id: "7",
  username: "jp.delegate",
  email: "jp.delegate@utch.edu.co",
  status: "ACTIVE",
  roles: ["REPRESENTANTE"],
};

async function makeDeps(userOverrides = {}) {
  const passwords = new Argon2PasswordHasher();
  const user =
    userOverrides === null
      ? null
      : {
          ...USER,
          passwordHash: await passwords.hash("Clave-Segura-123"),
          ...userOverrides,
        };
  const users = {
    findByUsername: async (username) =>
      user && user.username === String(username ?? "").trim() ? user : null,
    findByEmail: async (email) =>
      user && user.email === String(email ?? "").trim().toLowerCase() ? user : null,
    findById: async (id) => (user && String(id) === user.id ? user : null),
  };
  const tokens = new JwtTokenIssuer({ secret: "secreto-de-prueba-largo-1234567890" });
  const sessions = memorySessions();
  const audits = [];
  const audit = { log: async (e) => audits.push(e) };
  const config = { refreshExpiresIn: "7d" };
  return { deps: { users, passwords, tokens, sessions, audit, config }, sessions, audits };
}

describe("login-user", () => {
  test("credenciales válidas crean sesión y devuelven tokens", async () => {
    const { deps, sessions, audits } = await makeDeps();
    const result = await loginUser(
      { email: "JP.Delegate@utch.edu.co", password: "Clave-Segura-123" },
      deps,
    );
    expect(result.user).toEqual({
      id: "7",
      username: "jp.delegate",
      email: "jp.delegate@utch.edu.co",
      roles: ["REPRESENTANTE"],
      status: "ACTIVE",
    });
    expect(typeof result.accessToken).toBe("string");
    expect(typeof result.refreshToken).toBe("string");
    expect(sessions.rows).toHaveLength(1);
    const stored = sessions.rows[0];
    expect(stored.tokenHash).toBe(hashRefreshToken(result.refreshToken));
    expect(stored.tokenHash).toHaveLength(64);
    expect(audits.map((a) => a.action)).toEqual(["auth.login.success"]);
  });

  test.each([
    ["usuario inexistente", null, "Clave-Segura-123"],
    ["contraseña incorrecta", {}, "otra-clave"],
    ["usuario inactivo", { status: "BLOCKED" }, "Clave-Segura-123"],
  ])("%s responde credenciales inválidas", async (_label, overrides, password) => {
    const { deps, sessions, audits } = await makeDeps(overrides);
    await expect(
      loginUser({ email: "jp.delegate@utch.edu.co", password }, deps),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(sessions.rows).toHaveLength(0);
    expect(audits.map((a) => a.action)).toEqual(["auth.login.failed"]);
  });

  test("compatibilidad: username histórico sin @ aún accede", async () => {
    const { deps } = await makeDeps();
    const result = await loginUser({ email: "jp.delegate", password: "Clave-Segura-123" }, deps);
    expect(result.user.id).toBe("7");
  });
});

describe("refresh-session", () => {
  async function loggedIn() {
    const ctx = await makeDeps();
    const result = await loginUser(
      { email: "JP.Delegate@utch.edu.co", password: "Clave-Segura-123" },
      ctx.deps,
    );
    return { ...ctx, result };
  }

  test("rota la sesión y emite par nuevo", async () => {
    const { deps, sessions, result } = await loggedIn();
    const next = await refreshSession({ refreshToken: result.refreshToken }, deps);
    expect(next.refreshToken).not.toBe(result.refreshToken);
    expect(typeof next.accessToken).toBe("string");
    expect(sessions.rows).toHaveLength(2);
    expect(sessions.rows[0].replacedByHash).toBe(
      hashRefreshToken(next.refreshToken),
    );
  });

  test("reutilizar token rotado revoca la familia", async () => {
    const { deps, sessions, result } = await loggedIn();
    await refreshSession({ refreshToken: result.refreshToken }, deps);
    await expect(
      refreshSession({ refreshToken: result.refreshToken }, deps),
    ).rejects.toBeInstanceOf(SessionReuseError);
    expect(sessions.rows.every((r) => r.revokedAt)).toBe(true);
  });

  test("revocada, expirada e inexistente se rechazan", async () => {
    const { deps, result } = await loggedIn();
    await deps.sessions.revoke(result.sessionId);
    await expect(
      refreshSession({ refreshToken: result.refreshToken }, deps),
    ).rejects.toBeInstanceOf(SessionRevokedError);

    const ctx = await loggedIn();
    ctx.deps.sessions.rows[0].expiresAt = new Date(Date.now() - 1000);
    await expect(
      refreshSession({ refreshToken: ctx.result.refreshToken }, ctx.deps),
    ).rejects.toBeInstanceOf(SessionExpiredError);

    await expect(
      refreshSession({ refreshToken: "no-existe", }, ctx.deps),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });
});

describe("logout y revocación", () => {
  test("logout revoca la sesión", async () => {
    const { deps, sessions, result } = await (async () => {
      const ctx = await makeDeps();
      const result = await loginUser(
        { email: "JP.Delegate@utch.edu.co", password: "Clave-Segura-123" },
        ctx.deps,
      );
      return { ...ctx, result };
    })();
    const out = await logout({ sessionId: result.sessionId, userId: "7" }, deps);
    expect(out).toEqual({ revoked: true });
    expect(sessions.rows[0].revokedAt).not.toBeNull();
  });

  test("revoca todas las sesiones del usuario", async () => {
    const { deps, sessions } = await makeDeps();
    await loginUser({ email: "jp.delegate@utch.edu.co", password: "Clave-Segura-123" }, deps);
    await loginUser({ email: "jp.delegate@utch.edu.co", password: "Clave-Segura-123" }, deps);
    const out = await revokeUserSessions({ userId: "7" }, deps);
    expect(out).toEqual({ revoked: 2 });
    expect(sessions.rows.every((r) => r.revokedAt)).toBe(true);
  });
});
