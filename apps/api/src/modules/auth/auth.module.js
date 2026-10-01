const { Module } = require("@nestjs/common");
const { PrismaModule } = require("../../prisma/prisma.module");
const { PrismaService } = require("../../prisma/prisma.service");
const { AuthController } = require("./interfaces/http/auth.controller");
const { JwtAuthGuard } = require("./interfaces/http/guards/jwt-auth.guard");
const { RolesGuard } = require("./interfaces/http/guards/roles.guard");
const { loginUser } = require("./application/login-user");
const { refreshSession } = require("./application/refresh-session");
const { logout } = require("./application/logout");
const { revokeUserSessions } = require("./application/revoke-user-sessions");
const { Argon2PasswordHasher } = require("./infrastructure/argon2-password-hasher");
const { JwtTokenIssuer } = require("./infrastructure/jwt-token-issuer");
const { PrismaUserReader } = require("./infrastructure/prisma-user-reader");
const { PrismaSessionStore } = require("./infrastructure/prisma-session-store");
const { PrismaAuthAudit } = require("./infrastructure/prisma-auth-audit");
const { refreshExpiresIn } = require("./infrastructure/auth-config");

const AUTH_CONFIG = { refreshExpiresIn: refreshExpiresIn() };

const STORE_DEPS = [
  "USER_READER",
  "PASSWORD_HASHER",
  "TOKEN_ISSUER",
  "SESSION_STORE",
  "AUTH_AUDIT",
];

function bind(useCase) {
  return (users, passwords, tokens, sessions, audit) => (input) =>
    useCase(input, { users, passwords, tokens, sessions, audit, config: AUTH_CONFIG });
}

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    { provide: "PASSWORD_HASHER", useClass: Argon2PasswordHasher },
    { provide: "TOKEN_ISSUER", useFactory: () => JwtTokenIssuer.fromEnv() },
    {
      provide: "SESSION_STORE",
      useFactory: (prisma) => new PrismaSessionStore(prisma),
      inject: [PrismaService],
    },
    {
      provide: "USER_READER",
      useFactory: (prisma) => new PrismaUserReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: "AUTH_AUDIT",
      useFactory: (prisma) => new PrismaAuthAudit(prisma),
      inject: [PrismaService],
    },
    { provide: "LOGIN_USER", useFactory: bind(loginUser), inject: STORE_DEPS },
    {
      provide: "REFRESH_SESSION",
      useFactory: bind(refreshSession),
      inject: STORE_DEPS,
    },
    { provide: "LOGOUT", useFactory: bind(logout), inject: STORE_DEPS },
    {
      provide: "REVOKE_USER_SESSIONS",
      useFactory: bind(revokeUserSessions),
      inject: STORE_DEPS,
    },
  ],
  exports: [
    "LOGIN_USER",
    "REFRESH_SESSION",
    "LOGOUT",
    "REVOKE_USER_SESSIONS",
    "TOKEN_ISSUER",
    JwtAuthGuard,
    RolesGuard,
  ],
})
class AuthModule {}

module.exports = { AuthModule };
