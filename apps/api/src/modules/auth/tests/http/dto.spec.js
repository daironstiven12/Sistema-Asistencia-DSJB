const { validate } = require("class-validator");
const { LoginDto } = require("../../interfaces/http/dto/login.dto");
const { RegisterStudentDto } = require("../../interfaces/http/dto/register-student.dto");

async function errorsOf(DtoClass, values) {
  const dto = Object.assign(new DtoClass(), values);
  return validate(dto);
}

async function errorsOfStrict(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe("LoginDto", () => {
  test("válido", async () => {
    expect(
      await errorsOf(LoginDto, { email: "estudiante@utch.edu.co", password: "Clave-123" }),
    ).toEqual([]);
  });

  test("rechaza vacío, tipos y exceso", async () => {
    expect(await errorsOf(LoginDto, {})).not.toEqual([]);
    expect(
      await errorsOf(LoginDto, { email: 7, password: [] }),
    ).not.toEqual([]);
    expect(
      await errorsOf(LoginDto, { email: "u", password: "x".repeat(129) }),
    ).not.toEqual([]);
  });
});

describe("RegisterStudentDto", () => {
  const valido = {
    email: "nueva@utch.edu.co",
    password: "Clave-Segura-123",
    firstName: "Nueva",
    lastName: "Estudiante",
    identificationTypeId: "1",
    identificationNumber: "123456",
  };

  test("válido", async () => {
    expect(await errorsOfStrict(RegisterStudentDto, valido)).toEqual([]);
  });

  test("válido sin identificación (registro básico)", async () => {
    const { identificationTypeId, identificationNumber, ...basico } = valido;
    expect(await errorsOfStrict(RegisterStudentDto, basico)).toEqual([]);
  });

  test("rechaza email inválido y campos faltantes", async () => {
    expect(await errorsOfStrict(RegisterStudentDto, { ...valido, email: "no-es-email" })).not.toEqual([]);
    expect(await errorsOfStrict(RegisterStudentDto, {})).not.toEqual([]);
  });

  test("rechaza rol o permisos enviados por el cliente", async () => {
    for (const extra of [
      { role: "ADMIN" },
      { roles: ["ADMINISTRADOR"] },
      { userRole: "ADMINISTRADOR" },
      { isAdmin: true },
      { permissions: ["todo"] },
    ]) {
      expect(await errorsOfStrict(RegisterStudentDto, { ...valido, ...extra })).not.toEqual([]);
    }
  });
});
