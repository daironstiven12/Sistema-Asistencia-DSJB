class AuthError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class InvalidCredentialsError extends AuthError {
  constructor() {
    super("INVALID_CREDENTIALS");
  }
}

class SessionNotFoundError extends AuthError {
  constructor() {
    super("SESSION_NOT_FOUND");
  }
}

class SessionExpiredError extends AuthError {
  constructor() {
    super("SESSION_EXPIRED");
  }
}

class SessionRevokedError extends AuthError {
  constructor() {
    super("SESSION_REVOKED");
  }
}

class SessionReuseError extends AuthError {
  constructor() {
    super("SESSION_REUSED");
  }
}

module.exports = {
  AuthError,
  InvalidCredentialsError,
  SessionNotFoundError,
  SessionExpiredError,
  SessionRevokedError,
  SessionReuseError,
};
