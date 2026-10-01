const { IsNotEmpty, IsString } = require("class-validator");

class CreatePrerequisiteDto {}

IsString()(CreatePrerequisiteDto.prototype, "curriculumSubjectId");
IsNotEmpty()(CreatePrerequisiteDto.prototype, "curriculumSubjectId");
IsString()(CreatePrerequisiteDto.prototype, "prerequisiteSubjectId");
IsNotEmpty()(CreatePrerequisiteDto.prototype, "prerequisiteSubjectId");

module.exports = { CreatePrerequisiteDto };
