const { IsNotEmpty, IsString, MaxLength } = require("class-validator");

class LoginDto {}

/* Identificador principal: correo institucional. Por compatibilidad con
   usuarios históricos sin correo se acepta también el username (sin "@").
   El frontend valida el formato email antes de enviar. */
IsString()(LoginDto.prototype, "email");
IsNotEmpty()(LoginDto.prototype, "email");
MaxLength(200)(LoginDto.prototype, "email");
IsString()(LoginDto.prototype, "password");
IsNotEmpty()(LoginDto.prototype, "password");
MaxLength(128)(LoginDto.prototype, "password");

module.exports = { LoginDto };
