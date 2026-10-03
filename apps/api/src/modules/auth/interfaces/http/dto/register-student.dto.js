const { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } = require("class-validator");

class RegisterStudentDto {}

/* Cuenta de estudiante: el correo institucional es el identificador de
   acceso. El rol ESTUDIANTE lo fija el backend; cualquier campo de rol
   enviado por el cliente lo rechaza el ValidationPipe (whitelist). */
IsEmail()(RegisterStudentDto.prototype, "email");
IsNotEmpty()(RegisterStudentDto.prototype, "email");
MaxLength(200)(RegisterStudentDto.prototype, "email");
IsString()(RegisterStudentDto.prototype, "password");
IsNotEmpty()(RegisterStudentDto.prototype, "password");
MaxLength(128)(RegisterStudentDto.prototype, "password");
IsString()(RegisterStudentDto.prototype, "firstName");
IsNotEmpty()(RegisterStudentDto.prototype, "firstName");
MaxLength(100)(RegisterStudentDto.prototype, "firstName");
IsString()(RegisterStudentDto.prototype, "lastName");
IsNotEmpty()(RegisterStudentDto.prototype, "lastName");
MaxLength(100)(RegisterStudentDto.prototype, "lastName");
IsString()(RegisterStudentDto.prototype, "identificationTypeId");
IsOptional()(RegisterStudentDto.prototype, "identificationTypeId");
MaxLength(30)(RegisterStudentDto.prototype, "identificationTypeId");
IsString()(RegisterStudentDto.prototype, "identificationNumber");
IsOptional()(RegisterStudentDto.prototype, "identificationNumber");
MaxLength(50)(RegisterStudentDto.prototype, "identificationNumber");

module.exports = { RegisterStudentDto };
