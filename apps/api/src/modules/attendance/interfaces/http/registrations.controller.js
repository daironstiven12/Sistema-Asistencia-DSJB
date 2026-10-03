const {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Dependencies,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} = require("@nestjs/common");
const { JwtAuthGuard } = require("../../../auth/interfaces/http/guards/jwt-auth.guard");
const { RolesGuard } = require("../../../auth/interfaces/http/guards/roles.guard");
const { Roles } = require("../../../auth/interfaces/http/roles.decorator");
const { ROLES } = require("../../../auth/domain/roles");
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceInvalidReferenceError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");
const { RegisterDto } = require("./dto/session.dto");
const { exposeParams } = require("../../../auth/interfaces/http/param-metadata");

function actorOf(req) {
  return {
    actorId: req.user.id,
    roles: req.user.roles ?? [],
    ip: req.ip,
    userAgent: req.headers?.["user-agent"],
  };
}

function mapError(error) {
  if (error instanceof AttendanceNotFoundError) {
    throw new NotFoundException("El código de asistencia no es válido.");
  }
  if (error instanceof AttendanceForbiddenError) {
    throw new ForbiddenException(
      error.reason === "no-student-profile"
        ? "No tienes un perfil de estudiante activo."
        : error.reason === "not-member"
          ? "No perteneces al grupo de esta asistencia."
          : "Sin permiso",
    );
  }
  if (error instanceof AttendanceConflictError) {
    throw new ConflictException(
      error.reason === "session-not-open"
        ? "Esta asistencia no está disponible en este momento."
        : error.reason === "session-closed"
          ? "La asistencia ya fue cerrada y no admite nuevos registros."
          : error.reason === "already-registered"
            ? "Ya registraste tu asistencia en esta sesión."
            : "Conflicto de asistencia",
    );
  }
  if (error instanceof AttendanceInvalidReferenceError) {
    throw new BadRequestException(
      error.reason === "invalid-name"
        ? "Ingresa tu nombre completo."
        : error.reason === "invalid-identification"
          ? "Ingresa una cédula válida."
          : error.reason === "invalid-signature"
            ? "Debes registrar tu firma."
            : "Referencia inválida",
    );
  }
  // Error inesperado: el detalle técnico queda solo en logs del servidor y
  // el estudiante recibe un mensaje genérico (nunca Prisma/SQL/stack).
  // Error inesperado: el detalle técnico queda solo en logs del servidor y
  // el estudiante recibe un mensaje genérico (nunca Prisma/SQL/stack).
  new Logger("AttendanceRegistrations").error(
    `registro fallido: ${error?.message ?? error}`,
    error?.stack,
  );
  throw new InternalServerErrorException("No pudimos registrar tu asistencia. Inténtalo nuevamente.");
}

@Controller("attendance/registrations")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("ATTENDANCE_REGISTRATIONS")
class AttendanceRegistrationsController {
  constructor(registrations) {
    this.registrations = registrations;
  }

  @Post()
  @Roles(ROLES.ESTUDIANTE)
  async register(dto, req) {
    try {
      return await this.registrations.register({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { AttendanceRegistrationsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Body()(AttendanceRegistrationsController.prototype, "register", 0);
Req()(AttendanceRegistrationsController.prototype, "register", 1);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(AttendanceRegistrationsController, "register", [RegisterDto, Object]);
