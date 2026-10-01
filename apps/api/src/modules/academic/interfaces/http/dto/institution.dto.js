const { IsNotEmpty, IsOptional, IsString, MaxLength } = require("class-validator");

class CreateInstitutionDto {}

IsString()(CreateInstitutionDto.prototype, "name");
IsNotEmpty()(CreateInstitutionDto.prototype, "name");
MaxLength(200)(CreateInstitutionDto.prototype, "name");
IsString()(CreateInstitutionDto.prototype, "code");
IsOptional()(CreateInstitutionDto.prototype, "code");
MaxLength(30)(CreateInstitutionDto.prototype, "code");

class UpdateInstitutionDto {}

IsString()(UpdateInstitutionDto.prototype, "name");
IsOptional()(UpdateInstitutionDto.prototype, "name");
MaxLength(200)(UpdateInstitutionDto.prototype, "name");
IsString()(UpdateInstitutionDto.prototype, "code");
IsOptional()(UpdateInstitutionDto.prototype, "code");
MaxLength(30)(UpdateInstitutionDto.prototype, "code");

module.exports = { CreateInstitutionDto, UpdateInstitutionDto };
