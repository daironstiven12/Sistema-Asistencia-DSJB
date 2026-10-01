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
const { CreateSubjectDto, UpdateSubjectDto } = require("./dto/subject.dto");
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

@Controller("academic/subjects")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("SUBJECTS")
class SubjectsController {
  constructor(subjects) {
    this.subjects = subjects;
  }

  @Get()
  async list(query, req) {
    return this.subjects.list({ query: query?.q });
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.subjects.get({ id });
    } catch (error) {
      mapError(error);
    }
  }

  @Post()
  @Roles(ROLES.ADMINISTRADOR)
  async create(dto, req) {
    try {
      return await this.subjects.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id")
  @Roles(ROLES.ADMINISTRADOR)
  async update(id, dto, req) {
    try {
      return await this.subjects.update({ id, ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id/status")
  @Roles(ROLES.ADMINISTRADOR)
  async setStatus(id, dto, req) {
    try {
      return await this.subjects.setStatus({ id, status: dto.status, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { SubjectsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(SubjectsController.prototype, "list", 0);
Req()(SubjectsController.prototype, "list", 1);
Param("id")(SubjectsController.prototype, "getById", 0);
Req()(SubjectsController.prototype, "getById", 1);
Body()(SubjectsController.prototype, "create", 0);
Req()(SubjectsController.prototype, "create", 1);
Param("id")(SubjectsController.prototype, "update", 0);
Body()(SubjectsController.prototype, "update", 1);
Req()(SubjectsController.prototype, "update", 2);
Param("id")(SubjectsController.prototype, "setStatus", 0);
Body()(SubjectsController.prototype, "setStatus", 1);
Req()(SubjectsController.prototype, "setStatus", 2);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(SubjectsController, "list", [Object, Object]);
exposeParams(SubjectsController, "getById", [Object, Object]);
exposeParams(SubjectsController, "create", [CreateSubjectDto, Object]);
exposeParams(SubjectsController, "update", [Object, UpdateSubjectDto, Object]);
exposeParams(SubjectsController, "setStatus", [Object, SetStatusDto, Object]);
