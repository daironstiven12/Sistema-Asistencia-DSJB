const {
  Body,
  Controller,
  Dependencies,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} = require("@nestjs/common");
const { Throttle } = require("@nestjs/throttler");
const {
  InvalidCredentialsError,
  SessionExpiredError,
  SessionNotFoundError,
  SessionRevokedError,
  SessionReuseError,
} = require("../../application/auth-errors");
const {
  REFRESH_COOKIE,
  clearCookieOptions,
  cookieOptions,
} = require("../../infrastructure/refresh-cookie");
const { LoginDto } = require("./dto/login.dto");
const { getAuthThrottle } = require("../../../../config/app-config");

const __authThrottle = getAuthThrottle();
const LOGIN_THROTTLE = __authThrottle.login;
const REFRESH_THROTTLE = __authThrottle.refresh;

@Controller("auth")
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
@Dependencies("LOGIN_USER", "REFRESH_SESSION", "LOGOUT")
class AuthController {
  constructor(loginUserCase, refreshSessionCase, logoutCase) {
    this.loginUser = loginUserCase;
    this.refreshSession = refreshSessionCase;
    this.logoutUser = logoutCase;
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: LOGIN_THROTTLE })
  async login(dto, req, res) {
    try {
      const result = await this.loginUser({
        username: dto.username,
        password: dto.password,
        ip: req?.ip,
        userAgent: req?.headers?.["user-agent"],
      });
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
      return {
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
        user: result.user,
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException("Credenciales inválidas");
      }
      throw error;
    }
  }

  @Post("refresh")
  @HttpCode(200)
  @Throttle({ default: REFRESH_THROTTLE })
  async refresh(req, res) {
    const refreshToken = req?.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException("Sesión inválida");
    try {
      const result = await this.refreshSession({
        refreshToken,
        ip: req?.ip,
        userAgent: req?.headers?.["user-agent"],
      });
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
      return { accessToken: result.accessToken, expiresAt: result.expiresAt };
    } catch (error) {
      if (
        error instanceof SessionNotFoundError ||
        error instanceof SessionExpiredError ||
        error instanceof SessionRevokedError ||
        error instanceof SessionReuseError
      ) {
        throw new UnauthorizedException("Sesión inválida");
      }
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(200)
  async logout(req, res) {
    const refreshToken = req?.cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      await this.logoutUser({
        refreshToken,
        ip: req?.ip,
        userAgent: req?.headers?.["user-agent"],
      });
    }
    res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
    return { revoked: true };
  }
}

module.exports = { AuthController, LOGIN_THROTTLE, REFRESH_THROTTLE };

// Babel no admite decoradores en parámetros: se aplican como funciones.
Body()(AuthController.prototype, "login", 0);
Req()(AuthController.prototype, "login", 1);
Res({ passthrough: true })(AuthController.prototype, "login", 2);
Req()(AuthController.prototype, "refresh", 0);
Res({ passthrough: true })(AuthController.prototype, "refresh", 1);
Req()(AuthController.prototype, "logout", 0);
Res({ passthrough: true })(AuthController.prototype, "logout", 1);

// Sin TS no hay design:paramtypes: se declaran para que ValidationPipe valide.
const { exposeParams } = require("./param-metadata");
exposeParams(AuthController, "login", [LoginDto, Object, Object]);
exposeParams(AuthController, "refresh", [Object, Object]);
exposeParams(AuthController, "logout", [Object, Object]);
