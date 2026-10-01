const { numberFromEnv } = require("../../../../config/env");
const {
  refreshExpiresIn,
  refreshExpiresInMs,
} = require("../../infrastructure/auth-config");
const { JwtTokenIssuer } = require("../../infrastructure/jwt-token-issuer");
const { ROLES, isAdminRole } = require("../../domain/roles");

describe("configuración", () => {
  test("numberFromEnv convierte, usa fallback y rechaza basura", () => {
    expect(numberFromEnv("X", 10, {})).toBe(10);
    expect(numberFromEnv("X", 10, { X: "" })).toBe(10);
    expect(numberFromEnv("X", 10, { X: "25" })).toBe(25);
    expect(() => numberFromEnv("X", 10, { X: "abc" })).toThrow(
      "configuracion_invalida:X",
    );
  });

  test("refresh con valor único por defecto y entorno", () => {
    expect(refreshExpiresIn({})).toBe("7d");
    expect(refreshExpiresIn({ REFRESH_TOKEN_EXPIRES_IN: "1h" })).toBe("1h");
    expect(refreshExpiresInMs({ REFRESH_TOKEN_EXPIRES_IN: "1d" })).toBe(86400000);
    expect(() => refreshExpiresIn({ REFRESH_TOKEN_EXPIRES_IN: "x" })).toThrow(
      "configuracion_invalida",
    );
  });

  test("issuer exige secreto y expiración válida al construir", () => {
    expect(() => new JwtTokenIssuer({})).toThrow("configuracion_invalida");
    expect(
      () => new JwtTokenIssuer({ secret: "x".repeat(32), expiresIn: "mal" }),
    ).toThrow("configuracion_invalida");
  });

  test("producción exige issuer y audience; desarrollo usa valores explícitos", () => {
    expect(() =>
      JwtTokenIssuer.fromEnv({ NODE_ENV: "production", JWT_ACCESS_SECRET: "s".repeat(32) }),
    ).toThrow("configuracion_invalida");
    const dev = JwtTokenIssuer.fromEnv({ JWT_ACCESS_SECRET: "s".repeat(32) });
    expect(dev.issuer).toBe("sistema-asistencia-dev");
    expect(dev.audience).toBe("sistema-asistencia-web-dev");
    const prod = JwtTokenIssuer.fromEnv({
      NODE_ENV: "production",
      JWT_ACCESS_SECRET: "s".repeat(32),
      JWT_ISSUER: "api",
      JWT_AUDIENCE: "web",
    });
    expect(prod.issuer).toBe("api");
  });

  test("roles centralizados sin valores inventados", () => {
    expect(Object.values(ROLES).sort()).toEqual([
      "ADMINISTRADOR",
      "DOCENTE",
      "ESTUDIANTE",
      "REPRESENTANTE",
    ]);
    expect(isAdminRole(["DOCENTE"])).toBe(false);
    expect(isAdminRole(["ADMINISTRADOR"])).toBe(true);
  });
});
