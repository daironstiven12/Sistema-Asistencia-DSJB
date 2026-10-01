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
const { CreatePrerequisiteDto } = require("./dto/prerequisite.dto");
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
  throw error;
}

@Controller("academic/prerequisites")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("PREREQUISITES")
class PrerequisitesController {
  constructor(prerequisites) {
    this.prerequisites = prerequisites;
  }

  @Get()
  async list(query, req) {
    return this.prerequisites.list({ curriculumSubjectId: query?.curriculumSubjectId });
  }

  @Post()
  @Roles(ROLES.ADMINISTRADOR)
  async create(dto, req) {
    try {
      return await this.prerequisites.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Delete(":id")
  @Roles(ROLES.ADMINISTRADOR)
  async remove(id, req) {
    try {
      return await this.prerequisites.remove({ id, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { PrerequisitesController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(PrerequisitesController.prototype, "list", 0);
Req()(PrerequisitesController.prototype, "list", 1);
Body()(PrerequisitesController.prototype, "create", 0);
Req()(PrerequisitesController.prototype, "create", 1);
Param("id")(PrerequisitesController.prototype, "remove", 0);
Req()(PrerequisitesController.prototype, "remove", 1);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(PrerequisitesController, "list", [Object, Object]);
exposeParams(PrerequisitesController, "create", [CreatePrerequisiteDto, Object]);
exposeParams(PrerequisitesController, "remove", [Object, Object]);
