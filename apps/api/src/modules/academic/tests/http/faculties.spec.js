const { validate } = require("class-validator");
const { FacultiesController } = require("../../interfaces/http/faculties.controller");
const {
  CreateFacultyDto,
  UpdateFacultyDto,
} = require("../../interfaces/http/dto/faculty.dto");
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
    list: async ({ institutionId } = {}) => {
      if (institutionId === "99") return [];
      return [{ id: "1", name: "Ingeniería", institution_id: institutionId ?? "1" }];
    },
    get: async ({ id }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      return { id: "1", name: "Ingeniería" };
    },
    create: async (input) => {
      if (input.institutionId === "99") throw new AcademicNotFoundError();
      if (input.code === "DUPLICADA") throw new AcademicConflictError();
      return { id: "2", ...input };
    },
    update: async ({ id, institutionId }) => {
      if (String(id) !== "1") throw new AcademicNotFoundError();
      if (institutionId === "99") throw new AcademicNotFoundError();
      return { id: "1", name: "F-Ren" };
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

describe("faculties controller", () => {
  test("listado delega el filtro por institución", async () => {
    const controller = new FacultiesController(facadeMock());
    const rows = await controller.list({ institutionId: "1" }, req());
    expect(rows).toHaveLength(1);
    await expect(controller.list({ institutionId: "99" }, req())).resolves.toEqual(
      [],
    );
  });

  test("listado combina institutionId con q", async () => {
    const seen = [];
    const controller = new FacultiesController({
      ...facadeMock(),
      list: async (input) => {
        seen.push(input);
        const rows = [
          { id: "1", name: "Ingeniería", institution_id: "1" },
          { id: "2", name: "Ciencias", institution_id: "1" },
        ]
          .filter((r) =>
            input?.institutionId ? String(r.institution_id) === String(input.institutionId) : true,
          )
          .filter((r) =>
            input?.q ? r.name.toLowerCase().includes(String(input.q).toLowerCase()) : true,
          );
        return rows;
      },
    });
    expect(await controller.list({ institutionId: "1" }, req())).toHaveLength(2);
    expect(await controller.list({ institutionId: "1", q: "inge" }, req())).toHaveLength(1);
    expect(await controller.list({ institutionId: "1", q: "zzz" }, req())).toEqual([]);
    expect(await controller.list({ institutionId: "99", q: "inge" }, req())).toEqual([]);
    expect(seen[1]).toEqual({ institutionId: "1", q: "inge" });
  });

  test("get inexistente mapea 404", async () => {
    const controller = new FacultiesController(facadeMock());
    await expect(controller.getById("1", req())).resolves.toMatchObject({
      id: "1",
    });
    await expect(controller.getById("99", req())).rejects.toMatchObject({
      status: 404,
    });
  });

  test("create válido, duplicado 409 e institución inexistente 404", async () => {
    const controller = new FacultiesController(facadeMock());
    await expect(
      controller.create({ institutionId: "1", name: "F" }, req()),
    ).resolves.toMatchObject({ id: "2" });
    await expect(
      controller.create({ institutionId: "1", name: "F", code: "DUPLICADA" }, req()),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      controller.create({ institutionId: "99", name: "F" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("update válido, inexistente 404 e institución inexistente 404", async () => {
    const controller = new FacultiesController(facadeMock());
    await expect(
      controller.update("1", { name: "F-Ren" }, req()),
    ).resolves.toMatchObject({ id: "1" });
    await expect(
      controller.update("99", { name: "X" }, req()),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      controller.update("1", { institutionId: "99" }, req()),
    ).rejects.toMatchObject({ status: 404 });
  });

  test("setStatus válido 200, inválido 400, inexistente 404", async () => {
    const controller = new FacultiesController(facadeMock());
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
    const controller = new FacultiesController({
      ...facadeMock(),
      get: async () => {
        throw new AcademicInvalidReferenceError();
      },
    });
    await expect(controller.getById("1", req())).rejects.toMatchObject({
      status: 400,
    });
  });

  test("DTO: creación exige institución y nombre; update acepta institución opcional", async () => {
    expect(
      await errorsOf(CreateFacultyDto, { institutionId: "1", name: "F" }),
    ).toEqual([]);
    expect(await errorsOf(CreateFacultyDto, { name: "F" })).not.toEqual([]);
    expect(await errorsOf(CreateFacultyDto, {})).not.toEqual([]);
    expect(await errorsOf(UpdateFacultyDto, { institutionId: "1" })).toEqual([]);
    expect(await errorsOf(UpdateFacultyDto, { institutionId: 42 })).not.toEqual([]);
  });

  test("escritura exige ADMINISTRADOR y lectura es autenticada", () => {
    expect(__readMetadata(FacultiesController.prototype, "roles", "create")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(FacultiesController.prototype, "roles", "update")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(FacultiesController.prototype, "roles", "setStatus")).toEqual([
      "ADMINISTRADOR",
    ]);
    expect(__readMetadata(FacultiesController.prototype, "roles", "list")).toBeUndefined();
    expect(__readMetadata(FacultiesController.prototype, "roles", "getById")).toBeUndefined();
  });

  test(":id se recibe correctamente en get, update y setStatus", () => {
    for (const method of ["getById", "update", "setStatus"]) {
      expect(__paramOf(FacultiesController.prototype, method, 0)).toEqual(
        expect.objectContaining({ property: "id" }),
      );
    }
  });
});
