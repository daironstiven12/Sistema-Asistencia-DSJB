const { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } = require("class-validator");

class CreateProgramDto {}

IsString()(CreateProgramDto.prototype, "facultyId");
IsNotEmpty()(CreateProgramDto.prototype, "facultyId");
IsString()(CreateProgramDto.prototype, "name");
IsNotEmpty()(CreateProgramDto.prototype, "name");
MaxLength(200)(CreateProgramDto.prototype, "name");
IsString()(CreateProgramDto.prototype, "code");
IsOptional()(CreateProgramDto.prototype, "code");
MaxLength(50)(CreateProgramDto.prototype, "code");
IsString()(CreateProgramDto.prototype, "modality");
IsOptional()(CreateProgramDto.prototype, "modality");
MaxLength(50)(CreateProgramDto.prototype, "modality");
IsInt()(CreateProgramDto.prototype, "durationSemesters");
IsOptional()(CreateProgramDto.prototype, "durationSemesters");
Min(1)(CreateProgramDto.prototype, "durationSemesters");

class UpdateProgramDto {}

IsString()(UpdateProgramDto.prototype, "facultyId");
IsOptional()(UpdateProgramDto.prototype, "facultyId");
IsString()(UpdateProgramDto.prototype, "name");
IsOptional()(UpdateProgramDto.prototype, "name");
MaxLength(200)(UpdateProgramDto.prototype, "name");
IsString()(UpdateProgramDto.prototype, "code");
IsOptional()(UpdateProgramDto.prototype, "code");
MaxLength(50)(UpdateProgramDto.prototype, "code");
IsString()(UpdateProgramDto.prototype, "modality");
IsOptional()(UpdateProgramDto.prototype, "modality");
MaxLength(50)(UpdateProgramDto.prototype, "modality");
IsInt()(UpdateProgramDto.prototype, "durationSemesters");
IsOptional()(UpdateProgramDto.prototype, "durationSemesters");
Min(1)(UpdateProgramDto.prototype, "durationSemesters");

module.exports = { CreateProgramDto, UpdateProgramDto };
