const { IsIn, IsOptional, IsString, MaxLength } = require("class-validator");

class ChangePasswordDto {}

IsString()(ChangePasswordDto.prototype, "newPassword");
MaxLength(128)(ChangePasswordDto.prototype, "newPassword");
IsString()(ChangePasswordDto.prototype, "currentPassword");
IsOptional()(ChangePasswordDto.prototype, "currentPassword");
MaxLength(128)(ChangePasswordDto.prototype, "currentPassword");

module.exports = { ChangePasswordDto };
