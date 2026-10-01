const { validate } = require("class-validator");
const { ChangePasswordDto } = require("../../interfaces/http/dto/change-password.dto");
const { SetStatusDto } = require("../../interfaces/http/dto/set-status.dto");

async function errorsOf(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values));
}

describe("Users DTOs", () => {
  test("change-password válido y rechazos", async () => {
    expect(
      await errorsOf(ChangePasswordDto, {
        currentPassword: "Actual-123",
        newPassword: "Nueva-Clave-456",
      }),
    ).toEqual([]);
    expect(await errorsOf(ChangePasswordDto, {})).not.toEqual([]);
    expect(
      await errorsOf(ChangePasswordDto, { newPassword: "x".repeat(129) }),
    ).not.toEqual([]);
  });

  test("set-status solo admite estados del modelo", async () => {
    expect(await errorsOf(SetStatusDto, { status: "BLOCKED" })).toEqual([]);
    expect(await errorsOf(SetStatusDto, { status: "ELIMINADO" })).not.toEqual([]);
    expect(await errorsOf(SetStatusDto, {})).not.toEqual([]);
  });
});
