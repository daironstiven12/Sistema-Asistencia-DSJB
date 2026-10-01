const { IsNotEmpty, IsOptional, IsString, MaxLength } = require("class-validator");

class CreateFacultyDto {}

IsString()(CreateFacultyDto.prototype, "institutionId");
IsNotEmpty()(CreateFacultyDto.prototype, "institutionId");
IsString()(CreateFacultyDto.prototype, "name");
IsNotEmpty()(CreateFacultyDto.prototype, "name");
MaxLength(200)(CreateFacultyDto.prototype, "name");
IsString()(CreateFacultyDto.prototype, "code");
IsOptional()(CreateFacultyDto.prototype, "code");
MaxLength(30)(CreateFacultyDto.prototype, "code");

class UpdateFacultyDto {}

IsString()(UpdateFacultyDto.prototype, "name");
IsOptional()(UpdateFacultyDto.prototype, "name");
MaxLength(200)(UpdateFacultyDto.prototype, "name");
IsString()(UpdateFacultyDto.prototype, "code");
IsOptional()(UpdateFacultyDto.prototype, "code");
MaxLength(30)(UpdateFacultyDto.prototype, "code");

module.exports = { CreateFacultyDto, UpdateFacultyDto };
