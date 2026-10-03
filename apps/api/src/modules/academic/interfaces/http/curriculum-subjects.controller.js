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
const { CreateCurriculumSubjectDto } = require("./dto/curriculum-subject.dto");
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

@Controller("academic/curriculum-subjects")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("CURRICULUM_SUBJECTS")
class CurriculumSubjectsController {
  constructor(curriculumSubjects) {
    this.curriculumSubjects = curriculumSubjects;
  }

  @Get()
  async list(query, req) {
    return this.curriculumSubjects.list({
      curriculumId: query?.curriculumId,
      levelId: query?.levelId,
      subjectId: query?.subjectId,
    });
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.curriculumSubjects.get({ id });
    } catch (error) {
      mapError(error);
    }
  }

  @Post()
  @Roles(ROLES.ADMINISTRADOR)
  async create(dto, req) {
    try {
      return await this.curriculumSubjects.create({ ...dto, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }

  @Delete(":id")
  @Roles(ROLES.ADMINISTRADOR)
  async remove(id, req) {
    try {
      return await this.curriculumSubjects.remove({ id, ...actorOf(req) });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { CurriculumSubjectsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(CurriculumSubjectsController.prototype, "list", 0);
Req()(CurriculumSubjectsController.prototype, "list", 1);
Param("id")(CurriculumSubjectsController.prototype, "getById", 0);
Req()(CurriculumSubjectsController.prototype, "getById", 1);
Body()(CurriculumSubjectsController.prototype, "create", 0);
Req()(CurriculumSubjectsController.prototype, "create", 1);
Param("id")(CurriculumSubjectsController.prototype, "remove", 0);
Req()(CurriculumSubjectsController.prototype, "remove", 1);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(CurriculumSubjectsController, "list", [Object, Object]);
exposeParams(CurriculumSubjectsController, "getById", [Object, Object]);
exposeParams(CurriculumSubjectsController, "create", [CreateCurriculumSubjectDto, Object]);
exposeParams(CurriculumSubjectsController, "remove", [Object, Object]);
