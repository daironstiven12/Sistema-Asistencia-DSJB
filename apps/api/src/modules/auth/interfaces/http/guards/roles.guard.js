const { ForbiddenException, Injectable, UnauthorizedException } = require("@nestjs/common");
const { Dependencies } = require("@nestjs/common");
const { Reflector } = require("@nestjs/core");
const { ROLES_KEY } = require("../roles.decorator");

@Injectable()
@Dependencies(Reflector)
class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  async canActivate(context) {
    const required = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const user = context.switchToHttp().getRequest()?.user;
    if (!user) throw new UnauthorizedException("No autenticado");
    const allowed = required.some((role) => (user.roles ?? []).includes(role));
    if (!allowed) throw new ForbiddenException("Sin permiso");
    return true;
  }
}

module.exports = { RolesGuard };
