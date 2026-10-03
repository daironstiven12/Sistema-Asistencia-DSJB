function decorator() {
  return () => {};
}

const __params = [];

function Param(property) {
  return (target, key, index) => {
    __params.push({ target, key, index, property });
  };
}

function __paramOf(target, key, index) {
  return __params.find(
    (p) => p.target === target && p.key === key && p.index === index,
  );
}

class UnauthorizedException extends Error {
  constructor(message) {
    super(message);
    this.status = 401;
  }

  getStatus() {
    return this.status;
  }
}

class ForbiddenException extends Error {
  constructor(message) {
    super(message);
    this.status = 403;
  }

  getStatus() {
    return this.status;
  }
}

class BadRequestException extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }

  getStatus() {
    return this.status;
  }
}

class NotFoundException extends Error {
  constructor(message) {
    super(message);
    this.status = 404;
  }

  getStatus() {
    return this.status;
  }
}

class ConflictException extends Error {
  constructor(message) {
    super(message);
    this.status = 409;
  }

  getStatus() {
    return this.status;
  }
}

class InternalServerErrorException extends Error {
  constructor(message) {
    super(message);
    this.status = 500;
  }

  getStatus() {
    return this.status;
  }
}

class Logger {
  constructor(context) {
    this.context = context;
  }

  error() {}

  warn() {}

  log() {}

  debug() {}
}

class ValidationPipe {
  constructor() {}
}

const __metadata = new WeakMap();

function SetMetadata(key, value) {
  return (target, property) => {
    const holder = typeof property === "string" ? target : (property ?? target);
    const entry = __metadata.get(holder) ?? {};
    const scope = typeof property === "string" ? property : "class";
    entry[scope] = { ...(entry[scope] ?? {}), [key]: value };
    __metadata.set(holder, entry);
  };
}

function __readMetadata(holder, key, scope = "class") {
  return __metadata.get(holder)?.[scope]?.[key];
}

module.exports = {
  Controller: () => decorator(),
  Post: () => decorator(),
  Get: () => decorator(),
  Patch: () => decorator(),
  Delete: () => decorator(),
  HttpCode: () => decorator(),
  Body: () => decorator(),
  Req: () => decorator(),
  Res: () => decorator(),
  Param,
  Dependencies: () => decorator(),
  Injectable: () => decorator(),
  Module: () => decorator(),
  Global: () => decorator(),
  UseGuards: () => decorator(),
  UsePipes: () => decorator(),
  Query: () => decorator(),
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  ValidationPipe,
  SetMetadata,
  __readMetadata,
  __paramOf,
};
