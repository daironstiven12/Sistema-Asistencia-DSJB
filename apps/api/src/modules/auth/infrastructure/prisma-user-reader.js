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
    passwordHash: row.password_hash,
    status: row.status,
    roles: row.user_roles.map((link) => link.roles.name),
  };
}

module.exports = { PrismaUserReader };
