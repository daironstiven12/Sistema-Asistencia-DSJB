const {
  BadRequestException,
  Body,
  Controller,
  Dependencies,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
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
  ForbiddenError,
  InvalidCurrentPasswordError,
  UserNotFoundError,
  WeakPasswordError,
} = require("../../application/user-errors");
const { ChangePasswordDto } = require("./dto/change-password.dto");
const { SetStatusDto } = require("./dto/set-status.dto");

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("GET_USER", "CHANGE_PASSWORD", "SET_USER_STATUS")
class UsersController {
  constructor(getUser, changePasswordCase, setUserStatus) {
    this.getUser = getUser;
    this.changeUserPassword = changePasswordCase;
    this.setUserStatus = setUserStatus;
  }

  @Get(":id")
  async getById(id, req) {
    try {
      return await this.getUser({
        requesterId: req.user.id,
        requesterRoles: req.user.roles,
        targetUserId: id,
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException("Usuario no encontrado");
      }
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException("Sin permiso");
      }
      throw error;
    }
  }

  @Patch(":id/password")
  async changePassword(id, dto, req) {
    try {
      return await this.changeUserPassword({
        actorId: req.user.id,
        actorRoles: req.user.roles,
        targetUserId: id,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        ip: req.ip,
        userAgent: req.headers?.["user-agent"],
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException("Usuario no encontrado");
      }
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException("Sin permiso");
      }
      if (
        error instanceof WeakPasswordError ||
        error instanceof InvalidCurrentPasswordError
      ) {
        throw new BadRequestException("Contraseña inválida");
      }
      throw error;
    }
  }

  @Patch(":id/status")
  @Roles(ROLES.ADMINISTRADOR)
  async changeStatus(id, dto, req) {
    try {
      return await this.setUserStatus({
        actorId: req.user.id,
        actorRoles: req.user.roles,
        targetUserId: id,
        status: dto.status,
        ip: req.ip,
        userAgent: req.headers?.["user-agent"],
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException("Usuario no encontrado");
      }
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException("Sin permiso");
      }
      if (error.code === "INVALID_STATUS") {
        throw new BadRequestException("Estado inválido");
      }
      throw error;
    }
  }
}

module.exports = { UsersController };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Param("id")(UsersController.prototype, "getById", 0);
Req()(UsersController.prototype, "getById", 1);
Param("id")(UsersController.prototype, "changePassword", 0);
Body()(UsersController.prototype, "changePassword", 1);
Req()(UsersController.prototype, "changePassword", 2);
Param("id")(UsersController.prototype, "changeStatus", 0);
Body()(UsersController.prototype, "changeStatus", 1);
Req()(UsersController.prototype, "changeStatus", 2);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
const { exposeParams } = require("../../../auth/interfaces/http/param-metadata");
exposeParams(UsersController, "getById", [Object, Object]);
exposeParams(UsersController, "changePassword", [Object, ChangePasswordDto, Object]);
exposeParams(UsersController, "changeStatus", [Object, SetStatusDto, Object]);
