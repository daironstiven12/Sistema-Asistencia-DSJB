const { InstitutionsController } = require("../../interfaces/http/institutions.controller");
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

function facadeMock() {
  return {
    list: async () => [{ id: "1", name: "UTCH", code: "UTCH", status: "ACTIVE" }],
    get: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1", name: "UTCH" };
    },
    create: async (input) => {
      if (input.code === "DUPLICADA") throw new AcademicConflictError();
      return { id: "2", ...input };
    },
    update: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1", name: "UTCH-DC" };
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

describe("institutions controller", () => {
  test("listado delega al caso de uso y soporta q", async () => {
    const seen = [];
    const controller = new InstitutionsController({
      list: async (input) => {
        seen.push(input);
        const rows = [{ id: "1", name: "UTCH", code: "UTCH" }];
        if (input?.q) return rows.filter((r) => r.name.toLowerCase().includes(String(input.q).toLowerCase()));
        return rows;
      },
      get: async () => ({ id: "1" }),
      create: async () => ({ id: "1" }),
      update: async () => ({ id: "1" }),
      setStatus: async () => ({ id: "1", status: "ACTIVE" }),
    });
    expect(await controller.list({}, req())).toHaveLength(1);
    expect(await controller.list({ q: "ut" }, req())).toHaveLength(1);
    expect(await controller.list({ q: "zzz" }, req())).toHaveLength(0);
    expect(seen[1]).toEqual({ q: "ut" });
  });

  test("get inexistente mapea 404", async () => {
    const controller = new InstitutionsController(facadeMock());
    await expect(controller.getById("99", req())).rejects.toMatchObject({
      status: 404,
    });
    await expect(controller.getById("1", req())).resolves.toMatchObject({
      id: "1",
    });
  });

  test("create duplicado mapea 409", async () => {
    const controller = new InstitutionsController(facadeMock());
    await expect(
      controller.create({ name: "X", code: "DUPLICADA" }, req()),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      controller.create({ name: "Nueva", code: "N" }, req()),
    ).resolves.toMatchObject({ id: "2" });
  });

  test("update inexistente mapea 404", async () => {
    const controller = new InstitutionsController(facadeMock());
    await expect(
      controller.update("99", { name: "X" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("setStatus inválido mapea 400 e inexistente 404", async () => {
    const controller = new InstitutionsController(facadeMock());
    await expect(
      controller.setStatus("1", { status: "ELIMINADO" }, req()),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      controller.setStatus("99", { status: "INACTIVE" }, req()),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      controller.setStatus("1", { status: "INACTIVE" }, req()),
    ).resolves.toMatchObject({ status: "INACTIVE" });
  });

  test("escritura exige ADMINISTRADOR y lectura es autenticada", () => {
    expect(__readMetadata(InstitutionsController.prototype, "roles", "create")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(InstitutionsController.prototype, "roles", "update")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(InstitutionsController.prototype, "roles", "setStatus")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(InstitutionsController.prototype, "roles", "list")).toBeUndefined();
    expect(__readMetadata(InstitutionsController.prototype, "roles", "getById")).toBeUndefined();
  });

  test("parámetros :id correctamente declarados", () => {
    expect(__paramOf(InstitutionsController.prototype, "getById", 0)).toEqual(
      expect.objectContaining({ property: "id" }),
    );
    expect(__paramOf(InstitutionsController.prototype, "update", 0)).toEqual(
      expect.objectContaining({ property: "id" }),
    );
    expect(__paramOf(InstitutionsController.prototype, "setStatus", 0)).toEqual(
      expect.objectContaining({ property: "id" }),
    );
  });

  test("sinExports de errores no usados no rompen el mapeo", async () => {
    const controller = new InstitutionsController({
      ...facadeMock(),
      get: async () => {
        throw new AcademicInvalidReferenceError();
      },
    });
    await expect(controller.getById("1", req())).rejects.toMatchObject({
      status: 400,
    });
  });
});
