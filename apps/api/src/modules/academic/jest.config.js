/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testRegex: ".spec.js$",
  transform: {
    "^.+\\.js$": "<rootDir>/../auth/tests/jest-transformer.js",
  },
  moduleNameMapper: {
    "^@nestjs/common$": "<rootDir>/../auth/tests/nest-common.stub.js",
    "^@nestjs/core$": "<rootDir>/../auth/tests/nest-core.stub.js",
    "^@nestjs/throttler$": "<rootDir>/../auth/tests/nest-throttler.stub.js",
  },
};

module.exports = config;
