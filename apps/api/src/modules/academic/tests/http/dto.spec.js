const { validate } = require("class-validator");
const {
  CreateInstitutionDto,
  UpdateInstitutionDto,
} = require("../../interfaces/http/dto/institution.dto");
const { CreateFacultyDto } = require("../../interfaces/http/dto/faculty.dto");
const { CreateProgramDto } = require("../../interfaces/http/dto/program.dto");
const {
  CreateCurriculumSubjectDto,
} = require("../../interfaces/http/dto/curriculum-subject.dto");
const { CreatePrerequisiteDto } = require("../../interfaces/http/dto/prerequisite.dto");
const { SetStatusDto } = require("../../interfaces/http/dto/set-status.dto");

async function errorsOf(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values));
}

describe("academic DTOs", () => {
  test("creación válida y rechazos básicos", async () => {
    expect(
      await errorsOf(CreateInstitutionDto, { name: "UTCH", code: "UT" }),
    ).toEqual([]);
    expect(await errorsOf(CreateInstitutionDto, {})).not.toEqual([]);
    expect(
      await errorsOf(CreateFacultyDto, { name: "F" }),
    ).not.toEqual([]);
    expect(
      await errorsOf(CreateProgramDto, { facultyId: "1", name: "P" }),
    ).toEqual([]);
  });

  test("estados y tipos solo admiten catálogo", async () => {
    expect(await errorsOf(SetStatusDto, { status: "ACTIVE" })).toEqual([]);
    expect(await errorsOf(SetStatusDto, { status: "X" })).not.toEqual([]);
    expect(
      await errorsOf(CreatePrerequisiteDto, {
        curriculumSubjectId: "1",
        prerequisiteSubjectId: "1",
      }),
    ).toEqual([]);
    expect(
      await errorsOf(CreateCurriculumSubjectDto, {
        curriculumId: "1",
        subjectId: "1",
        levelId: "1",
        subjectType: "RARO",
      }),
    ).not.toEqual([]);
  });
});
