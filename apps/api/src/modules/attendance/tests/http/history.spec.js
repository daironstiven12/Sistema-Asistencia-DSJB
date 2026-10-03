const { validate } = require("class-validator");
const {
  AttendanceHistoryController,
  mapError,
} = require("../../interfaces/http/history.controller");
const { HistoryQueryDto } = require("../../interfaces/http/dto/session.dto");
const { AttendanceForbiddenError } = require("../../application/attendance-errors");
const { __readMetadata } = require("../../../auth/tests/nest-common.stub");

const repReq = () => ({
  ip: "127.0.0.1",
  headers: { "user-agent": "jest" },
  user: { id: "10", roles: ["REPRESENTANTE"] },
});

async function errorsOf(DtoClass, values) {
  return validate(Object.assign(new DtoClass(), values));
}

describe("attendance history controller", () => {
  test("history delega con actor del JWT y propaga 403", async () => {
    const controller = new AttendanceHistoryController({
      history: async (input) => ({
        items: [{ id: "1" }],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        echo: input,
      }),
    });
    const out = await controller.history({ page: 1, status: "FIRMADA" }, repReq());
    expect(out.items).toHaveLength(1);
    expect(out.pagination.totalItems).toBe(1);
    expect(out.echo).toMatchObject({ page: 1, status: "FIRMADA", actorId: "10" });
    expect(out.echo.groupId).toBeUndefined();
    const forbidden = new AttendanceHistoryController({
      history: async () => {
        throw new AttendanceForbiddenError();
      },
    });
    await expect(forbidden.history({}, repReq())).rejects.toMatchObject({ status: 403 });
  });

  test("HistoryQueryDto valida paginación, fechas y límites", async () => {
    expect(await errorsOf(HistoryQueryDto, {})).toEqual([]);
    expect(await errorsOf(HistoryQueryDto, { page: 2, pageSize: 20 })).toEqual([]);
    expect(await errorsOf(HistoryQueryDto, { page: 0 })).not.toEqual([]);
    expect(await errorsOf(HistoryQueryDto, { pageSize: 1000 })).not.toEqual([]);
    expect(await errorsOf(HistoryQueryDto, { pageSize: 0 })).not.toEqual([]);
    expect(
      await errorsOf(HistoryQueryDto, { dateFrom: "2026-09-01", dateTo: "2026-10-02" }),
    ).toEqual([]);
    expect(await errorsOf(HistoryQueryDto, { dateFrom: "02-10-2026" })).not.toEqual([]);
    expect(await errorsOf(HistoryQueryDto, { courseOfferingId: "abc" })).not.toEqual([]);
    expect(await errorsOf(HistoryQueryDto, { search: "x".repeat(101) })).not.toEqual([]);
    expect(
      await errorsOf(HistoryQueryDto, { search: "analitica", status: "FIRMADA", courseOfferingId: "6" }),
    ).toEqual([]);
  });

  test("mapError traduce alcance y rango sin tecnicismos", async () => {
    const forbidden = new AttendanceHistoryController({
      history: async () => {
        throw new AttendanceForbiddenError();
      },
    });
    await expect(forbidden.history({}, repReq())).rejects.toMatchObject({ status: 403 });
    const invalidStatus = new Error("x");
    invalidStatus.code = "INVALID_STATUS";
    expect(() => mapError(invalidStatus)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
    const invalidDate = new Error("x");
    invalidDate.code = "INVALID_DATE";
    expect(() => mapError(invalidDate)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
    try {
      mapError(invalidDate);
    } catch (e) {
      expect(String(e.message)).not.toMatch(/prisma|sql|chk_/i);
    }
  });

  test("roles: lectura REPRESENTANTE+ADMINISTRADOR", () => {
    expect(__readMetadata(AttendanceHistoryController.prototype, "roles", "history")).toEqual([
      "REPRESENTANTE",
      "ADMINISTRADOR",
    ]);
    expect(typeof AttendanceHistoryController.prototype.history).toBe("function");
  });
});
