class UserError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class UserNotFoundError extends UserError {
  constructor() {
    super("USER_NOT_FOUND");
  }
}

class ForbiddenError extends UserError {
  constructor() {
    super("FORBIDDEN");
  }
}

class WeakPasswordError extends UserError {
  constructor() {
    super("WEAK_PASSWORD");
  }
}

class InvalidCurrentPasswordError extends UserError {
  constructor() {
    super("INVALID_CURRENT_PASSWORD");
  }
}

module.exports = {
  UserError,
  UserNotFoundError,
  ForbiddenError,
  WeakPasswordError,
  InvalidCurrentPasswordError,
};
