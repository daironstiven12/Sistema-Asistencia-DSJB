const { validate } = require("class-validator");
const { ProgramsController } = require("../../interfaces/http/programs.controller");
const {
  CreateProgramDto,
  UpdateProgramDto,
} = require("../../interfaces/http/dto/program.dto");
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
    list: async ({ facultyId, q } = {}) => {
      const rows = [
        { id: "1", name: "Telecomunicaciones", code: "TEL", faculty_id: "1" },
        { id: "2", name: "Sistemas", code: "IS", faculty_id: "1" },
      ].filter((r) => (facultyId ? String(r.faculty_id) === String(facultyId) : true))
        .filter((r) =>
          q
            ? r.name.toLowerCase().includes(String(q).toLowerCase()) ||
              r.code.toLowerCase().includes(String(q).toLowerCase())
            : true,
        );
      return rows;
    },
    get: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1", name: "Telecomunicaciones" };
    },
    create: async (input) => {
      if (input.facultyId === "99") throw new AcademicNotFoundError();
      if (input.code === "DUPLICADO") throw new AcademicConflictError();
      return { id: "3", ...input };
    },
    update: async ({ id, facultyId }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      if (facultyId === "99") throw new AcademicNotFoundError();
      return { id: "1", name: "P-Ren" };
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

describe("programs controller", () => {
  test("listado delega filtros facultyId y q", async () => {
    const controller = new ProgramsController(facadeMock());
    expect(await controller.list({ facultyId: "1" }, req())).toHaveLength(2);
    expect(await controller.list({ facultyId: "1", q: "telecom" }, req())).toHaveLength(1);
    expect(await controller.list({ facultyId: "1", q: "zzz" }, req())).toEqual([]);
    expect(await controller.list({ facultyId: "99" }, req())).toEqual([]);
  });

  test("get inexistente mapea 404", async () => {
    const controller = new ProgramsController(facadeMock());
    await expect(controller.getById("1", req())).resolves.toMatchObject({ id: "1" });
    await expect(controller.getById("99", req())).rejects.toMatchObject({ status: 404 });
  });

  test("create válido, duplicado 409 y facultad inexistente 404", async () => {
    const controller = new ProgramsController(facadeMock());
    await expect(
      controller.create({ facultyId: "1", name: "Nuevo" }, req()),
    ).resolves.toMatchObject({ id: "3" });
    await expect(
      controller.create({ facultyId: "1", name: "X", code: "DUPLICADO" }, req()),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      controller.create({ facultyId: "99", name: "X" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("update válido, inexistente 404 y facultad inexistente 404", async () => {
    const controller = new ProgramsController(facadeMock());
    await expect(
      controller.update("1", { name: "P-Ren" }, req()),
    ).resolves.toMatchObject({ id: "1" });
    await expect(controller.update("99", { name: "X" }, req())).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      controller.update("1", { facultyId: "99" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("setStatus válido 200, inválido 400, inexistente 404", async () => {
    const controller = new ProgramsController(facadeMock());
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
    const controller = new ProgramsController({
      ...facadeMock(),
      get: async () => {
        throw new AcademicInvalidReferenceError();
      },
    });
    await expect(controller.getById("1", req())).rejects.toMatchObject({ status: 400 });
  });

  test("DTO: creación exige facultad y nombre; valida tipos y rangos", async () => {
    expect(
      await errorsOf(CreateProgramDto, { facultyId: "1", name: "P" }),
    ).toEqual([]);
    expect(await errorsOf(CreateProgramDto, { name: "P" })).not.toEqual([]);
    expect(await errorsOf(CreateProgramDto, {})).not.toEqual([]);
    expect(
      await errorsOf(CreateProgramDto, { facultyId: "1", name: "P", durationSemesters: 0 }),
    ).not.toEqual([]);
    expect(
      await errorsOf(CreateProgramDto, { facultyId: "1", name: "P", durationSemesters: "x" }),
    ).not.toEqual([]);
    expect(await errorsOf(UpdateProgramDto, { facultyId: "1" })).toEqual([]);
    expect(await errorsOf(UpdateProgramDto, { facultyId: 42 })).not.toEqual([]);
  });

  test("escritura exige ADMINISTRADOR y lectura es autenticada", () => {
    expect(__readMetadata(ProgramsController.prototype, "roles", "create")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(ProgramsController.prototype, "roles", "update")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(ProgramsController.prototype, "roles", "setStatus")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(ProgramsController.prototype, "roles", "list")).toBeUndefined();
    expect(__readMetadata(ProgramsController.prototype, "roles", "getById")).toBeUndefined();
  });

  test(":id se recibe correctamente en get, update y setStatus", () => {
    for (const method of ["getById", "update", "setStatus"]) {
      expect(__paramOf(ProgramsController.prototype, method, 0)).toEqual(
        expect.objectContaining({ property: "id" }),
      );
    }
  });
});
