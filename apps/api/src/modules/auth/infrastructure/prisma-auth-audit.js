class PrismaAuthAudit {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async log({ action, userId, entityType, entityId, description, metadata, ip, userAgent }) {
    await this.prisma.audit_logs.create({
      data: {
        action,
        user_id: userId == null ? null : BigInt(userId),
        entity_type: entityType ?? "user",
        entity_id: entityId == null ? null : BigInt(entityId),
        description: description ?? null,
        metadata: metadata ?? null,
        ip_address: ip ?? null,
        user_agent: userAgent ?? null,
      },
    });
  }
}

module.exports = { PrismaAuthAudit };
