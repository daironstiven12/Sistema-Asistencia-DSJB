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
      expect(input.email).toBe("estudiante@utch.edu.co");
      expect(input.ip).toBe("127.0.0.1");
      return shaped;
    };
    const controller = controllerWith({ login });
    const res = resFake();
    const out = await controller.login(
      { email: "estudiante@utch.edu.co", password: "x" },
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
      .login({ email: "x@utch.edu.co", password: "y" }, reqWith(), resFake())
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

  test("register/student delega y responde 201 sin secretos", async () => {
    let received = null;
    const shaped = { id: "11", email: "nueva@utch.edu.co", username: "nueva", roles: ["ESTUDIANTE"] };
    const controller = new AuthController(
      async () => ({ ok: true }),
      async () => ({ ok: true }),
      async () => ({ revoked: true }),
      async (input) => {
        received = input;
        return shaped;
      },
      { listIdentificationTypes: async () => [] },
    );
    const out = await controller.registerStudentRoute(
      {
        email: "nueva@utch.edu.co",
        password: "Clave-Segura-123",
        firstName: "Nueva",
        lastName: "Estudiante",
        identificationTypeId: "1",
        identificationNumber: "123",
      },
      reqWith(),
    );
    expect(out).toEqual(shaped);
    expect(out.password).toBeUndefined();
    expect(out.passwordHash).toBeUndefined();
    expect(received.role).toBeUndefined();
    expect(received.roles).toBeUndefined();
    expect(received.ip).toBe("127.0.0.1");
  });

  test("register/student mapea duplicados a 409 amigable", async () => {
    const {
      EmailAlreadyRegisteredError,
      IdentificationAlreadyRegisteredError,
      InvalidRegistrationError,
    } = require("../../application/auth-errors");
    const { ConflictException, BadRequestException } = require("@nestjs/common");
    const dupEmail = new AuthController(
      async () => ({ ok: true }),
      async () => ({ ok: true }),
      async () => ({ revoked: true }),
      async () => {
        throw new EmailAlreadyRegisteredError();
      },
      {},
    );
    const e1 = await dupEmail
      .registerStudentRoute({ email: "x@utch.edu.co" }, reqWith())
      .catch((e) => e);
    expect(e1).toBeInstanceOf(ConflictException);
    expect(e1.message).toBe("El correo institucional ya está registrado.");
    const dupIdent = new AuthController(
      async () => ({ ok: true }),
      async () => ({ ok: true }),
      async () => ({ revoked: true }),
      async () => {
        throw new IdentificationAlreadyRegisteredError();
      },
      {},
    );
    const e2 = await dupIdent
      .registerStudentRoute({ email: "x@utch.edu.co" }, reqWith())
      .catch((e) => e);
    expect(e2).toBeInstanceOf(ConflictException);
    expect(e2.message).toBe("El número de identificación ya está registrado.");
    const invalido = new AuthController(
      async () => ({ ok: true }),
      async () => ({ ok: true }),
      async () => ({ revoked: true }),
      async () => {
        throw new InvalidRegistrationError();
      },
      {},
    );
    const e3 = await invalido
      .registerStudentRoute({ email: "x@utch.edu.co" }, reqWith())
      .catch((e) => e);
    expect(e3).toBeInstanceOf(BadRequestException);
  });

  test("identification-types lista el catálogo", async () => {
    const controller = new AuthController(
      async () => ({ ok: true }),
      async () => ({ ok: true }),
      async () => ({ revoked: true }),
      async () => ({ ok: true }),
      { listIdentificationTypes: async () => [{ id: "1", code: "CC", name: "Cédula" }] },
    );
    await expect(controller.identificationTypes()).resolves.toEqual([
      { id: "1", code: "CC", name: "Cédula" },
    ]);
  });
});
