const argon2 = require("argon2");
const { getPasswordHashConfig } = require("../../../config/app-config");

class Argon2PasswordHasher {
  constructor(options) {
    this.options = options;
  }

  resolveOptions(env = process.env) {
    if (this.options) return this.options;
    const { memoryCost, timeCost, parallelism } = getPasswordHashConfig(env);
    return { memoryCost, timeCost, parallelism };
  }

  async hash(password, env = process.env) {
    const { memoryCost, timeCost, parallelism } = this.resolveOptions(env);
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost,
      timeCost,
      parallelism,
    });
  }

  async verify(hash, password) {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}

module.exports = { Argon2PasswordHasher };
