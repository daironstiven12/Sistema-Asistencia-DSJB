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

class EmailAlreadyRegisteredError extends AuthError {
  constructor() {
    super("EMAIL_TAKEN");
  }
}

class IdentificationAlreadyRegisteredError extends AuthError {
  constructor() {
    super("IDENTIFICATION_TAKEN");
  }
}

class InvalidRegistrationError extends AuthError {
  constructor() {
    super("INVALID_REGISTRATION");
  }
}

module.exports = {
  AuthError,
  InvalidCredentialsError,
  SessionNotFoundError,
  SessionExpiredError,
  SessionRevokedError,
  SessionReuseError,
  EmailAlreadyRegisteredError,
  IdentificationAlreadyRegisteredError,
  InvalidRegistrationError,
};
