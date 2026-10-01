class UserStorePort {
  async findById() {
    throw new Error("no implementado");
  }

  async updateStatus() {
    throw new Error("no implementado");
  }

  async updatePasswordHash() {
    throw new Error("no implementado");
  }
}

module.exports = { UserStorePort };
