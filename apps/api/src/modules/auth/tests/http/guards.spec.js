const { JwtAuthGuard } = require("../../interfaces/http/guards/jwt-auth.guard");
const { RolesGuard } = require("../../interfaces/http/guards/roles.guard");
const { Roles, ROLES_KEY } = require("../../interfaces/http/roles.decorator");
const { JwtTokenIssuer } = require("../../infrastructure/jwt-token-issuer");

const SECRET = "secreto-de-prueba-largo-suficiente-123456";

function contextWith(req, handlerRoles) {
  const reflector = {
    getAllAndOverride: () => handlerRoles,
  };
  return {
    reflector,
    http: {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    },
  };
}

async function token(payload, secret = SECRET, extra = {}) {
  const issuer = new JwtTokenIssuer({ secret, ...extra });
  return issuer.signAccess({ sub: "7", roles: ["DOCENTE"], sid: "9", ...payload });
}

describe("JwtAuthGuard", () => {
  const tokens = new JwtTokenIssuer({ secret: SECRET });

  test("token válido autentica y expone identidad mínima", async () => {
    const guard = new JwtAuthGuard(tokens);
    const req = { headers: { authorization: `Bearer ${await token()}` } };
    await expect(
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => req }) }),
    ).resolves.toBe(true);
    expect(req.user).toEqual({ id: "7", roles: ["DOCENTE"], sessionId: "9" });
  });

  test.each([
    ["sin token", {}],
    ["esquema distinto", "Basic abc"],
  ])("rechaza %s con 401", async (_label, authorization) => {
    const guard = new JwtAuthGuard(tokens);
    const req = { headers: authorization ? { authorization } : {} };
    await expect(
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => req }) }),
    ).rejects.toMatchObject({ status: 401 });
  });

  test("rechaza firma ajena, expirado e issuer/audience", async () => {
    const guard = new JwtAuthGuard(tokens);
    const check = (authorization) =>
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
      });
    await expect(check(`Bearer ${await token({}, "otro-secreto-largo-789012")}`)).rejects.toMatchObject({ status: 401 });
    const short = await new JwtTokenIssuer({ secret: SECRET, expiresIn: "1s" }).signAccess({ sub: "1", roles: [], sid: "2" });
    await new Promise((r) => setTimeout(r, 1100));
    await expect(check(`Bearer ${short}`)).rejects.toMatchObject({ status: 401 });
    const strict = new JwtAuthGuard(
      new JwtTokenIssuer({ secret: SECRET, issuer: "api", audience: "web" }),
    );
    const strictCheck = (authorization) =>
      strict.canActivate({
        switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
      });
    await expect(strictCheck(`Bearer ${await token()}`)).rejects.toMatchObject({ status: 401 });
  });
});

describe("RolesGuard", () => {
  test("sin roles requeridos permite", async () => {
    const { reflector, http } = contextWith({}, null);
    await expect(new RolesGuard(reflector).canActivate(http)).resolves.toBe(true);
  });

  test("rol autorizado pasa y otro recibe 403", async () => {
    const ok = contextWith({ user: { id: "1", roles: ["ADMINISTRADOR"] } }, ["ADMINISTRADOR"]);
    await expect(new RolesGuard(ok.reflector).canActivate(ok.http)).resolves.toBe(true);
    const denied = contextWith({ user: { id: "1", roles: ["DOCENTE"] } }, ["ADMINISTRADOR"]);
    await expect(new RolesGuard(denied.reflector).canActivate(denied.http)).rejects.toMatchObject({ status: 403 });
  });

  test("sin usuario responde 401, no 403", async () => {
    const ctx = contextWith({}, ["ADMINISTRADOR"]);
    await expect(new RolesGuard(ctx.reflector).canActivate(ctx.http)).rejects.toMatchObject({ status: 401 });
  });

  test("decorador Roles expone la clave", () => {
    expect(ROLES_KEY).toBe("roles");
    expect(typeof Roles).toBe("function");
  });
});
