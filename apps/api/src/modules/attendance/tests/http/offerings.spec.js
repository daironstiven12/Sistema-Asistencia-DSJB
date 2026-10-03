const {
  AttendanceOfferingsController,
} = require("../../interfaces/http/offerings.controller");
const { AttendanceForbiddenError } = require("../../application/attendance-errors");
const { __readMetadata } = require("../../../auth/tests/nest-common.stub");

const repReq = () => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user: { id: "10", roles: ["REPRESENTANTE"] },
});

describe("attendance offerings controller", () => {
  test("listado delega con la identidad del JWT (sin ids del cliente)", async () => {
    const seen = [];
    const controller = new AttendanceOfferingsController({
      list: async (input) => {
        seen.push(input);
        return [{ courseOfferingId: "1" }];
      },
    });
    const rows = await controller.list(repReq());
    expect(rows).toHaveLength(1);
    expect(seen[0]).toEqual({ userId: "10", roles: ["REPRESENTANTE"] });
  });

  test("prohibido mapea 403", async () => {
    const controller = new AttendanceOfferingsController({
      list: async () => {
        throw new AttendanceForbiddenError();
      },
    });
    await expect(controller.list(repReq())).rejects.toMatchObject({ status: 403 });
  });

  test("solo REPRESENTANTE (lectura autenticada del propio recurso)", () => {
    expect(__readMetadata(AttendanceOfferingsController.prototype, "roles", "list")).toEqual([
      "REPRESENTANTE",
    ]);
  });
});
