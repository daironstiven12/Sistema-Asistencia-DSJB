const { HttpLoggerMiddleware } = require("./http-logger.middleware");

function fakeLogger() {
  const lines = [];
  return { lines, log: (msg) => lines.push(String(msg)) };
}

function fakeRes(statusCode = 200) {
  const handlers = {};
  return {
    statusCode,
    on: (event, cb) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(cb);
    },
    emit: (event) => {
      (handlers[event] ?? []).forEach((cb) => cb());
    },
  };
}

describe("HttpLoggerMiddleware", () => {
  test("llama next() sin registrar nada antes de la respuesta", () => {
    const logger = fakeLogger();
    const middleware = new HttpLoggerMiddleware();
    middleware.logger = logger;
    const res = fakeRes(200);
    let nextCalled = false;
    middleware.use({ method: "GET", originalUrl: "/users/2" }, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect(logger.lines).toHaveLength(0);
  });

  test("registra método, ruta, código y duración al finalizar", () => {
    const logger = fakeLogger();
    const middleware = new HttpLoggerMiddleware();
    middleware.logger = logger;
    const res = fakeRes(200);
    middleware.use({ method: "GET", originalUrl: "/users/2" }, res, () => {});
    res.emit("finish");
    expect(logger.lines).toHaveLength(1);
    expect(logger.lines[0]).toMatch(/^GET \/users\/2 → 200 \(\d+ ms\)$/);
  });

  test("registra códigos de error (401) y recorta query strings", () => {
    const logger = fakeLogger();
    const middleware = new HttpLoggerMiddleware();
    middleware.logger = logger;
    const res = fakeRes(401);
    middleware.use(
      { method: "POST", originalUrl: "/auth/refresh?token=secreto-sensible" },
      res,
      () => {},
    );
    res.emit("finish");
    expect(logger.lines).toHaveLength(1);
    expect(logger.lines[0]).toMatch(/^POST \/auth\/refresh → 401 \(\d+ ms\)$/);
    expect(logger.lines[0]).not.toContain("token=secreto-sensible");
  });

  test("no registra headers, cookies ni body", () => {
    const logger = fakeLogger();
    const middleware = new HttpLoggerMiddleware();
    middleware.logger = logger;
    const res = fakeRes(200);
    middleware.use(
      {
        method: "POST",
        originalUrl: "/auth/login",
        headers: { authorization: "Bearer super-secreto", cookie: "refresh_token=abc" },
        body: { username: "u", password: "clave-super-secreta" },
      },
      res,
      () => {},
    );
    res.emit("finish");
    expect(logger.lines).toHaveLength(1);
    expect(logger.lines[0]).not.toContain("Bearer");
    expect(logger.lines[0]).not.toContain("refresh_token");
    expect(logger.lines[0]).not.toContain("clave-super-secreta");
  });

  test("una sola línea aunque finish y close disparen", () => {
    const logger = fakeLogger();
    const middleware = new HttpLoggerMiddleware();
    middleware.logger = logger;
    const res = fakeRes(500);
    middleware.use({ method: "GET", url: "/x" }, res, () => {});
    res.emit("finish");
    res.emit("close");
    expect(logger.lines).toHaveLength(1);
    expect(logger.lines[0]).toMatch(/^GET \/x → 500 \(\d+ ms\)$/);
  });
});
