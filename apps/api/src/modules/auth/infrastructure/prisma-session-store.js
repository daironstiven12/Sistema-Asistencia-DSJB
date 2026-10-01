function toRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    familyId: row.family_id,
    replacedByHash: row.replaced_by_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  };
}

class PrismaSessionStore {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create({ userId, tokenHash, familyId, expiresAt, ip, userAgent }) {
    const row = await this.prisma.auth_sessions.create({
      data: {
        user_id: BigInt(userId),
        token_hash: tokenHash,
        family_id: familyId,
        expires_at: expiresAt,
        ip_address: ip ?? null,
        user_agent: userAgent ?? null,
      },
    });
    return toRow(row);
  }

  async findByTokenHash(tokenHash) {
    const row = await this.prisma.auth_sessions.findUnique({
      where: { token_hash: tokenHash },
    });
    return toRow(row);
  }

  async markReplaced(id, newHash) {
    await this.prisma.auth_sessions.update({
      where: { id: BigInt(id) },
      data: { replaced_by_hash: newHash },
    });
  }

  async revoke(id) {
    await this.prisma.auth_sessions.updateMany({
      where: { id: BigInt(id), revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  async revokeFamily(familyId) {
    const result = await this.prisma.auth_sessions.updateMany({
      where: { family_id: familyId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return result.count;
  }

  async revokeAllForUser(userId) {
    const result = await this.prisma.auth_sessions.updateMany({
      where: { user_id: BigInt(userId), revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return result.count;
  }
}

module.exports = { PrismaSessionStore };
