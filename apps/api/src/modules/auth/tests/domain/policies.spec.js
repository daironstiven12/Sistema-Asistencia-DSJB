const { validate, MIN_LENGTH } = require("../../domain/password-policy");
const {
  generateRefreshToken,
  hashRefreshToken,
  newFamilyId,
  refreshExpiresAt,
} = require("../../domain/session-policy");
const {
  buildAccessClaims,
  assertAccessClaims,
} = require("../../domain/token-claims");

describe("password-policy", () => {
  test("acepta una contraseña válida", () => {
    expect(validate("Clave-Segura-123").ok).toBe(true);
  });

  test("rechaza corta, vacía y excesiva", () => {
    expect(validate("corta").ok).toBe(false);
    expect(validate("").ok).toBe(false);
    expect(validate("x".repeat(129)).ok).toBe(false);
    expect(validate("x".repeat(MIN_LENGTH)).ok).toBe(true);
  });
});

describe("session-policy", () => {
  test("tokens opacos únicos de 43 caracteres", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(a).toHaveLength(43);
    expect(b).toHaveLength(43);
  });

  test("hash SHA-256 determinista de 64 hex", () => {
    const h1 = hashRefreshToken("abc");
    const h2 = hashRefreshToken("abc");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).not.toContain("abc");
  });

  test("familias únicas y expiración futura", () => {
    expect(newFamilyId()).not.toBe(newFamilyId());
    expect(refreshExpiresAt().getTime()).toBeGreaterThan(Date.now());
  });
});

describe("token-claims", () => {
  test("construye claims mínimos", () => {
    expect(
      buildAccessClaims({ userId: "7", roles: ["DOCENTE"], sessionId: "9" }),
    ).toEqual({ sub: "7", roles: ["DOCENTE"], sid: "9" });
  });

  test("rechaza claims incompletos", () => {
    expect(() => assertAccessClaims({})).toThrow();
    expect(() => assertAccessClaims({ sub: "1", roles: [] })).toThrow();
    expect(() =>
      assertAccessClaims({ sub: "1", sid: "2", roles: "x" }),
    ).toThrow();
  });
});
