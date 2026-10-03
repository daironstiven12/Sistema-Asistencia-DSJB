const { Injectable, Logger } = require("@nestjs/common");

// Middleware global de logging HTTP.
// Una línea por petición: método, ruta (sin query), código final y duración.
// Nunca registra headers, Authorization, JWT, cookies, body ni contraseñas.
class HttpLoggerMiddleware {
  constructor() {
    this.logger = new Logger("HTTP");
  }

  use(req, res, next) {
    const start = Date.now();
    const method = req?.method ?? "UNKNOWN";
    const rawUrl = req?.originalUrl ?? req?.url ?? "/";
    const path = String(rawUrl).split("?")[0];
    let logged = false;
    const log = () => {
      if (logged) return;
      logged = true;
      const duration = Date.now() - start;
      this.logger.log(`${method} ${path} → ${res.statusCode} (${duration} ms)`);
    };
    res.on("finish", log);
    res.on("close", log);
    next();
  }
}

Injectable()(HttpLoggerMiddleware);

module.exports = { HttpLoggerMiddleware };
