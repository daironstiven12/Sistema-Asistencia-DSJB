require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma/client.ts");
const { getDatabaseConfig } = require("../config/app-config");

const { databaseUrl } = getDatabaseConfig();
const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$queryRaw`SELECT current_database() AS database_name`;

  console.log("Conexión exitosa.");
  console.log("Base de datos:", result[0].database_name);
}

main()
  .catch((error) => {
    console.error("Error de conexión:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });