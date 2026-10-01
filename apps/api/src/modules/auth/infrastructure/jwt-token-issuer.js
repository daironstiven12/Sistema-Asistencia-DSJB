const jwt = require("jsonwebtoken");
const { assertAccessClaims } = require("../domain/token-claims");
const { getJwtConfig } = require("../../../config/app-config");

function required(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`configuracion_invalida:${name}`);
  }
  return value;
}

class JwtTokenIssuer {
  constructor({ secret, issuer, audience, expiresIn } = {}) {
    this.secret = required("JWT_ACCESS_SECRET", secret);
    this.issuer = issuer;
    this.audience = audience;
    const value = expiresIn ?? "15m";
    if (!/^(\d+)([smhd])$/.test(String(value))) {
      throw new Error("configuracion_invalida:JWT_ACCESS_EXPIRES_IN");
    }
    this.expiresIn = value;
  }

  static fromEnv(env = process.env) {
    const { secret, issuer, audience, expiresIn } = getJwtConfig(env);
    return new JwtTokenIssuer({ secret, issuer, audience, expiresIn });
  }

  async signAccess(claims) {
    const payload = assertAccessClaims(claims);
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      ...(this.issuer ? { issuer: this.issuer } : {}),
      ...(this.audience ? { audience: this.audience } : {}),
    });
  }

  async verifyAccess(token) {
    return jwt.verify(token, this.secret, {
      ...(this.issuer ? { issuer: this.issuer } : {}),
      ...(this.audience ? { audience: this.audience } : {}),
    });
  }
}

module.exports = { JwtTokenIssuer };
