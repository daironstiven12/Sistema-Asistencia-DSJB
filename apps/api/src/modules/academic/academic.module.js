const { Module } = require("@nestjs/common");
const { PrismaModule } = require("../../prisma/prisma.module");
const { PrismaService } = require("../../prisma/prisma.service");
const { AuthModule } = require("../auth/auth.module");
const { PrismaAcademicStore } = require("./infrastructure/prisma-academic-store");
const { PrismaAuthAudit } = require("../auth/infrastructure/prisma-auth-audit");
const institutions = require("./application/use-cases/institutions");
const faculties = require("./application/use-cases/faculties");
const programs = require("./application/use-cases/programs");
const curricula = require("./application/use-cases/curricula");
const levels = require("./application/use-cases/levels");
const subjects = require("./application/use-cases/subjects");
const curriculumSubjects = require("./application/use-cases/curriculum-subjects");
const prerequisites = require("./application/use-cases/prerequisites");
const { InstitutionsController } = require("./interfaces/http/institutions.controller");
const { FacultiesController } = require("./interfaces/http/faculties.controller");
const { ProgramsController } = require("./interfaces/http/programs.controller");
const { CurriculaController } = require("./interfaces/http/curricula.controller");
const { LevelsController } = require("./interfaces/http/levels.controller");
const { SubjectsController } = require("./interfaces/http/subjects.controller");
const { CurriculumSubjectsController } = require("./interfaces/http/curriculum-subjects.controller");
const { PrerequisitesController } = require("./interfaces/http/prerequisites.controller");

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
  controllers: [
    InstitutionsController,
    FacultiesController,
    ProgramsController,
    CurriculaController,
    LevelsController,
    SubjectsController,
    CurriculumSubjectsController,
    PrerequisitesController,
  ],
  providers: [
    {
      provide: "ACADEMIC_STORE",
      useFactory: (prisma) => new PrismaAcademicStore(prisma),
      inject: [PrismaService],
    },
    {
      provide: "AUTH_AUDIT",
      useFactory: (prisma) => new PrismaAuthAudit(prisma),
      inject: [PrismaService],
    },
    { provide: "INSTITUTIONS", useFactory: facade(institutions), inject: ["ACADEMIC_STORE", "AUTH_AUDIT"] },
    { provide: "FACULTIES", useFactory: facade(faculties), inject: ["ACADEMIC_STORE", "AUTH_AUDIT"] },
    { provide: "PROGRAMS", useFactory: facade(programs), inject: ["ACADEMIC_STORE", "AUTH_AUDIT"] },
    { provide: "CURRICULA", useFactory: facade(curricula), inject: ["ACADEMIC_STORE", "AUTH_AUDIT"] },
    { provide: "LEVELS", useFactory: facade(levels), inject: ["ACADEMIC_STORE", "AUTH_AUDIT"] },
    { provide: "SUBJECTS", useFactory: facade(subjects), inject: ["ACADEMIC_STORE", "AUTH_AUDIT"] },
    {
      provide: "CURRICULUM_SUBJECTS",
      useFactory: facade(curriculumSubjects),
      inject: ["ACADEMIC_STORE", "AUTH_AUDIT"],
    },
    {
      provide: "PREREQUISITES",
      useFactory: facade(prerequisites),
      inject: ["ACADEMIC_STORE", "AUTH_AUDIT"],
    },
  ],
})
class AcademicModule {}

module.exports = { AcademicModule };
