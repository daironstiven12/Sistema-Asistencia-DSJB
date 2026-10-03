const {
  Body,
  Controller,
  Dependencies,
  ForbiddenException,
  Get,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Param,
  Patch,
  Post,
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
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceInvalidReferenceError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");
const { CreateSessionDto, SignSessionDto, UpdateSessionDto } = require("./dto/session.dto");
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
    throw new NotFoundException("No encontrado");
  }
  if (error instanceof AttendanceForbiddenError) {
    throw new ForbiddenException("Sin permiso");
  }
  if (error instanceof AttendanceConflictError) {
    throw new ConflictException("Conflicto de asistencia");
  }
  if (error instanceof AttendanceInvalidReferenceError) {
    throw new BadRequestException("Referencia inválida");
  }
  if (error?.code === "INVALID_TRANSITION") {
    throw new ConflictException("Transición no permitida");
  }
  if (error?.code === "INVALID_STATUS") {
    throw new BadRequestException("Estado inválido");
  }
  if (error?.code === "INVALID_DATE" || error?.code === "INVALID_TIME") {
    throw new BadRequestException("Fecha u hora inválida");
  }
  throw error;
}

@Controller("attendance/sessions")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("ATTENDANCE_SESSIONS", "ATTENDANCE_REGISTRATIONS", "ATTENDANCE_SIGNATURES")
class AttendanceSessionsController {
  constructor(sessions, registrations, signatures) {
    this.sessions = sessions;
    this.registrations = registrations;
    this.signatures = signatures;
  }

  @Get()
  @Roles(ROLES.REPRESENTANTE, ROLES.ADMINISTRADOR)
  async list(query, req) {
    try {
      return await this.sessions.list({ userId: req.user.id, roles: req.user.roles ?? [] });
    } catch (error) {
      mapError(error);
    }
  }

  @Get("by-code/:code")
  @Roles(ROLES.ESTUDIANTE)
  async previewByCode(code, req) {
    // Vista previa mínima para el Paso 1 del registro. Los mensajes
    // amigables salen del mapeo de registros (sin duplicarlo aquí).
    const { mapError: mapRegistrationError } = require("./registrations.controller");
    try {
      return await this.registrations.preview({ code });
    } catch (error) {
      mapRegistrationError(error);
    }
  }

  @Get(":id")
  @Roles(ROLES.REPRESENTANTE, ROLES.ADMINISTRADOR)
  async getById(id, req) {
    try {
      return await this.sessions.get({ id, userId: req.user.id, roles: req.user.roles ?? [] });
    } catch (error) {
      mapError(error);
    }
  }

  @Post()
  @Roles(ROLES.REPRESENTANTE)
  async create(dto, req) {
    try {
      return await this.sessions.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Post(":id/open")
  @Roles(ROLES.REPRESENTANTE)
  async open(id, req) {
    try {
      return await this.sessions.open({ id, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Post(":id/close")
  @Roles(ROLES.REPRESENTANTE)
  async close(id, req) {
    try {
      return await this.sessions.close({ id, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Get(":id/records")
  @Roles(ROLES.REPRESENTANTE, ROLES.ADMINISTRADOR)
  async records(id, req) {
    try {
      return await this.registrations.list({
        sessionId: id,
        userId: req.user.id,
        roles: req.user.roles ?? [],
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Get(":id/signatures")
  @Roles(ROLES.REPRESENTANTE, ROLES.ADMINISTRADOR)
  async sessionSignatures(id, req) {
    try {
      return await this.signatures.sessionSignatures({
        sessionId: id,
        userId: req.user.id,
        roles: req.user.roles ?? [],
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Post(":id/sign")
  @Roles(ROLES.REPRESENTANTE)
  async sign(id, dto, req) {
    try {
      return await this.signatures.signSession({ sessionId: id, ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id")
  @Roles(ROLES.REPRESENTANTE)
  async updateTopics(id, dto, req) {
    try {
      return await this.sessions.updateTopics({ id, ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { AttendanceSessionsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(AttendanceSessionsController.prototype, "list", 0);
Req()(AttendanceSessionsController.prototype, "list", 1);
Param("code")(AttendanceSessionsController.prototype, "previewByCode", 0);
Req()(AttendanceSessionsController.prototype, "previewByCode", 1);
Param("id")(AttendanceSessionsController.prototype, "getById", 0);
Req()(AttendanceSessionsController.prototype, "getById", 1);
Body()(AttendanceSessionsController.prototype, "create", 0);
Req()(AttendanceSessionsController.prototype, "create", 1);
Param("id")(AttendanceSessionsController.prototype, "open", 0);
Req()(AttendanceSessionsController.prototype, "open", 1);
Param("id")(AttendanceSessionsController.prototype, "close", 0);
Req()(AttendanceSessionsController.prototype, "close", 1);
Param("id")(AttendanceSessionsController.prototype, "records", 0);
Req()(AttendanceSessionsController.prototype, "records", 1);
Param("id")(AttendanceSessionsController.prototype, "sessionSignatures", 0);
Req()(AttendanceSessionsController.prototype, "sessionSignatures", 1);
Param("id")(AttendanceSessionsController.prototype, "sign", 0);
Body()(AttendanceSessionsController.prototype, "sign", 1);
Req()(AttendanceSessionsController.prototype, "sign", 2);
Param("id")(AttendanceSessionsController.prototype, "updateTopics", 0);
Body()(AttendanceSessionsController.prototype, "updateTopics", 1);
Req()(AttendanceSessionsController.prototype, "updateTopics", 2);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(AttendanceSessionsController, "list", [Object, Object]);
exposeParams(AttendanceSessionsController, "previewByCode", [Object, Object]);
exposeParams(AttendanceSessionsController, "getById", [Object, Object]);
exposeParams(AttendanceSessionsController, "create", [CreateSessionDto, Object]);
exposeParams(AttendanceSessionsController, "open", [Object, Object]);
exposeParams(AttendanceSessionsController, "close", [Object, Object]);
exposeParams(AttendanceSessionsController, "records", [Object, Object]);
exposeParams(AttendanceSessionsController, "sessionSignatures", [Object, Object]);
exposeParams(AttendanceSessionsController, "sign", [Object, SignSessionDto, Object]);
exposeParams(AttendanceSessionsController, "updateTopics", [Object, UpdateSessionDto, Object]);
