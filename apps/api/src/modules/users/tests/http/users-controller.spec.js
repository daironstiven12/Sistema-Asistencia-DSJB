const { UsersController } = require("../../interfaces/http/users.controller");
const { __paramOf } = require("../../../auth/tests/nest-common.stub");
const {
  ForbiddenError,
  UserNotFoundError,
} = require("../../application/user-errors");

const req = (user) => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user,
});
const self = { id: "7", roles: [] };
const admin = { id: "1", roles: ["ADMINISTRADOR"] };

function controllerWith(overrides = {}) {
  return new UsersController(
    overrides.get ?? (async () => ({ ok: true })),
    overrides.change ?? (async () => ({ updated: true })),
    overrides.set ?? (async () => ({ updated: true })),
  );
}

describe("UsersController", () => {
  test("parámetros :id cableados por nombre", () => {
    for (const method of ["getById", "changePassword", "changeStatus"]) {
      expect(__paramOf(UsersController.prototype, method, 0)).toEqual(
        expect.objectContaining({ property: "id" }),
      );
    }
  });

  test("get delega identidad del token", async () => {
    const get = async (input) => {
      expect(input.requesterId).toBe("7");
      expect(input.targetUserId).toBe("7");
      return { id: "7" };
    };
    expect(await controllerWith({ get }).getById("7", req(self))).toEqual({ id: "7" });
  });

  test("mapea 404, 403 y 400", async () => {
    const notFound = controllerWith({
      get: async () => {
        throw new UserNotFoundError();
      },
    });
    await expect(notFound.getById("9", req(admin))).rejects.toMatchObject({ status: 404 });
    const denied = controllerWith({
      change: async () => {
        throw new ForbiddenError();
      },
    });
    await expect(
      denied.changePassword("9", {}, req(self)),
    ).rejects.toMatchObject({ status: 403 });
    const { WeakPasswordError } = require("../../application/user-errors");
    const weak = controllerWith({
      change: async () => {
        throw new WeakPasswordError();
      },
    });
    await expect(
      weak.changePassword("7", {}, req(self)),
    ).rejects.toMatchObject({ status: 400 });
  });
});
