const { IsIn, IsString } = require("class-validator");

class SetStatusDto {}

IsString()(SetStatusDto.prototype, "status");
IsIn(["ACTIVE", "INACTIVE", "BLOCKED"])(SetStatusDto.prototype, "status");

module.exports = { SetStatusDto };
