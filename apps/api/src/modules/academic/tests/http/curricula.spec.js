const { validate } = require("class-validator");
const { CurriculaController } = require("../../interfaces/http/curricula.controller");
const {
  CreateCurriculumDto,
  UpdateCurriculumDto,
} = require("../../interfaces/http/dto/curriculum.dto");
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
    list: async ({ programId, q } = {}) => {
      const rows = [
        { id: "1", name: "Plan 2020", code: "P-2020", program_id: "1" },
        { id: "2", name: "Plan 2024", code: "P-2024", program_id: "1" },
      ]
        .filter((r) => (programId ? String(r.program_id) === String(programId) : true))
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
      return { id: "1", name: "Plan 2020" };
    },
    create: async (input) => {
      if (input.programId === "99") throw new AcademicNotFoundError();
      if (input.code === "DUPLICADO") throw new AcademicConflictError();
      return { id: "3", ...input };
    },
    update: async ({ id, programId }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      if (programId === "99") throw new AcademicNotFoundError();
      return { id: "1", name: "Plan-Ren" };
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

describe("curricula controller", () => {
  test("listado delega filtros programId y q", async () => {
    const controller = new CurriculaController(facadeMock());
    expect(await controller.list({ programId: "1" }, req())).toHaveLength(2);
    expect(await controller.list({ programId: "1", q: "2024" }, req())).toHaveLength(1);
    expect(await controller.list({ programId: "1", q: "zzz" }, req())).toEqual([]);
    expect(await controller.list({ programId: "99" }, req())).toEqual([]);
  });

  test("get inexistente mapea 404", async () => {
    const controller = new CurriculaController(facadeMock());
    await expect(controller.getById("1", req())).resolves.toMatchObject({ id: "1" });
    await expect(controller.getById("99", req())).rejects.toMatchObject({ status: 404 });
  });

  test("create válido, duplicado 409 y programa inexistente 404", async () => {
    const controller = new CurriculaController(facadeMock());
    await expect(
      controller.create({ programId: "1", name: "Plan" }, req()),
    ).resolves.toMatchObject({ id: "3" });
    await expect(
      controller.create({ programId: "1", name: "X", code: "DUPLICADO" }, req()),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      controller.create({ programId: "99", name: "X" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("update válido, inexistente 404 y programa inexistente 404", async () => {
    const controller = new CurriculaController(facadeMock());
    await expect(
      controller.update("1", { name: "Plan-Ren" }, req()),
    ).resolves.toMatchObject({ id: "1" });
    await expect(controller.update("99", { name: "X" }, req())).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      controller.update("1", { programId: "99" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("setStatus válido 200, inválido 400, inexistente 404", async () => {
    const controller = new CurriculaController(facadeMock());
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
    const controller = new CurriculaController({
      ...facadeMock(),
      get: async () => {
        throw new AcademicInvalidReferenceError();
      },
    });
    await expect(controller.getById("1", req())).rejects.toMatchObject({ status: 400 });
  });

  test("DTO: respeta tipos reales del schema (version string, fechas ISO)", async () => {
    expect(
      await errorsOf(CreateCurriculumDto, {
        programId: "1",
        name: "Plan",
        version: "2026",
        effectiveFrom: "2026-01-01",
        effectiveUntil: "2027-12-31",
      }),
    ).toEqual([]);
    expect(await errorsOf(CreateCurriculumDto, { name: "Plan" })).not.toEqual([]);
    expect(await errorsOf(CreateCurriculumDto, {})).not.toEqual([]);
    expect(
      await errorsOf(CreateCurriculumDto, { programId: "1", name: "Plan", version: 2026 }),
    ).not.toEqual([]);
    expect(
      await errorsOf(CreateCurriculumDto, {
        programId: "1",
        name: "Plan",
        effectiveFrom: "no-fecha",
      }),
    ).not.toEqual([]);
    expect(await errorsOf(UpdateCurriculumDto, { programId: "1" })).toEqual([]);
    expect(await errorsOf(UpdateCurriculumDto, { programId: 42 })).not.toEqual([]);
  });

  test("escritura exige ADMINISTRADOR y lectura es autenticada", () => {
    expect(__readMetadata(CurriculaController.prototype, "roles", "create")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(CurriculaController.prototype, "roles", "update")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(CurriculaController.prototype, "roles", "setStatus")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(CurriculaController.prototype, "roles", "list")).toBeUndefined();
    expect(__readMetadata(CurriculaController.prototype, "roles", "getById")).toBeUndefined();
  });

  test(":id se recibe correctamente en get, update y setStatus", () => {
    for (const method of ["getById", "update", "setStatus"]) {
      expect(__paramOf(CurriculaController.prototype, method, 0)).toEqual(
        expect.objectContaining({ property: "id" }),
      );
    }
  });
});
