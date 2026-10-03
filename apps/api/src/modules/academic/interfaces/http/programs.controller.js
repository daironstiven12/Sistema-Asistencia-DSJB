const {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Dependencies,
  Get,
  NotFoundException,
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
  AcademicConflictError,
  AcademicInvalidReferenceError,
  AcademicNotFoundError,
} = require("../../application/academic-errors");
const { CreateProgramDto, UpdateProgramDto } = require("./dto/program.dto");
const { SetStatusDto } = require("./dto/set-status.dto");
const { exposeParams } = require("../../../auth/interfaces/http/param-metadata");

function actorOf(req) {
  return {
    actorId: req.user.id,
    ip: req.ip,
    userAgent: req.headers?.["user-agent"],
  };
}

function mapError(error) {
  if (error instanceof AcademicNotFoundError) {
    throw new NotFoundException("No encontrado");
  }
  if (error instanceof AcademicConflictError) {
    throw new ConflictException("Registro duplicado");
  }
  if (error instanceof AcademicInvalidReferenceError) {
    throw new BadRequestException("Referencia inválida");
  }
  if (error?.code === "INVALID_STATUS") {
    throw new BadRequestException("Estado inválido");
  }
  throw error;
}

@Controller("academic/programs")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("PROGRAMS")
class ProgramsController {
  constructor(programs) {
    this.programs = programs;
  }

  @Get()
  async list(query, req) {
    return this.programs.list({ facultyId: query?.facultyId, q: query?.q });
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.programs.get({ id });
    } catch (error) {
      mapError(error);
    }
  }

  @Post()
  @Roles(ROLES.ADMINISTRADOR)
  async create(dto, req) {
    try {
      return await this.programs.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id")
  @Roles(ROLES.ADMINISTRADOR)
  async update(id, dto, req) {
    try {
      return await this.programs.update({ id, ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id/status")
  @Roles(ROLES.ADMINISTRADOR)
  async setStatus(id, dto, req) {
    try {
      return await this.programs.setStatus({ id, status: dto.status, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { ProgramsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(ProgramsController.prototype, "list", 0);
Req()(ProgramsController.prototype, "list", 1);
Param("id")(ProgramsController.prototype, "getById", 0);
Req()(ProgramsController.prototype, "getById", 1);
Body()(ProgramsController.prototype, "create", 0);
Req()(ProgramsController.prototype, "create", 1);
Param("id")(ProgramsController.prototype, "update", 0);
Body()(ProgramsController.prototype, "update", 1);
Req()(ProgramsController.prototype, "update", 2);
Param("id")(ProgramsController.prototype, "setStatus", 0);
Body()(ProgramsController.prototype, "setStatus", 1);
Req()(ProgramsController.prototype, "setStatus", 2);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(ProgramsController, "list", [Object, Object]);
exposeParams(ProgramsController, "getById", [Object, Object]);
exposeParams(ProgramsController, "create", [CreateProgramDto, Object]);
exposeParams(ProgramsController, "update", [Object, UpdateProgramDto, Object]);
exposeParams(ProgramsController, "setStatus", [Object, SetStatusDto, Object]);
