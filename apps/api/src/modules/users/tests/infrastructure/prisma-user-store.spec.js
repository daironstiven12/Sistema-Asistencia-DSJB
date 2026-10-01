const { PrismaUserStore } = require("../../infrastructure/prisma-user-store");

describe("prisma-user-store (prisma simulado)", () => {
  test("mapea fila y actualiza por BigInt", async () => {
    const calls = {};
    const prisma = {
      users: {
        findUnique: async (args) => {
          calls.find = args;
          return {
            id: BigInt(7),
            username: "jp",
            password_hash: "h",
            status: "ACTIVE",
            last_login_at: null,
            user_roles: [],
          };
        },
        update: async (args) => {
          calls.update = args;
          return {};
        },
      },
    };
    const store = new PrismaUserStore(prisma);
    const user = await store.findById("7");
    expect(user.id).toBe("7");
    expect(user.roles).toEqual([]);
    await store.updateStatus("7", "BLOCKED");
    expect(prisma && calls.update).toMatchObject({
      where: { id: BigInt(7) },
      data: { status: "BLOCKED" },
    });
    await store.updatePasswordHash("7", "nuevo");
    expect(calls.update.data).toEqual({ password_hash: "nuevo" });
  });
});
