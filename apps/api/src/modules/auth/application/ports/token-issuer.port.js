class TokenIssuerPort {
  async signAccess() {
    throw new Error("no implementado");
  }

  async verifyAccess() {
    throw new Error("no implementado");
  }
}

module.exports = { TokenIssuerPort };
