const { Argon2PasswordHasher } = require("../../infrastructure/argon2-password-hasher");
const { JwtTokenIssuer } = require("../../infrastructure/jwt-token-issuer");

describe("Argon2PasswordHasher", () => {
  const hasher = new Argon2PasswordHasher();

  test("hash válido y verificación correcta", async () => {
    const hash = await hasher.hash("Clave-Segura-123");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await hasher.verify(hash, "Clave-Segura-123")).toBe(true);
  });

  test("verificación incorrecta y hash corrupto", async () => {
    const hash = await hasher.hash("Clave-Segura-123");
    expect(await hasher.verify(hash, "otra-clave")).toBe(false);
    expect(await hasher.verify("no-es-un-hash", "x")).toBe(false);
  });
});

describe("JwtTokenIssuer", () => {
  const issuer = new JwtTokenIssuer({
    secret: "secreto-de-prueba-con-suficiente-largo-123",
    issuer: "asistencia-api",
    audience: "asistencia-web",
    expiresIn: "15m",
  });

  test("genera token con claims esperados y expiración", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await issuer.signAccess({ sub: "7", roles: ["DOCENTE"], sid: "9" });
    const payload = await issuer.verifyAccess(token);
    expect(payload.sub).toBe("7");
    expect(payload.roles).toEqual(["DOCENTE"]);
    expect(payload.sid).toBe("9");
    expect(payload.iss).toBe("asistencia-api");
    expect(payload.aud).toBe("asistencia-web");
    expect(payload.exp - payload.iat).toBe(900);
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    const extra = Object.keys(payload).filter(
      (k) => !["sub", "roles", "sid", "iat", "exp", "iss", "aud"].includes(k),
    );
    expect(extra).toEqual([]);
  });

  test("rechaza configuración inválida y token ajeno", async () => {
    expect(() => new JwtTokenIssuer({})).toThrow("configuracion_invalida");
    const other = new JwtTokenIssuer({ secret: "otro-secreto-largo-suficiente-456" });
    const token = await other.signAccess({ sub: "1", roles: [], sid: "2" });
    await expect(issuer.verifyAccess(token)).rejects.toThrow();
  });
});
