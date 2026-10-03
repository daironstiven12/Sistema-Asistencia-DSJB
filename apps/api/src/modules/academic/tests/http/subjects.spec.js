const { validate } = require("class-validator");
const { SubjectsController } = require("../../interfaces/http/subjects.controller");
const {
  CreateSubjectDto,
  UpdateSubjectDto,
} = require("../../interfaces/http/dto/subject.dto");
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
  return {
    list: async ({ query } = {}) => {
      const rows = [
        { id: "1", name: "Matemáticas I", code: "MAT-101" },
        { id: "2", name: "Programación I", code: "PRO-101" },
      ].filter((r) =>
        query
          ? r.name.toLowerCase().includes(String(query).toLowerCase()) ||
            r.code.toLowerCase().includes(String(query).toLowerCase())
          : true,
      );
      return rows;
    },
    get: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1", name: "Matemáticas I" };
    },
    create: async (input) => {
      if (input.code === "DUPLICADO") throw new AcademicConflictError();
      return { id: "3", ...input };
    },
    update: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1", name: "M-Ren" };
    },
    setStatus: async ({ id, status }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      if (status !== "ACTIVE" && status !== "INACTIVE") {
        const error = new Error("valor_invalido");
        error.code = "INVALID_STATUS";
        throw error;
      }
      return { id: "1", status };
    },
  };
}

describe("subjects controller", () => {
  test("listado delega la búsqueda q", async () => {
    const controller = new SubjectsController(facadeMock());
    expect(await controller.list({}, req())).toHaveLength(2);
    expect(await controller.list({ q: "mat" }, req())).toHaveLength(1);
    expect(await controller.list({ q: "zzz" }, req())).toEqual([]);
  });

  test("get inexistente mapea 404", async () => {
    const controller = new SubjectsController(facadeMock());
    await expect(controller.getById("1", req())).resolves.toMatchObject({ id: "1" });
    await expect(controller.getById("99", req())).rejects.toMatchObject({ status: 404 });
  });

  test("create válido y duplicado 409", async () => {
    const controller = new SubjectsController(facadeMock());
    await expect(
      controller.create({ code: "N-1", name: "Nueva" }, req()),
    ).resolves.toMatchObject({ id: "3" });
    await expect(
      controller.create({ code: "DUPLICADO", name: "X" }, req()),
    ).rejects.toMatchObject({ status: 409 });
  });

  test("update válido e inexistente 404", async () => {
    const controller = new SubjectsController(facadeMock());
    await expect(
      controller.update("1", { name: "M-Ren" }, req()),
    ).resolves.toMatchObject({ id: "1" });
    await expect(controller.update("99", { name: "X" }, req())).rejects.toMatchObject({
      status: 404,
    });
  });

  test("setStatus válido 200, inválido 400, inexistente 404", async () => {
    const controller = new SubjectsController(facadeMock());
    await expect(
      controller.setStatus("1", { status: "INACTIVE" }, req()),
    ).resolves.toMatchObject({ status: "INACTIVE" });
    await expect(
      controller.setStatus("1", { status: "ELIMINADO" }, req()),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      controller.setStatus("99", { status: "INACTIVE" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("referencia inválida residual mapea 400", async () => {
    const controller = new SubjectsController({
      ...facadeMock(),
      get: async () => {
        throw new AcademicInvalidReferenceError();
      },
    });
    await expect(controller.getById("1", req())).rejects.toMatchObject({ status: 400 });
  });

  test("DTO: exige código y nombre; update acepta código opcional; sin tipo", async () => {
    expect(await errorsOf(CreateSubjectDto, { code: "MAT-101", name: "M" })).toEqual([]);
    expect(await errorsOf(CreateSubjectDto, { name: "M" })).not.toEqual([]);
    expect(await errorsOf(CreateSubjectDto, {})).not.toEqual([]);
    expect(await errorsOf(UpdateSubjectDto, { code: "MAT-102" })).toEqual([]);
    expect(await errorsOf(UpdateSubjectDto, { code: 42 })).not.toEqual([]);
    const tipo = new CreateSubjectDto();
    expect("tipo" in tipo).toBe(false);
  });

  test("escritura exige ADMINISTRADOR y lectura es autenticada", () => {
    expect(__readMetadata(SubjectsController.prototype, "roles", "create")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(SubjectsController.prototype, "roles", "update")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(SubjectsController.prototype, "roles", "setStatus")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(SubjectsController.prototype, "roles", "list")).toBeUndefined();
    expect(__readMetadata(SubjectsController.prototype, "roles", "getById")).toBeUndefined();
  });

  test(":id se recibe correctamente en get, update y setStatus", () => {
    for (const method of ["getById", "update", "setStatus"]) {
      expect(__paramOf(SubjectsController.prototype, method, 0)).toEqual(
        expect.objectContaining({ property: "id" }),
      );
    }
  });
});
