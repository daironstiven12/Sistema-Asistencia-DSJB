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
const { CreateFacultyDto, UpdateFacultyDto } = require("./dto/faculty.dto");
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

@Controller("academic/faculties")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("FACULTIES")
class FacultiesController {
  constructor(faculties) {
    this.faculties = faculties;
  }

  @Get()
  async list(query, req) {
    return this.faculties.list({ institutionId: query?.institutionId, q: query?.q });
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.faculties.get({ id });
    } catch (error) {
      mapError(error);
    }
  }

  @Post()
  @Roles(ROLES.ADMINISTRADOR)
  async create(dto, req) {
    try {
      return await this.faculties.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id")
  @Roles(ROLES.ADMINISTRADOR)
  async update(id, dto, req) {
    try {
      return await this.faculties.update({ id, ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id/status")
  @Roles(ROLES.ADMINISTRADOR)
  async setStatus(id, dto, req) {
    try {
      return await this.faculties.setStatus({ id, status: dto.status, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { FacultiesController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(FacultiesController.prototype, "list", 0);
Req()(FacultiesController.prototype, "list", 1);
Param("id")(FacultiesController.prototype, "getById", 0);
Req()(FacultiesController.prototype, "getById", 1);
Body()(FacultiesController.prototype, "create", 0);
Req()(FacultiesController.prototype, "create", 1);
Param("id")(FacultiesController.prototype, "update", 0);
Body()(FacultiesController.prototype, "update", 1);
Req()(FacultiesController.prototype, "update", 2);
Param("id")(FacultiesController.prototype, "setStatus", 0);
Body()(FacultiesController.prototype, "setStatus", 1);
Req()(FacultiesController.prototype, "setStatus", 2);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(FacultiesController, "list", [Object, Object]);
exposeParams(FacultiesController, "getById", [Object, Object]);
exposeParams(FacultiesController, "create", [CreateFacultyDto, Object]);
exposeParams(FacultiesController, "update", [Object, UpdateFacultyDto, Object]);
exposeParams(FacultiesController, "setStatus", [Object, SetStatusDto, Object]);
