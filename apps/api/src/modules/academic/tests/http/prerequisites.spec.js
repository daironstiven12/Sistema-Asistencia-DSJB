const { validate } = require("class-validator");
const {
  PrerequisitesController,
} = require("../../interfaces/http/prerequisites.controller");
const {
  CreatePrerequisiteDto,
} = require("../../interfaces/http/dto/prerequisite.dto");
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
  const rows = [
    { id: "1", curriculum_subject_id: "2", prerequisite_subject_id: "1" },
  ];
  const known = new Set(["1", "2"]);
  return {
    list: async ({ curriculumSubjectId } = {}) =>
      rows.filter((r) =>
        curriculumSubjectId ? String(r.curriculum_subject_id) === String(curriculumSubjectId) : true,
      ),
    create: async (input) => {
      if (String(input.curriculumSubjectId) === String(input.prerequisiteSubjectId)) {
        throw new AcademicInvalidReferenceError();
      }
      if (!known.has(String(input.curriculumSubjectId)) || !known.has(String(input.prerequisiteSubjectId))) {
        throw new AcademicNotFoundError();
      }
      if (String(input.curriculumSubjectId) === "2" && String(input.prerequisiteSubjectId) === "1") {
        throw new AcademicConflictError();
      }
      return { id: "2", ...input };
    },
    remove: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1" };
    },
  };
}

describe("prerequisites controller", () => {
  test("listado filtra por vínculo curricular", async () => {
    const controller = new PrerequisitesController(facadeMock());
    expect(await controller.list({ curriculumSubjectId: "2" }, req())).toHaveLength(1);
    expect(await controller.list({ curriculumSubjectId: "99" }, req())).toEqual([]);
    expect(await controller.list({}, req())).toHaveLength(1);
  });

  test("create válido, duplicado 409 y referencias inexistentes 404", async () => {
    const controller = new PrerequisitesController(facadeMock());
    await expect(
      controller.create({ curriculumSubjectId: "1", prerequisiteSubjectId: "2" }, req()),
    ).resolves.toMatchObject({ id: "2" });
    await expect(
      controller.create({ curriculumSubjectId: "2", prerequisiteSubjectId: "1" }, req()),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      controller.create({ curriculumSubjectId: "99", prerequisiteSubjectId: "1" }, req()),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      controller.create({ curriculumSubjectId: "1", prerequisiteSubjectId: "99" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("autorreferencia mapea 400", async () => {
    const controller = new PrerequisitesController(facadeMock());
    await expect(
      controller.create({ curriculumSubjectId: "1", prerequisiteSubjectId: "1" }, req()),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("remove válido e inexistente 404 (sin PATCH en esta entidad)", async () => {
    const controller = new PrerequisitesController(facadeMock());
    await expect(controller.remove("1", req())).resolves.toMatchObject({ id: "1" });
    await expect(controller.remove("99", req())).rejects.toMatchObject({ status: 404 });
    expect(controller.update).toBeUndefined();
    expect(controller.getById).toBeUndefined();
  });

  test("DTO: exige ambos vínculos como strings", async () => {
    expect(
      await errorsOf(CreatePrerequisiteDto, {
        curriculumSubjectId: "2",
        prerequisiteSubjectId: "1",
      }),
    ).toEqual([]);
    expect(await errorsOf(CreatePrerequisiteDto, { curriculumSubjectId: "2" })).not.toEqual([]);
    expect(await errorsOf(CreatePrerequisiteDto, {})).not.toEqual([]);
    expect(
      await errorsOf(CreatePrerequisiteDto, { curriculumSubjectId: 2, prerequisiteSubjectId: "1" }),
    ).not.toEqual([]);
  });

  test("modificación exige ADMINISTRADOR y lectura es autenticada", () => {
    expect(__readMetadata(PrerequisitesController.prototype, "roles", "create")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(PrerequisitesController.prototype, "roles", "remove")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(PrerequisitesController.prototype, "roles", "list")).toBeUndefined();
  });

  test(":id se recibe correctamente en remove", () => {
    expect(__paramOf(PrerequisitesController.prototype, "remove", 0)).toEqual(
      expect.objectContaining({ property: "id" }),
    );
  });
});
