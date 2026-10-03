const {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
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
const { CreateInstitutionDto, UpdateInstitutionDto } = require("./dto/institution.dto");
const { SetStatusDto } = require("./dto/set-status.dto");

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

@Controller("academic/institutions")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("INSTITUTIONS")
class InstitutionsController {
  constructor(institutions) {
    this.institutions = institutions;
  }

  @Get()
  async list(query, req) {
    return this.institutions.list({ q: query?.q });
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.institutions.get({ id });
    } catch (error) {
      mapError(error);
    }
  }

  @Post()
  @Roles(ROLES.ADMINISTRADOR)
  async create(dto, req) {
    try {
      return await this.institutions.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id")
  @Roles(ROLES.ADMINISTRADOR)
  async update(id, dto, req) {
    try {
      return await this.institutions.update({ id, ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Patch(":id/status")
  @Roles(ROLES.ADMINISTRADOR)
  async setStatus(id, dto, req) {
    try {
      return await this.institutions.setStatus({ id, status: dto.status, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { InstitutionsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(InstitutionsController.prototype, "list", 0);
Req()(InstitutionsController.prototype, "list", 1);
Param("id")(InstitutionsController.prototype, "getById", 0);
Req()(InstitutionsController.prototype, "getById", 1);
Body()(InstitutionsController.prototype, "create", 0);
Req()(InstitutionsController.prototype, "create", 1);
Param("id")(InstitutionsController.prototype, "update", 0);
Body()(InstitutionsController.prototype, "update", 1);
Req()(InstitutionsController.prototype, "update", 2);
Param("id")(InstitutionsController.prototype, "setStatus", 0);
Body()(InstitutionsController.prototype, "setStatus", 1);
Req()(InstitutionsController.prototype, "setStatus", 2);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
const { exposeParams } = require("../../../auth/interfaces/http/param-metadata");
exposeParams(InstitutionsController, "list", [Object, Object]);
exposeParams(InstitutionsController, "getById", [Object, Object]);
exposeParams(InstitutionsController, "create", [CreateInstitutionDto, Object]);
exposeParams(InstitutionsController, "update", [Object, UpdateInstitutionDto, Object]);
exposeParams(InstitutionsController, "setStatus", [Object, SetStatusDto, Object]);
