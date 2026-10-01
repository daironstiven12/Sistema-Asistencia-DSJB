const { parseDurationMs } = require("../domain/session-policy");
const { getRefreshConfig } = require("../../../config/app-config");

function refreshExpiresIn(env = process.env) {
  return getRefreshConfig(env).expiresIn;
}

function refreshExpiresInMs(env = process.env) {
  return parseDurationMs(refreshExpiresIn(env));
}

module.exports = { refreshExpiresIn, refreshExpiresInMs };
