const { PrismaUserReader } = require("../../infrastructure/prisma-user-reader");
const { PrismaSessionStore } = require("../../infrastructure/prisma-session-store");
const { PrismaAuthAudit } = require("../../infrastructure/prisma-auth-audit");

function fakePrisma() {
  const calls = {};
  return {
    calls,
    users: {
      findUnique: async (args) => {
        calls.users = args;
        return {
          id: BigInt(7),
          username: "jp Delegate",
          password_hash: "hash",
          status: "ACTIVE",
          persons: { email: null },
          user_roles: [{ roles: { name: "DOCENTE" } }],
        };
      },
    },
    persons: {
      findUnique: async (args) => {
        calls.persons = args;
        if (args?.where?.email === "jp.delegate@utch.edu.co") return { id: BigInt(44) };
        return null;
      },
    },
    auth_sessions: {
      create: async (args) => {
        calls.create = args;
        return { id: BigInt(3), user_id: BigInt(7), ...args.data };
      },
      findUnique: async (args) => {
        calls.find = args;
        return null;
      },
      update: async (args) => {
        calls.update = args;
        return {};
      },
      updateMany: async (args) => {
        calls.updateMany = args;
        return { count: 2 };
      },
    },
    audit_logs: {
      create: async (args) => {
        calls.audit = args;
        return {};
      },
    },
  };
}

describe("prisma adapters (prisma simulado)", () => {
  test("user-reader mapea BigInt y roles", async () => {
    const prisma = fakePrisma();
    const reader = new PrismaUserReader(prisma);
    const user = await reader.findByUsername("jp Delegate");
    expect(user).toEqual({
      id: "7",
      username: "jp Delegate",
      email: null,
      passwordHash: "hash",
      status: "ACTIVE",
      roles: ["DOCENTE"],
    });
    expect(prisma.calls.users.where).toEqual({ username: "jp Delegate" });
  });

  test("findByEmail normaliza y resuelve vía persons", async () => {
    const prisma = fakePrisma();
    const reader = new PrismaUserReader(prisma);
    const found = await reader.findByEmail("  JP.Delegate@UTCH.edu.co ");
    expect(prisma.calls.persons.where).toEqual({ email: "jp.delegate@utch.edu.co" });
    expect(found?.id).toBe("7");
    expect(await reader.findByEmail("nadie@utch.edu.co")).toBeNull();
    expect(await reader.findByEmail("   ")).toBeNull();
  });

  test("session-store crea y revoca con BigInt", async () => {
    const prisma = fakePrisma();
    const store = new PrismaSessionStore(prisma);
    const row = await store.create({
      userId: "7",
      tokenHash: "h",
      familyId: "f",
      expiresAt: new Date("2026-01-01"),
    });
    expect(row.id).toBe("3");
    expect(prisma.calls.create.data.user_id).toBe(BigInt(7));
    await store.markReplaced("3", "nuevo");
    expect(prisma.calls.update.where).toEqual({ id: BigInt(3) });
    expect(await store.revokeFamily("f")).toBe(2);
    expect(await store.revokeAllForUser("7")).toBe(2);
  });

  test("audit convierte ids sin datos sensibles", async () => {
    const prisma = fakePrisma();
    const audit = new PrismaAuthAudit(prisma);
    await audit.log({ action: "auth.login.success", userId: "7" });
    expect(prisma.calls.audit.data.user_id).toBe(BigInt(7));
    expect(prisma.calls.audit.data.action).toBe("auth.login.success");
  });
});
