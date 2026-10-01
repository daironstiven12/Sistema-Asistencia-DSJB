const {
  Controller,
  Dependencies,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} = require("@nestjs/common");
const { JwtAuthGuard } = require("../../../auth/interfaces/http/guards/jwt-auth.guard");
const { RolesGuard } = require("../../../auth/interfaces/http/guards/roles.guard");
const { AcademicNotFoundError } = require("../../application/academic-errors");
const { exposeParams } = require("../../../auth/interfaces/http/param-metadata");

function mapError(error) {
  if (error instanceof AcademicNotFoundError) {
    throw new NotFoundException("No encontrado");
  }
  throw error;
}

@Controller("academic/levels")
@UseGuards(JwtAuthGuard, RolesGuard)
@Dependencies("LEVELS")
class LevelsController {
  constructor(levels) {
    this.levels = levels;
  }

  @Get()
  async list(query, req) {
    return this.levels.list();
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.levels.get({ id });
    } catch (error) {
      mapError(error);
    }
  }
}

module.exports = { LevelsController, mapError };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Query()(LevelsController.prototype, "list", 0);
Req()(LevelsController.prototype, "list", 1);
Param("id")(LevelsController.prototype, "getById", 0);
Req()(LevelsController.prototype, "getById", 1);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
exposeParams(LevelsController, "list", [Object, Object]);
exposeParams(LevelsController, "getById", [Object, Object]);
