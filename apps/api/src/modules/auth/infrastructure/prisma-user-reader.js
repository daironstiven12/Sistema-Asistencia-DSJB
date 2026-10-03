class PrismaUserReader {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findByUsername(username) {
    const row = await this.prisma.users.findUnique({
      where: { username: String(username ?? "").trim() },
      select: {
        id: true,
        username: true,
        password_hash: true,
        status: true,
        persons: { select: { email: true } },
        user_roles: { select: { roles: { select: { name: true } } } },
      },
    });
    return toAuthUser(row);
  }

  /* Identificador principal de acceso: correo institucional guardado en
     persons.email (UNIQUE, normalizado a minúsculas). */
  async findByEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const person = await this.prisma.persons.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (!person) return null;
    const row = await this.prisma.users.findUnique({
      where: { person_id: person.id },
      select: {
        id: true,
        username: true,
        password_hash: true,
        status: true,
        persons: { select: { email: true } },
        user_roles: { select: { roles: { select: { name: true } } } },
      },
    });
    return toAuthUser(row);
  }

  async findById(id) {
    const row = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        username: true,
        status: true,
        user_roles: { select: { roles: { select: { name: true } } } },
      },
    });
    const user = toAuthUser(row);
    if (user) delete user.passwordHash;
    return user;
  }
}

function toAuthUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    username: row.username,
    email: row.persons?.email ?? null,
    passwordHash: row.password_hash,
    status: row.status,
    roles: row.user_roles.map((link) => link.roles.name),
  };
}

function normalizeEmail(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

module.exports = { PrismaUserReader, normalizeEmail };
