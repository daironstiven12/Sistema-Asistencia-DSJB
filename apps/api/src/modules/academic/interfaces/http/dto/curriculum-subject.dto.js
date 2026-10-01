const { IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } = require("class-validator");

class CreateCurriculumSubjectDto {}

IsString()(CreateCurriculumSubjectDto.prototype, "curriculumId");
IsNotEmpty()(CreateCurriculumSubjectDto.prototype, "curriculumId");
IsString()(CreateCurriculumSubjectDto.prototype, "subjectId");
IsNotEmpty()(CreateCurriculumSubjectDto.prototype, "subjectId");
IsString()(CreateCurriculumSubjectDto.prototype, "levelId");
IsNotEmpty()(CreateCurriculumSubjectDto.prototype, "levelId");
IsString()(CreateCurriculumSubjectDto.prototype, "subjectType");
IsOptional()(CreateCurriculumSubjectDto.prototype, "subjectType");
IsIn(["NORMAL", "ELECTIVE", "PRACTICE", "OTHER"])(CreateCurriculumSubjectDto.prototype, "subjectType");
IsNumber()(CreateCurriculumSubjectDto.prototype, "credits");
IsOptional()(CreateCurriculumSubjectDto.prototype, "credits");
IsBoolean()(CreateCurriculumSubjectDto.prototype, "isMandatory");
IsOptional()(CreateCurriculumSubjectDto.prototype, "isMandatory");
IsInt()(CreateCurriculumSubjectDto.prototype, "position");
IsOptional()(CreateCurriculumSubjectDto.prototype, "position");

module.exports = { CreateCurriculumSubjectDto };
