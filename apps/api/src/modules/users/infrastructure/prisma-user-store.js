function toUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    username: row.username,
    passwordHash: row.password_hash,
    status: row.status,
    lastLoginAt: row.last_login_at ?? null,
    roles: row.user_roles.map((link) => link.roles.name),
  };
}

const SELECT = {
  id: true,
  username: true,
  password_hash: true,
  status: true,
  last_login_at: true,
  user_roles: { select: { roles: { select: { name: true } } } },
};

class PrismaUserStore {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findById(id) {
    const row = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
      select: SELECT,
    });
    return toUser(row);
  }

  async updateStatus(id, status) {
    await this.prisma.users.update({
      where: { id: BigInt(id) },
      data: { status },
    });
  }

  async updatePasswordHash(id, hash) {
    await this.prisma.users.update({
      where: { id: BigInt(id) },
      data: { password_hash: hash },
    });
  }
}

module.exports = { PrismaUserStore };
