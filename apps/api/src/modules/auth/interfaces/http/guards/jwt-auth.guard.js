const { Dependencies, Injectable, UnauthorizedException } = require("@nestjs/common");

@Injectable()
@Dependencies("TOKEN_ISSUER")
class JwtAuthGuard {
  constructor(tokens) {
    this.tokens = tokens;
  }

  async canActivate(context) {
    const req = context.switchToHttp().getRequest();
    const header = req?.headers?.authorization ?? "";
    const [scheme, token] = String(header).split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("No autenticado");
    }
    try {
      const payload = await this.tokens.verifyAccess(token);
      req.user = {
        id: payload.sub,
        roles: payload.roles ?? [],
        sessionId: payload.sid,
      };
      return true;
    } catch {
      throw new UnauthorizedException("No autenticado");
    }
  }
}

module.exports = { JwtAuthGuard };
