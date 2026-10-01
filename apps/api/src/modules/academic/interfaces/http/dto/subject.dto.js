const { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } = require("class-validator");

class CreateSubjectDto {}

IsString()(CreateSubjectDto.prototype, "code");
IsNotEmpty()(CreateSubjectDto.prototype, "code");
MaxLength(50)(CreateSubjectDto.prototype, "code");
IsString()(CreateSubjectDto.prototype, "name");
IsNotEmpty()(CreateSubjectDto.prototype, "name");
MaxLength(200)(CreateSubjectDto.prototype, "name");
IsString()(CreateSubjectDto.prototype, "description");
IsOptional()(CreateSubjectDto.prototype, "description");
IsNumber()(CreateSubjectDto.prototype, "credits");
IsOptional()(CreateSubjectDto.prototype, "credits");
IsNumber()(CreateSubjectDto.prototype, "hoursTheoretical");
IsOptional()(CreateSubjectDto.prototype, "hoursTheoretical");
IsNumber()(CreateSubjectDto.prototype, "hoursPractical");
IsOptional()(CreateSubjectDto.prototype, "hoursPractical");
IsNumber()(CreateSubjectDto.prototype, "hoursIndependent");
IsOptional()(CreateSubjectDto.prototype, "hoursIndependent");

class UpdateSubjectDto {}

IsString()(UpdateSubjectDto.prototype, "name");
IsOptional()(UpdateSubjectDto.prototype, "name");
MaxLength(200)(UpdateSubjectDto.prototype, "name");
IsString()(UpdateSubjectDto.prototype, "description");
IsOptional()(UpdateSubjectDto.prototype, "description");
IsNumber()(UpdateSubjectDto.prototype, "credits");
IsOptional()(UpdateSubjectDto.prototype, "credits");
IsNumber()(UpdateSubjectDto.prototype, "hoursTheoretical");
IsOptional()(UpdateSubjectDto.prototype, "hoursTheoretical");
IsNumber()(UpdateSubjectDto.prototype, "hoursPractical");
IsOptional()(UpdateSubjectDto.prototype, "hoursPractical");
IsNumber()(UpdateSubjectDto.prototype, "hoursIndependent");
IsOptional()(UpdateSubjectDto.prototype, "hoursIndependent");

module.exports = { CreateSubjectDto, UpdateSubjectDto };
