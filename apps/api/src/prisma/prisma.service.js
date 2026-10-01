require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma/client.ts");
const { getDatabaseConfig } = require("../config/app-config");

class PrismaService extends PrismaClient {
  constructor() {
    const { databaseUrl } = getDatabaseConfig();
    super({
      adapter: new PrismaPg(databaseUrl),
    });
  }
}

module.exports = { PrismaService };