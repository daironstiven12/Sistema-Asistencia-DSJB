class PasswordHasherPort {
  async hash() {
    throw new Error("no implementado");
  }

  async verify() {
    throw new Error("no implementado");
  }
}

module.exports = { PasswordHasherPort };
