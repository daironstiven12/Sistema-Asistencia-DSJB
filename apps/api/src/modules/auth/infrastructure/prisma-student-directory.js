const {
  EmailAlreadyRegisteredError,
  IdentificationAlreadyRegisteredError,
  InvalidRegistrationError,
} = require("../application/auth-errors");

function toId(value) {
  try {
    return BigInt(String(value ?? "").trim());
  } catch {
    return null;
  }
}

// Directorio de cuentas de estudiante: lecturas de unicidad y creación
// atómica Person → User → Student + rol (una sola escritura anidada de
// Prisma: o se crea todo o no queda ningún huérfano).
class PrismaStudentDirectory {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async roleByName(name) {
    const row = await this.prisma.roles.findUnique({ where: { name } });
    return row ? { id: String(row.id), name: row.name } : null;
  }

  async idTypeById(id) {
    const key = toId(id);
    if (key === null) return null;
    const row = await this.prisma.identification_types.findUnique({ where: { id: key } });
    return row ? { id: String(row.id), code: row.code, name: row.name } : null;
  }

  async listIdentificationTypes() {
    const rows = await this.prisma.identification_types.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { id: "asc" },
    });
    return rows.map((r) => ({ id: String(r.id), code: r.code, name: r.name }));
  }

  async emailTaken(email) {
    const row = await this.prisma.persons.findUnique({
      where: { email: String(email) },
      select: { id: true },
    });
    return row !== null;
  }

  async identTaken(idTypeId, identificationNumber) {
    const key = toId(idTypeId);
    if (key === null) return false;
    const row = await this.prisma.persons.findFirst({
      where: { identification_type_id: key, identification_number: String(identificationNumber) },
      select: { id: true },
    });
    return row !== null;
  }

  async usernameTaken(username) {
    const row = await this.prisma.users.findUnique({
      where: { username: String(username) },
      select: { id: true },
    });
    return row !== null;
  }

  async createStudentAccount({
    email,
    username,
    passwordHash,
    firstName,
    lastName,
    identificationTypeId,
    identificationNumber,
    roleId,
  }) {
    const typeKey = identificationTypeId === null ? null : toId(identificationTypeId);
    const roleKey = toId(roleId);
    if ((identificationTypeId !== null && typeKey === null) || roleKey === null) {
      throw new InvalidRegistrationError();
    }
    try {
      const created = await this.prisma.users.create({
        data: {
          username: String(username),
          password_hash: String(passwordHash),
          status: "ACTIVE",
          persons: {
            create: {
              identification_type_id: typeKey,
              identification_number:
                identificationNumber === null ? null : String(identificationNumber),
              first_name: String(firstName),
              last_name: String(lastName),
              email: String(email),
              status: "ACTIVE",
              students: { create: { status: "ACTIVE" } },
            },
          },
          user_roles: { create: { role_id: roleKey } },
        },
        select: { id: true },
      });
      return { userId: String(created.id) };
    } catch (error) {
      // Carrera de unicidad: se resuelve cuál duplicado ocurrió.
      if (error?.code === "P2002") {
        if (await this.emailTaken(email)) throw new EmailAlreadyRegisteredError();
        if (await this.identTaken(typeKey, identificationNumber)) {
          throw new IdentificationAlreadyRegisteredError();
        }
      }
      throw error;
    }
  }
}

module.exports = { PrismaStudentDirectory };
