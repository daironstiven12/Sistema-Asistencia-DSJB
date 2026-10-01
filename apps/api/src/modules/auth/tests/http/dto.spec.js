const { validate } = require("class-validator");
const { LoginDto } = require("../../interfaces/http/dto/login.dto");

async function errorsOf(DtoClass, values) {
  const dto = Object.assign(new DtoClass(), values);
  return validate(dto);
}

describe("LoginDto", () => {
  test("válido", async () => {
    expect(
      await errorsOf(LoginDto, { username: "jp Delegate", password: "Clave-123" }),
    ).toEqual([]);
  });

  test("rechaza vacío, tipos y exceso", async () => {
    expect(await errorsOf(LoginDto, {})).not.toEqual([]);
    expect(
      await errorsOf(LoginDto, { username: 7, password: [] }),
    ).not.toEqual([]);
    expect(
      await errorsOf(LoginDto, { username: "u", password: "x".repeat(129) }),
    ).not.toEqual([]);
  });
});
