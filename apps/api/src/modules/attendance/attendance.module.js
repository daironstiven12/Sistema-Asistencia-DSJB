const { Module } = require("@nestjs/common");
const { PrismaModule } = require("../../prisma/prisma.module");
const { PrismaService } = require("../../prisma/prisma.service");
const { AuthModule } = require("../auth/auth.module");
const { PrismaAttendanceStore } = require("./infrastructure/prisma-attendance-store");
const { PrismaAuthAudit } = require("../auth/infrastructure/prisma-auth-audit");
const sessions = require("./application/use-cases/sessions");
const offerings = require("./application/use-cases/offerings");
const registrations = require("./application/use-cases/registrations");
const signatures = require("./application/use-cases/signatures");
const { AttendanceSessionsController } = require("./interfaces/http/sessions.controller");
const { AttendanceHistoryController } = require("./interfaces/http/history.controller");
const { AttendanceOfferingsController } = require("./interfaces/http/offerings.controller");
const { AttendanceRegistrationsController } = require("./interfaces/http/registrations.controller");

function facade(useCases) {
  return (store, audit) => {
    const bound = {};
    for (const [name, fn] of Object.entries(useCases)) {
      bound[name] = (input) => fn(input, { store, audit });
    }
    return bound;
  };
}

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AttendanceSessionsController, AttendanceHistoryController, AttendanceOfferingsController, AttendanceRegistrationsController],
  providers: [
    {
      provide: "ATTENDANCE_STORE",
      useFactory: (prisma) => new PrismaAttendanceStore(prisma),
      inject: [PrismaService],
    },
    {
      provide: "AUTH_AUDIT",
      useFactory: (prisma) => new PrismaAuthAudit(prisma),
      inject: [PrismaService],
    },
    { provide: "ATTENDANCE_SESSIONS", useFactory: facade(sessions), inject: ["ATTENDANCE_STORE", "AUTH_AUDIT"] },
    { provide: "ATTENDANCE_OFFERINGS", useFactory: facade(offerings), inject: ["ATTENDANCE_STORE", "AUTH_AUDIT"] },
    {
      provide: "ATTENDANCE_REGISTRATIONS",
      useFactory: facade(registrations),
      inject: ["ATTENDANCE_STORE", "AUTH_AUDIT"],
    },
    {
      provide: "ATTENDANCE_SIGNATURES",
      useFactory: facade(signatures),
      inject: ["ATTENDANCE_STORE", "AUTH_AUDIT"],
    },
  ],
})
class AttendanceModule {}

module.exports = { AttendanceModule };
