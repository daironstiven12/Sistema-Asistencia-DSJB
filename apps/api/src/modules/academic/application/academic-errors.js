class AcademicError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class AcademicNotFoundError extends AcademicError {
  constructor() {
    super("NOT_FOUND");
  }
}

class AcademicConflictError extends AcademicError {
  constructor() {
    super("CONFLICT");
  }
}

class AcademicInvalidReferenceError extends AcademicError {
  constructor() {
    super("INVALID_REFERENCE");
  }
}

module.exports = {
  AcademicError,
  AcademicNotFoundError,
  AcademicConflictError,
  AcademicInvalidReferenceError,
};
