class AttendanceError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class AttendanceNotFoundError extends AttendanceError {
  constructor() {
    super("NOT_FOUND");
  }
}

class AttendanceForbiddenError extends AttendanceError {
  constructor(reason) {
    super("FORBIDDEN");
    this.reason = reason ?? null;
  }
}

class AttendanceConflictError extends AttendanceError {
  constructor(reason) {
    super("CONFLICT");
    this.reason = reason ?? null;
  }
}

class AttendanceInvalidReferenceError extends AttendanceError {
  constructor(reason) {
    super("INVALID_REFERENCE");
    this.reason = reason ?? null;
  }
}

module.exports = {
  AttendanceError,
  AttendanceNotFoundError,
  AttendanceForbiddenError,
  AttendanceConflictError,
  AttendanceInvalidReferenceError,
};
