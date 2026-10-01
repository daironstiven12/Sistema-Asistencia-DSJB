class SessionStorePort {
  async create() {
    throw new Error("no implementado");
  }

  async findByTokenHash() {
    throw new Error("no implementado");
  }

  async markReplaced() {
    throw new Error("no implementado");
  }

  async revoke() {
    throw new Error("no implementado");
  }

  async revokeFamily() {
    throw new Error("no implementado");
  }

  async revokeAllForUser() {
    throw new Error("no implementado");
  }
}

module.exports = { SessionStorePort };
