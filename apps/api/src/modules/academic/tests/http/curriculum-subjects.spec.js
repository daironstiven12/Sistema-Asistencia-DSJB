const { validate } = require("class-validator");
const {
  CurriculumSubjectsController,
} = require("../../interfaces/http/curriculum-subjects.controller");
const {
  CreateCurriculumSubjectDto,
} = require("../../interfaces/http/dto/curriculum-subject.dto");
const {
  AcademicConflictError,
  AcademicInvalidReferenceError,
  AcademicNotFoundError,
} = require("../../application/academic-errors");
const { __paramOf } = require("../../../auth/tests/nest-common.stub");
const { __readMetadata } = require("../../../auth/tests/nest-common.stub");

const req = (user) => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user: user ?? { id: "1", roles: ["ADMINISTRADOR"] },
});

async function errorsOf(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values));
}

function facadeMock() {
  const links = [
    { id: "1", curriculum_id: "1", subject_id: "1", academic_level_id: "1" },
    { id: "2", curriculum_id: "1", subject_id: "2", academic_level_id: "2" },
  ];
  return {
    list: async ({ curriculumId, levelId } = {}) =>
      links
        .filter((l) => (curriculumId ? String(l.curriculum_id) === String(curriculumId) : true))
        .filter((l) => (levelId ? String(l.academic_level_id) === String(levelId) : true)),
    get: async ({ id }) => {
      const row = links.find((l) => String(l.id) === String(id));
      if (!row) throw new AcademicNotFoundError();
      return row;
    },
    create: async (input) => {
      if (["curriculumId", "subjectId", "levelId"].some((k) => input[k] === "99")) {
        throw new AcademicNotFoundError();
      }
      if (input.curriculumId === "1" && input.subjectId === "1") {
        throw new AcademicConflictError();
      }
      return { id: "3", ...input };
    },
    remove: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1" };
    },
  };
}

describe("curriculum-subjects controller", () => {
  test("listado filtra por plan y nivel", async () => {
    const controller = new CurriculumSubjectsController(facadeMock());
    expect(await controller.list({ curriculumId: "1" }, req())).toHaveLength(2);
    expect(
      await controller.list({ curriculumId: "1", levelId: "2" }, req()),
    ).toHaveLength(1);
    expect(await controller.list({ curriculumId: "99" }, req())).toEqual([]);
  });

  test("listado por subjectId y combinaciones", async () => {
    const seen = [];
    const controller = new CurriculumSubjectsController({
      ...facadeMock(),
      list: async (input) => {
        seen.push(input);
        const rows = [
          { id: "1", curriculum_id: "1", subject_id: "1", academic_level_id: "1" },
          { id: "2", curriculum_id: "1", subject_id: "2", academic_level_id: "2" },
        ]
          .filter((r) =>
            input?.curriculumId ? String(r.curriculum_id) === String(input.curriculumId) : true,
          )
          .filter((r) =>
            input?.levelId ? String(r.academic_level_id) === String(input.levelId) : true,
          )
          .filter((r) =>
            input?.subjectId ? String(r.subject_id) === String(input.subjectId) : true,
          );
        return rows;
      },
    });
    expect(await controller.list({ subjectId: "1" }, req())).toHaveLength(1);
    expect(
      await controller.list({ curriculumId: "1", subjectId: "2" }, req()),
    ).toHaveLength(1);
    expect(
      await controller.list({ levelId: "2", subjectId: "2" }, req()),
    ).toHaveLength(1);
    expect(
      await controller.list({ curriculumId: "1", levelId: "1", subjectId: "1" }, req()),
    ).toHaveLength(1);
    expect(await controller.list({ subjectId: "99" }, req())).toEqual([]);
    expect(seen[1]).toEqual({ curriculumId: "1", subjectId: "2" });
  });

  test("get inexistente mapea 404", async () => {
    const controller = new CurriculumSubjectsController(facadeMock());
    await expect(controller.getById("1", req())).resolves.toMatchObject({ id: "1" });
    await expect(controller.getById("99", req())).rejects.toMatchObject({ status: 404 });
  });

  test("create válido, duplicado 409 y referencias inexistentes 404", async () => {
    const controller = new CurriculumSubjectsController(facadeMock());
    await expect(
      controller.create(
        { curriculumId: "2", subjectId: "3", levelId: "1", isMandatory: true },
        req(),
      ),
    ).resolves.toMatchObject({ id: "3" });
    await expect(
      controller.create({ curriculumId: "1", subjectId: "1", levelId: "1" }, req()),
    ).rejects.toMatchObject({ status: 409 });
    for (const field of ["curriculumId", "subjectId", "levelId"]) {
      await expect(
        controller.create({ curriculumId: "1", subjectId: "1", levelId: "1", [field]: "99" }, req()),
      ).rejects.toMatchObject({ status: 404 });
    }
  });

  test("remove válido y remove inexistente 404 (sin PATCH en esta entidad)", async () => {
    const controller = new CurriculumSubjectsController(facadeMock());
    await expect(controller.remove("1", req())).resolves.toMatchObject({ id: "1" });
    await expect(controller.remove("99", req())).rejects.toMatchObject({ status: 404 });
    expect(controller.update).toBeUndefined();
  });

  test("referencia inválida residual mapea 400", async () => {
    const controller = new CurriculumSubjectsController({
      ...facadeMock(),
      get: async () => {
        throw new AcademicInvalidReferenceError();
      },
    });
    await expect(controller.getById("1", req())).rejects.toMatchObject({ status: 400 });
  });

  test("DTO: exige plan, asignatura y nivel; subjectType del catálogo", async () => {
    expect(
      await errorsOf(CreateCurriculumSubjectDto, {
        curriculumId: "1",
        subjectId: "1",
        levelId: "1",
        isMandatory: true,
        position: 1,
        credits: 4,
      }),
    ).toEqual([]);
    expect(await errorsOf(CreateCurriculumSubjectDto, { curriculumId: "1" })).not.toEqual([]);
    expect(await errorsOf(CreateCurriculumSubjectDto, {})).not.toEqual([]);
    expect(
      await errorsOf(CreateCurriculumSubjectDto, {
        curriculumId: "1",
        subjectId: "1",
        levelId: "1",
        subjectType: "RARO",
      }),
    ).not.toEqual([]);
    expect(
      await errorsOf(CreateCurriculumSubjectDto, {
        curriculumId: "1",
        subjectId: "1",
        levelId: "1",
        subjectType: "ELECTIVE",
      }),
    ).toEqual([]);
  });

  test("modificación exige ADMINISTRADOR y lectura es autenticada", () => {
    expect(__readMetadata(CurriculumSubjectsController.prototype, "roles", "create")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(CurriculumSubjectsController.prototype, "roles", "remove")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(CurriculumSubjectsController.prototype, "roles", "list")).toBeUndefined();
    expect(__readMetadata(CurriculumSubjectsController.prototype, "roles", "getById")).toBeUndefined();
  });

  test(":id se recibe correctamente en get y remove", () => {
    for (const method of ["getById", "remove"]) {
      expect(__paramOf(CurriculumSubjectsController.prototype, method, 0)).toEqual(
        expect.objectContaining({ property: "id" }),
      );
    }
  });
});
