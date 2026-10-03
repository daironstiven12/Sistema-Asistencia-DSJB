const { loginUser } = require("../../application/login-user");
const { Argon2PasswordHasher } = require("../../infrastructure/argon2-password-hasher");
const { JwtTokenIssuer } = require("../../infrastructure/jwt-token-issuer");

describe("expiración configurable del refresh", () => {
  test("la sesión usa la duración inyectada, no un valor fijo", async () => {
    const passwords = new Argon2PasswordHasher();
    const user = {
      id: "7",
      username: "u",
      email: "u@utch.edu.co",
      passwordHash: await passwords.hash("Clave-Segura-123"),
      status: "ACTIVE",
      roles: [],
    };
    const created = [];
    const deps = {
      users: {
        findByUsername: async () => user,
        findByEmail: async () => user,
      },
      passwords,
      tokens: new JwtTokenIssuer({ secret: "s".repeat(32) }),
      sessions: {
        create: async (data) => {
          created.push(data);
          return { id: "1", expiresAt: data.expiresAt };
        },
      },
      audit: { log: async () => {} },
      config: { refreshExpiresIn: "1h" },
    };
    const before = Date.now();
    await loginUser({ email: "u@utch.edu.co", password: "Clave-Segura-123" }, deps);
    const diff = created[0].expiresAt.getTime() - before;
    expect(diff).toBeGreaterThan(3590000);
    expect(diff).toBeLessThan(3610000);
  });
});
