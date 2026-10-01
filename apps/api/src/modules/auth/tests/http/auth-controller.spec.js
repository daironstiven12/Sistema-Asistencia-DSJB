const { UnauthorizedException } = require("@nestjs/common");
const { AuthController } = require("../../interfaces/http/auth.controller");
const {
  InvalidCredentialsError,
  SessionReuseError,
} = require("../../application/auth-errors");

function reqWith(cookie) {
  return {
    ip: "127.0.0.1",
    headers: { "user-agent": "jest" },
    cookies: cookie ? { refresh_token: cookie } : {},
  };
}

function resFake() {
  const calls = { cookies: [], cleared: [] };
  return {
    calls,
    cookie: (name, value, options) => {
      calls.cookies.push({ name, value, options });
    },
    clearCookie: (name, options) => {
      calls.cleared.push({ name, options });
    },
  };
}

function controllerWith(overrides = {}) {
  return new AuthController(
    overrides.login ?? (async () => ({ ok: true })),
    overrides.refresh ?? (async () => ({ ok: true })),
    overrides.logout ?? (async () => ({ revoked: true })),
  );
}

describe("AuthController", () => {
  test("login delega, fija cookie y oculta el refresh", async () => {
    const shaped = {
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: new Date(),
      user: { id: "7", username: "jp Delegate", roles: [], status: "ACTIVE" },
    };
    const login = async (input) => {
      expect(input.username).toBe("jp Delegate");
      expect(input.ip).toBe("127.0.0.1");
      return shaped;
    };
    const controller = controllerWith({ login });
    const res = resFake();
    const out = await controller.login(
      { username: "jp Delegate", password: "x" },
      reqWith(),
      res,
    );
    expect(out).toEqual({
      accessToken: "at",
      expiresAt: shaped.expiresAt,
      user: shaped.user,
    });
    expect(out.refreshToken).toBeUndefined();
    expect(res.calls.cookies).toHaveLength(1);
    expect(res.calls.cookies[0].name).toBe("refresh_token");
    expect(res.calls.cookies[0].value).toBe("rt");
    expect(res.calls.cookies[0].options.httpOnly).toBe(true);
  });

  test("login fallido responde 401 genérico", async () => {
    const controller = controllerWith({
      login: async () => {
        throw new InvalidCredentialsError();
      },
    });
    const error = await controller
      .login({ username: "x", password: "y" }, reqWith(), resFake())
      .catch((e) => e);
    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.getStatus()).toBe(401);
    expect(error.message).not.toMatch(/existe|bloqueado/i);
  });

  test("refresh usa la cookie y rota", async () => {
    const shaped = { accessToken: "at2", refreshToken: "rt2", expiresAt: new Date() };
    const refresh = async (input) => {
      expect(input.refreshToken).toBe("viejo");
      return shaped;
    };
    const controller = controllerWith({ refresh });
    const res = resFake();
    const out = await controller.refresh(reqWith("viejo"), res);
    expect(out.accessToken).toBe("at2");
    expect(out.refreshToken).toBeUndefined();
    expect(res.calls.cookies[0].value).toBe("rt2");
  });

  test("refresh sin cookie y reuse mapean a 401 genérico", async () => {
    const controller = controllerWith();
    const missing = await controller
      .refresh(reqWith(), resFake())
      .catch((e) => e);
    expect(missing).toBeInstanceOf(UnauthorizedException);
    const bad = controllerWith({
      refresh: async () => {
        throw new SessionReuseError();
      },
    });
    const error = await bad
      .refresh(reqWith("t"), resFake())
      .catch((e) => e);
    expect(error).toBeInstanceOf(UnauthorizedException);
  });

  test("logout revoca y limpia la cookie", async () => {
    let received = null;
    const logout = async (input) => {
      received = input;
      return { revoked: true };
    };
    const controller = controllerWith({ logout });
    const res = resFake();
    expect(await controller.logout(reqWith("t"), res)).toEqual({ revoked: true });
    expect(received.refreshToken).toBe("t");
    expect(res.calls.cleared).toHaveLength(1);
    expect(res.calls.cleared[0].name).toBe("refresh_token");
  });
});
