const { validate } = require("class-validator");
const {
  AttendanceRegistrationsController,
} = require("../../interfaces/http/registrations.controller");
const { RegisterDto } = require("../../interfaces/http/dto/session.dto");
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceInvalidReferenceError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");
const { __paramOf } = require("../../../auth/tests/nest-common.stub");
const { __readMetadata } = require("../../../auth/tests/nest-common.stub");

const estReq = () => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user: { id: "20", roles: ["ESTUDIANTE"] },
});

const DTO_OK = {
  code: "ASIS-ABCDEF",
  fullName: "Ana María Pérez Gómez",
  identificationNumber: "1234567",
  signatureType: "draw",
  signatureData: "data:image/png;base64,AAA",
  mimeType: "image/png",
};

async function errorsOf(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values));
}

async function errorsOfStrict(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe("attendance registrations controller", () => {
  test("register delega y mapea 404/409/403/400 con mensajes amigables", async () => {
    const controller = new AttendanceRegistrationsController({
      register: async (input) => {
        if (input.code === "SIN-NOMBRE") throw new AttendanceInvalidReferenceError("invalid-name");
        if (input.code === "SIN-CEDULA")
          throw new AttendanceInvalidReferenceError("invalid-identification");
        if (input.code === "SIN-FIRMA") throw new AttendanceInvalidReferenceError("invalid-signature");
        if (input.code === "OK-CODE") return { id: "5" };
        if (input.code === "DUP-CODE") throw new AttendanceConflictError("already-registered");
        if (input.code === "CLOSED-CODE") throw new AttendanceConflictError("session-closed");
        if (input.code === "DRAFT-CODE") throw new AttendanceConflictError("session-not-open");
        if (input.code === "AJENO") throw new AttendanceForbiddenError("not-member");
        if (input.code === "SIN-PERFIL") throw new AttendanceForbiddenError("no-student-profile");
        throw new AttendanceNotFoundError();
      },
    });
    await expect(controller.register({ ...DTO_OK, code: "OK-CODE" }, estReq())).resolves.toMatchObject({
      id: "5",
    });
    await expect(controller.register({ ...DTO_OK, code: "NOPE" }, estReq())).rejects.toMatchObject({
      status: 404,
      message: "El código de asistencia no es válido.",
    });
    await expect(controller.register({ ...DTO_OK, code: "DUP-CODE" }, estReq())).rejects.toMatchObject({
      status: 409,
      message: "Ya registraste tu asistencia en esta sesión.",
    });
    await expect(
      controller.register({ ...DTO_OK, code: "CLOSED-CODE" }, estReq()),
    ).rejects.toMatchObject({
      status: 409,
      message: "La asistencia ya fue cerrada y no admite nuevos registros.",
    });
    await expect(
      controller.register({ ...DTO_OK, code: "DRAFT-CODE" }, estReq()),
    ).rejects.toMatchObject({
      status: 409,
      message: "Esta asistencia no está disponible en este momento.",
    });
    await expect(controller.register({ ...DTO_OK, code: "AJENO" }, estReq())).rejects.toMatchObject({
      status: 403,
      message: "No perteneces al grupo de esta asistencia.",
    });
    await expect(
      controller.register({ ...DTO_OK, code: "SIN-PERFIL" }, estReq()),
    ).rejects.toMatchObject({
      status: 403,
      message: "No tienes un perfil de estudiante activo.",
    });
    await expect(
      controller.register({ ...DTO_OK, code: "SIN-NOMBRE" }, estReq()),
    ).rejects.toMatchObject({ status: 400, message: "Ingresa tu nombre completo." });
    await expect(
      controller.register({ ...DTO_OK, code: "SIN-CEDULA" }, estReq()),
    ).rejects.toMatchObject({ status: 400, message: "Ingresa una cédula válida." });
    await expect(
      controller.register({ ...DTO_OK, code: "SIN-FIRMA" }, estReq()),
    ).rejects.toMatchObject({ status: 400, message: "Debes registrar tu firma." });
    // Sin reason: mensajes genéricos sin tecnicismos.
    const generico = new AttendanceRegistrationsController({
      register: async () => {
        throw new AttendanceConflictError();
      },
    });
    await expect(generico.register(DTO_OK, estReq())).rejects.toMatchObject({
      status: 409,
      message: "Conflicto de asistencia",
    });
    // Error inesperado (p. ej. fallo de Prisma): 500 genérico amigable,
    // sin stack ni detalles internos para el cliente.
    const roto = new AttendanceRegistrationsController({
      register: async () => {
        throw new Error("Unknown argument `group_id_student_id`");
      },
    });
    await expect(roto.register(DTO_OK, estReq())).rejects.toMatchObject({
      status: 500,
      message: "No pudimos registrar tu asistencia. Inténtalo nuevamente.",
    });
  });

  test("DTO exige code y solo ESTUDIANTE puede registrar", () => {
    expect(__readMetadata(AttendanceRegistrationsController.prototype, "roles", "register")).toEqual([
      "ESTUDIANTE",
    ]);
  });

  test("DTO exige datos del acta y sigue sin admitir studentId", async () => {
    expect(await errorsOf(RegisterDto, DTO_OK)).toEqual([]);
    expect(await errorsOf(RegisterDto, {})).not.toEqual([]);
    expect(await errorsOf(RegisterDto, { code: "ASIS-ABC" })).not.toEqual([]);
    // La identidad sale del JWT + la cédula: el DTO no declara studentId y el
    // pipe whitelisted lo rechazaría (400) si el cliente lo enviara.
    expect("studentId" in new RegisterDto()).toBe(false);
    expect("personId" in new RegisterDto()).toBe(false);
    expect("groupId" in new RegisterDto()).toBe(false);
    expect("sessionId" in new RegisterDto()).toBe(false);
  });

  test("DTO con whitelist rechaza studentId/sessionId/grupo/estado/método", async () => {
    for (const extra of [
      { studentId: "50" },
      { personId: "100" },
      { userId: "20" },
      { groupId: "7" },
      { courseOfferingId: "1" },
      { sessionId: "1" },
      { status: "PRESENTE" },
      { registrationMethod: "CODIGO" },
      { registeredAt: new Date().toISOString() },
    ]) {
      expect(await errorsOfStrict(RegisterDto, { ...DTO_OK, ...extra })).not.toEqual([]);
    }
    expect(await errorsOfStrict(RegisterDto, DTO_OK)).toEqual([]);
  });
});
