const { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } = require("class-validator");

class CreateCurriculumDto {}

IsString()(CreateCurriculumDto.prototype, "programId");
IsNotEmpty()(CreateCurriculumDto.prototype, "programId");
IsString()(CreateCurriculumDto.prototype, "name");
IsNotEmpty()(CreateCurriculumDto.prototype, "name");
MaxLength(150)(CreateCurriculumDto.prototype, "name");
IsString()(CreateCurriculumDto.prototype, "code");
IsOptional()(CreateCurriculumDto.prototype, "code");
MaxLength(50)(CreateCurriculumDto.prototype, "code");
IsString()(CreateCurriculumDto.prototype, "version");
IsOptional()(CreateCurriculumDto.prototype, "version");
MaxLength(30)(CreateCurriculumDto.prototype, "version");
IsDateString()(CreateCurriculumDto.prototype, "effectiveFrom");
IsOptional()(CreateCurriculumDto.prototype, "effectiveFrom");
IsDateString()(CreateCurriculumDto.prototype, "effectiveUntil");
IsOptional()(CreateCurriculumDto.prototype, "effectiveUntil");

class UpdateCurriculumDto {}

IsString()(UpdateCurriculumDto.prototype, "name");
IsOptional()(UpdateCurriculumDto.prototype, "name");
MaxLength(150)(UpdateCurriculumDto.prototype, "name");
IsString()(UpdateCurriculumDto.prototype, "code");
IsOptional()(UpdateCurriculumDto.prototype, "code");
MaxLength(50)(UpdateCurriculumDto.prototype, "code");
IsString()(UpdateCurriculumDto.prototype, "version");
IsOptional()(UpdateCurriculumDto.prototype, "version");
MaxLength(30)(UpdateCurriculumDto.prototype, "version");
IsDateString()(UpdateCurriculumDto.prototype, "effectiveFrom");
IsOptional()(UpdateCurriculumDto.prototype, "effectiveFrom");
IsDateString()(UpdateCurriculumDto.prototype, "effectiveUntil");
IsOptional()(UpdateCurriculumDto.prototype, "effectiveUntil");

module.exports = { CreateCurriculumDto, UpdateCurriculumDto };
