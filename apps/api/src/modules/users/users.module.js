const { Module } = require("@nestjs/common");
const { PrismaModule } = require("../../prisma/prisma.module");
const { PrismaService } = require("../../prisma/prisma.service");
const { AuthModule } = require("../auth/auth.module");
const { UsersController } = require("./interfaces/http/users.controller");
const { getUser } = require("./application/get-user");
const { changePassword } = require("./application/change-password");
const { setUserStatus } = require("./application/set-user-status");
const { PrismaUserStore } = require("./infrastructure/prisma-user-store");
const { Argon2PasswordHasher } = require("../auth/infrastructure/argon2-password-hasher");
const { PrismaSessionStore } = require("../auth/infrastructure/prisma-session-store");
const { PrismaAuthAudit } = require("../auth/infrastructure/prisma-auth-audit");

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [
    { provide: "PASSWORD_HASHER", useClass: Argon2PasswordHasher },
    {
      provide: "USER_STORE",
      useFactory: (prisma) => new PrismaUserStore(prisma),
      inject: [PrismaService],
    },
    {
      provide: "SESSION_STORE",
      useFactory: (prisma) => new PrismaSessionStore(prisma),
      inject: [PrismaService],
    },
    {
      provide: "AUTH_AUDIT",
      useFactory: (prisma) => new PrismaAuthAudit(prisma),
      inject: [PrismaService],
    },
    {
      provide: "GET_USER",
      useFactory: (users) => (input) => getUser(input, { users }),
      inject: ["USER_STORE"],
    },
    {
      provide: "CHANGE_PASSWORD",
      useFactory:
        (users, passwords, sessions, audit) => (input) =>
          changePassword(input, { users, passwords, sessions, audit }),
      inject: ["USER_STORE", "PASSWORD_HASHER", "SESSION_STORE", "AUTH_AUDIT"],
    },
    {
      provide: "SET_USER_STATUS",
      useFactory:
        (users, sessions, audit) => (input) =>
          setUserStatus(input, { users, sessions, audit }),
      inject: ["USER_STORE", "SESSION_STORE", "AUTH_AUDIT"],
    },
  ],
})
class UsersModule {}

module.exports = { UsersModule };
