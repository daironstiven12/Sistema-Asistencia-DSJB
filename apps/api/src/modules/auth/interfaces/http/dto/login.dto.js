const { IsNotEmpty, IsString, MaxLength } = require("class-validator");

class LoginDto {}

IsString()(LoginDto.prototype, "username");
IsNotEmpty()(LoginDto.prototype, "username");
MaxLength(100)(LoginDto.prototype, "username");
IsString()(LoginDto.prototype, "password");
IsNotEmpty()(LoginDto.prototype, "password");
MaxLength(128)(LoginDto.prototype, "password");

module.exports = { LoginDto };
