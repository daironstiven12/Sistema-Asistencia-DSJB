const {
  Controller,
  Dependencies,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} = require("@nestjs/common");
const { JwtAuthGuard } = require("../../../auth/interfaces/http/guards/jwt-auth.guard");
const { RolesGuard } = require("../../../auth/interfaces/http/guards/roles.guard");
const { Roles } = require("../../../auth/interfaces/http/roles.decorator");
const { ROLES } = require("../../../auth/domain/roles");
const { AttendanceForbiddenError } = require("../../application/attendance-errors");
const { exposeParams } = require("../../../auth/interfaces/http/param-metadata");

function mapError(error) {
  if (error instanceof AttendanceForbiddenError) {
    throw new ForbiddenException("Sin permiso");
  }
  throw error;
}

@Controller("attendance/offerings")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("ATTENDANCE_OFFERINGS")
class AttendanceOfferingsController {
  constructor(offerings) {
    this.offerings = offerings;
  }

  @Get()
  @Roles(ROLES.REPRESENTANTE)
  async list(req) {
    try {
      return await this.offerings.list({ userId: req.user.id, roles: req.user.roles ?? [] });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { AttendanceOfferingsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Req()(AttendanceOfferingsController.prototype, "list", 0);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(AttendanceOfferingsController, "list", [Object]);
