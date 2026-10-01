/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testRegex: ".spec.js$",
  transform: {
    "^.+\\.js$": "<rootDir>/tests/jest-transformer.js",
  },
  moduleNameMapper: {
    "^@nestjs/common$": "<rootDir>/tests/nest-common.stub.js",
    "^@nestjs/core$": "<rootDir>/tests/nest-core.stub.js",
    "^@nestjs/throttler$": "<rootDir>/tests/nest-throttler.stub.js",
  },
};

module.exports = config;
