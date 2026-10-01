const {
  COOKIE_PATH,
  REFRESH_COOKIE,
  clearCookieOptions,
  cookieOptions,
} = require("../../infrastructure/refresh-cookie");
const { __throttleOf } = require("../nest-throttler.stub");
const {
  LOGIN_THROTTLE,
  REFRESH_THROTTLE,
} = require("../../interfaces/http/auth.controller");

describe("refresh-cookie", () => {
  test("nombre y path restringido", () => {
    expect(REFRESH_COOKIE).toBe("refresh_token");
    expect(COOKIE_PATH).toBe("/auth");
  });

  test("desarrollo: sin secure para HTTP local", () => {
    const options = cookieOptions({ NODE_ENV: "development" });
    expect(options).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/auth",
    });
    expect(options.maxAge).toBe(7 * 86400000);
  });

  test("producción: secure y respeta entorno", () => {
    const options = cookieOptions({
      NODE_ENV: "production",
      REFRESH_TOKEN_EXPIRES_IN: "1d",
    });
    expect(options.secure).toBe(true);
    expect(options.maxAge).toBe(86400000);
  });

  test("limpieza sin maxAge pero mismo alcance", () => {
    const clear = clearCookieOptions({ NODE_ENV: "development" });
    expect(clear.maxAge).toBeUndefined();
    expect(clear).toMatchObject({ httpOnly: true, path: "/auth" });
  });
});

describe("throttling de auth", () => {
  test("login y refresh tienen límites estrictos", () => {
    expect(LOGIN_THROTTLE).toEqual({ limit: 10, ttl: 60000 });
    expect(REFRESH_THROTTLE).toEqual({ limit: 20, ttl: 60000 });
    expect(REFRESH_THROTTLE.limit).toBeGreaterThan(LOGIN_THROTTLE.limit);
  });

  test("decoradores aplicados en login y refresh", async () => {
    const { AuthController } = require("../../interfaces/http/auth.controller");
    expect(__throttleOf(AuthController.prototype, "login")).toBeDefined();
    expect(__throttleOf(AuthController.prototype, "refresh")).toBeDefined();
    expect(__throttleOf(AuthController.prototype, "logout")).toBeUndefined();
  });
});
