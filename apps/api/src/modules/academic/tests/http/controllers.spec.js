const { FacultiesController } = require("../../interfaces/http/faculties.controller");
const { SubjectsController } = require("../../interfaces/http/subjects.controller");
const { PrerequisitesController } = require("../../interfaces/http/prerequisites.controller");
const {
  AcademicConflictError,
  AcademicNotFoundError,
} = require("../../application/academic-errors");
const { __paramOf } = require("../../../auth/tests/nest-common.stub");
const { __readMetadata } = require("../../../auth/tests/nest-common.stub");

const req = (user) => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user: user ?? { id: "1", roles: ["ADMINISTRADOR"] },
});

describe("academic controllers", () => {
  test("delegan y mapean 404/409", async () => {
    const faculties = new FacultiesController({
      list: async (input) => ({ filter: input }),
      get: async ({ id }) => {
        if (String(id) !== "1") throw new AcademicNotFoundError();
        return { id: "1" };
      },
      create: async () => {
        throw new AcademicConflictError();
      },
    });
    expect(await faculties.list({ institutionId: "1" }, req())).toEqual({
      filter: { institutionId: "1" },
    });
    await expect(faculties.getById("9", req())).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      faculties.create({ name: "F" }, req()),
    ).rejects.toMatchObject({ status: 409 });
  });

  test("parámetros :id y roles admin en escritura", () => {
    expect(__paramOf(FacultiesController.prototype, "getById", 0)).toEqual(
      expect.objectContaining({ property: "id" }),
    );
    expect(
      __readMetadata(SubjectsController.prototype, "roles", "create"),
    ).toEqual(["ADMINISTRADOR"]);
    expect(
      __readMetadata(PrerequisitesController.prototype, "roles", "list"),
    ).toBeUndefined();
  });
});
