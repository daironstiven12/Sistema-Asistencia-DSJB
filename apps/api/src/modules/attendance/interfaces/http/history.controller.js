const {
  BadRequestException,
  Controller,
  Dependencies,
  ForbiddenException,
  Get,
  Query,
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
const { HistoryQueryDto } = require("./dto/session.dto");
const { exposeParams } = require("../../../auth/interfaces/http/param-metadata");

function actorOf(req) {
  return {
    actorId: req.user.id,
    roles: req.user.roles ?? [],
  };
}

function mapError(error) {
  if (error instanceof AttendanceForbiddenError) {
    throw new ForbiddenException("Sin permiso");
  }
  if (error?.code === "INVALID_STATUS") {
    throw new BadRequestException("Estado inválido");
  }
  if (error?.code === "INVALID_DATE") {
    throw new BadRequestException("Rango de fechas inválido");
  }
  throw error;
}

// Historial paginado del representante: filtros y paginación en la BD.
// El alcance se deriva del JWT (representative_assignments), nunca de
// parámetros del cliente.
@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("ATTENDANCE_SESSIONS")
class AttendanceHistoryController {
  constructor(sessions) {
    this.sessions = sessions;
  }

  @Get("history")
  @Roles(ROLES.REPRESENTANTE, ROLES.ADMINISTRADOR)
  async history(query, req) {
    try {
      return await this.sessions.history({ ...query, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { AttendanceHistoryController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(AttendanceHistoryController.prototype, "history", 0);
Req()(AttendanceHistoryController.prototype, "history", 1);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(AttendanceHistoryController, "history", [HistoryQueryDto, Object]);
