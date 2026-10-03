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
const { CreateCurriculumDto, UpdateCurriculumDto } = require("./dto/curriculum.dto");
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

@Controller("academic/curricula")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("CURRICULA")
class CurriculaController {
  constructor(curricula) {
    this.curricula = curricula;
  }

  @Get()
  async list(query, req) {
    return this.curricula.list({ programId: query?.programId, q: query?.q });
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.curricula.get({ id });
    } catch (error) {
      mapError(error);
    }
  }

  @Post()
  @Roles(ROLES.ADMINISTRADOR)
  async create(dto, req) {
    try {
      return await this.curricula.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id")
  @Roles(ROLES.ADMINISTRADOR)
  async update(id, dto, req) {
    try {
      return await this.curricula.update({ id, ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id/status")
  @Roles(ROLES.ADMINISTRADOR)
  async setStatus(id, dto, req) {
    try {
      return await this.curricula.setStatus({ id, status: dto.status, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { CurriculaController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(CurriculaController.prototype, "list", 0);
Req()(CurriculaController.prototype, "list", 1);
Param("id")(CurriculaController.prototype, "getById", 0);
Req()(CurriculaController.prototype, "getById", 1);
Body()(CurriculaController.prototype, "create", 0);
Req()(CurriculaController.prototype, "create", 1);
Param("id")(CurriculaController.prototype, "update", 0);
Body()(CurriculaController.prototype, "update", 1);
Req()(CurriculaController.prototype, "update", 2);
Param("id")(CurriculaController.prototype, "setStatus", 0);
Body()(CurriculaController.prototype, "setStatus", 1);
Req()(CurriculaController.prototype, "setStatus", 2);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(CurriculaController, "list", [Object, Object]);
exposeParams(CurriculaController, "getById", [Object, Object]);
exposeParams(CurriculaController, "create", [CreateCurriculumDto, Object]);
exposeParams(CurriculaController, "update", [Object, UpdateCurriculumDto, Object]);
exposeParams(CurriculaController, "setStatus", [Object, SetStatusDto, Object]);
