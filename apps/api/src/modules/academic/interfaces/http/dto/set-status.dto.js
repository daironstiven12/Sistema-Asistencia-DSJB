const { IsIn, IsString } = require("class-validator");

class SetStatusDto {}

IsString()(SetStatusDto.prototype, "status");
IsIn(["ACTIVE", "INACTIVE"])(SetStatusDto.prototype, "status");

module.exports = { SetStatusDto };
