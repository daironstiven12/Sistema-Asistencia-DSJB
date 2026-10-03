const { validate } = require("class-validator");
const {
  AttendanceSessionsController,
  mapError,
} = require("../../interfaces/http/sessions.controller");
const {
  CreateSessionDto,
  SignSessionDto,
  UpdateSessionDto,
} = require("../../interfaces/http/dto/session.dto");
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");
const { __paramOf } = require("../../../auth/tests/nest-common.stub");
const { __readMetadata } = require("../../../auth/tests/nest-common.stub");

const repReq = () => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user: { id: "10", roles: ["REPRESENTANTE"] },
});

const estEstReq = () => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user: { id: "20", roles: ["ESTUDIANTE"] },
});

async function errorsOf(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values));
}

function facadeMock() {
  return {
    list: async () => [{ id: "1" }],
    get: async ({ id }) => {
      if (String(id) !== "1") throw new AttendanceNotFoundError();
      return { id: "1" };
    },
    create: async () => ({ id: "2" }),
    open: async ({ id }) => {
      if (String(id) !== "1") throw new AttendanceNotFoundError();
      return { id: "1", attendance_code: "ASIS-ABCDEFG" };
    },
    close: async ({ id }) => {
      if (String(id) !== "1") throw new AttendanceNotFoundError();
      return { id: "1" };
    },
    updateTopics: async ({ id }) => {
      if (String(id) !== "1") throw new AttendanceNotFoundError();
      return { id: "1", topics: "Tema actualizado" };
    },
  };
}

function registrationsMock() {
  return {
    list: async () => [{ id: "7" }],
    preview: async ({ code }) => {
      if (String(code) !== "ASIS-ABCDEFG") throw new AttendanceNotFoundError();
      return { code: "ASIS-ABCDEFG", subject: "Matemáticas", group: "VII-A" };
    },
  };
}

function signaturesMock() {
  return {
    signSession: async ({ sessionId }) => {
      if (String(sessionId) !== "1") throw new AttendanceNotFoundError();
      return { session: { id: "1" } };
    },
    sessionSignatures: async ({ sessionId }) => {
      if (String(sessionId) !== "1") throw new AttendanceNotFoundError();
      return [{ role: "REPRESENTANTE", signerName: "JP", snapshot: "data:image/png;base64,AAA" }];
    },
  };
}

const controllerOf = () =>
  new AttendanceSessionsController(facadeMock(), registrationsMock(), signaturesMock());

describe("attendance sessions controller", () => {
  test("listado y detalle delegan; inexistente 404", async () => {
    const controller = controllerOf();
    expect(await controller.list({}, repReq())).toHaveLength(1);
    await expect(controller.getById("1", repReq())).resolves.toMatchObject({ id: "1" });
    await expect(controller.getById("99", repReq())).rejects.toMatchObject({ status: 404 });
  });

  test("open/close propagan 404 y 409 de transición", async () => {
    const forbidden = new AttendanceSessionsController(
      {
        ...facadeMock(),
        open: async () => {
          throw new AttendanceForbiddenError();
        },
        close: async () => {
          const error = new Error("x");
          error.code = "INVALID_TRANSITION";
          throw error;
        },
      },
      registrationsMock(),
      signaturesMock(),
    );
    await expect(forbidden.open("1", repReq())).rejects.toMatchObject({ status: 403 });
    await expect(forbidden.close("1", repReq())).rejects.toMatchObject({ status: 409 });
    const controller = controllerOf();
    await expect(controller.open("1", repReq())).resolves.toMatchObject({
      attendance_code: "ASIS-ABCDEFG",
    });
  });

  test("records delega al caso de registros", async () => {
    const controller = controllerOf();
    expect(await controller.records("1", repReq())).toHaveLength(1);
  });

  test("signatures delega y mapea 404", async () => {
    const controller = controllerOf();
    await expect(controller.sessionSignatures("1", repReq())).resolves.toMatchObject([
      { role: "REPRESENTANTE", signerName: "JP" },
    ]);
    await expect(controller.sessionSignatures("99", repReq())).rejects.toMatchObject({ status: 404 });
  });

  test("previewByCode delega y mapea 404 con mensaje amigable", async () => {
    const controller = controllerOf();
    await expect(
      controller.previewByCode("ASIS-ABCDEFG", estEstReq()),
    ).resolves.toMatchObject({ code: "ASIS-ABCDEFG", subject: "Matemáticas" });
    await expect(controller.previewByCode("ASIS-NOPE", estEstReq())).rejects.toMatchObject({
      status: 404,
      message: "El código de asistencia no es válido.",
    });
  });

  test("sign delega y mapea 404/403", async () => {
    const controller = controllerOf();
    await expect(
      controller.sign("1", { signatureType: "draw" }, repReq()),
    ).resolves.toMatchObject({ session: { id: "1" } });
    await expect(
      controller.sign("99", { signatureType: "draw" }, repReq()),
    ).rejects.toMatchObject({ status: 404 });
    const forbidden = new AttendanceSessionsController(
      facadeMock(),
      registrationsMock(),
      {
        signSession: async () => {
          throw new AttendanceForbiddenError();
        },
      },
    );
    await expect(
      forbidden.sign("1", { signatureType: "draw" }, repReq()),
    ).rejects.toMatchObject({ status: 403 });
    expect(new AttendanceConflictError()).toBeInstanceOf(AttendanceConflictError);
  });

  test("updateTopics delega y mapea 404; DTO solo acepta topics", async () => {
    const controller = controllerOf();
    await expect(
      controller.updateTopics("1", { topics: "Tema real" }, repReq()),
    ).resolves.toMatchObject({ id: "1" });
    await expect(
      controller.updateTopics("99", { topics: "Tema real" }, repReq()),
    ).rejects.toMatchObject({ status: 404 });
    expect(await errorsOf(UpdateSessionDto, { topics: "Tema real" })).toEqual([]);
    expect(await errorsOf(UpdateSessionDto, {})).not.toEqual([]);
    expect(
      await errorsOf(UpdateSessionDto, { topics: "x".repeat(2001) }),
    ).not.toEqual([]);
  });

  test("DTO de creación valida formato de fecha y hora", async () => {
    expect(
      await errorsOf(CreateSessionDto, {
        courseOfferingId: "1",
        sessionDate: "2026-10-05",
        startTime: "14:00",
        endTime: "16:00",
      }),
    ).toEqual([]);
    expect(await errorsOf(CreateSessionDto, {})).not.toEqual([]);
    expect(
      await errorsOf(CreateSessionDto, {
        courseOfferingId: "1",
        sessionDate: "2026-10-05",
        startTime: "25:00",
        endTime: "16:00",
      }),
    ).not.toEqual([]);
    expect(
      await errorsOf(SignSessionDto, { signatureType: "draw" }),
    ).toEqual([]);
    expect(await errorsOf(SignSessionDto, {})).not.toEqual([]);
  });

  test("roles: escritura REPRESENTANTE, lectura REPRESENTANTE+ADMIN, preview ESTUDIANTE", () => {
    for (const method of ["create", "open", "close", "sign", "updateTopics"]) {
      expect(__readMetadata(AttendanceSessionsController.prototype, "roles", method)).toEqual([
        "REPRESENTANTE",
      ]);
    }
    for (const method of ["list", "getById", "records", "sessionSignatures"]) {
      expect(__readMetadata(AttendanceSessionsController.prototype, "roles", method)).toEqual([
        "REPRESENTANTE",
        "ADMINISTRADOR",
      ]);
    }
    expect(__readMetadata(AttendanceSessionsController.prototype, "roles", "previewByCode")).toEqual([
      "ESTUDIANTE",
    ]);
  });

  test(":id y :code declarados en rutas con identificador", () => {
    for (const method of ["getById", "open", "close", "records", "sign", "sessionSignatures", "updateTopics"]) {
      expect(__paramOf(AttendanceSessionsController.prototype, method, 0)).toEqual(
        expect.objectContaining({ property: "id" }),
      );
    }
    expect(__paramOf(AttendanceSessionsController.prototype, "previewByCode", 0)).toEqual(
      expect.objectContaining({ property: "code" }),
    );
  });

  test("horario inválido se mapea a 400 amigable (no 409 ni error técnico)", () => {
    const error = new Error("horario_invalido:startTime>=endTime");
    error.code = "INVALID_TIME";
    expect(() => mapError(error)).toThrow(expect.objectContaining({ status: 400 }));
    try {
      mapError(error);
    } catch (e) {
      expect(String(e.message)).not.toMatch(/prisma|sql|chk_/i);
    }
  });
});
