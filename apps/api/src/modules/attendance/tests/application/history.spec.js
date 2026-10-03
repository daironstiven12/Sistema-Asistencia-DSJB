const { fakeAttendanceStore } = require("../helpers/fake-attendance-store");
const sessions = require("../../application/use-cases/sessions");
const { AttendanceForbiddenError } = require("../../application/attendance-errors");

const REP = { userId: "10", actorId: "10", roles: ["REPRESENTANTE"] };
const ADMIN = { userId: "99", actorId: "99", roles: ["ADMINISTRADOR"] };
const OTHER_REP = { userId: "11", actorId: "11", roles: ["REPRESENTANTE"] };
const STUDENT = { userId: "20", actorId: "20", roles: ["ESTUDIANTE"] };

function day(iso) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function seeded() {
  const store = fakeAttendanceStore();
  store.seed("offerings", [
    { id: "1", group_id: "7", academic_period_id: "3", subject: "Analítica de Datos", subjectCode: "2720708", group: "8A" },
    { id: "2", group_id: "8", academic_period_id: "3", subject: "Redes", subjectCode: "2720308", group: "8B" },
  ]);
  store.seed("assignments", [
    { user_id: "10", group_id: "7", academic_period_id: "3", status: "ACTIVE" },
    { user_id: "11", group_id: "8", academic_period_id: "3", status: "ACTIVE" },
  ]);
  store.seed("statuses", [
    { id: "FIRMADA", code: "FIRMADA", name: "FIRMADA" },
    { id: "ABIERTA", code: "ABIERTA", name: "ABIERTA" },
    { id: "CERRADA", code: "CERRADA", name: "CERRADA" },
  ]);
  store.seed("sessions", [
    { id: "1", course_offering_id: "1", representative_user_id: "10", attendance_status_id: "FIRMADA", session_date: day("2026-10-02"), start_time: "16:00" },
    { id: "2", course_offering_id: "1", representative_user_id: "10", attendance_status_id: "ABIERTA", session_date: day("2026-10-03"), start_time: "16:00" },
    { id: "3", course_offering_id: "1", representative_user_id: "10", attendance_status_id: "CERRADA", session_date: day("2026-09-30"), start_time: "08:00" },
    { id: "4", course_offering_id: "2", representative_user_id: "11", attendance_status_id: "FIRMADA", session_date: day("2026-10-04"), start_time: "10:00" },
  ]);
  store.seed("records", [
    { attendance_session_id: "1", student_id: "50" },
    { attendance_session_id: "1", student_id: "51" },
    { attendance_session_id: "2", student_id: "50" },
  ]);
  return store;
}

function makeDeps(store) {
  const audits = [];
  return { deps: { store, audit: { log: async (e) => audits.push(e) } }, audits };
}

describe("history", () => {
  test("200 con items ordenados y paginación consistente", async () => {
    const { deps } = makeDeps(seeded());
    const out = await sessions.history({ ...REP }, deps);
    expect(out.items.map((s) => s.id)).toEqual(["2", "1", "3"]);
    expect(out.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      totalItems: 3,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(out.items[0]._count).toMatchObject({ attendance_records: 1 });
    expect(out.items[1]._count).toMatchObject({ attendance_records: 2 });
  });

  test("paginación: pageSize=1 pagina de a uno", async () => {
    const { deps } = makeDeps(seeded());
    const p1 = await sessions.history({ ...REP, page: 1, pageSize: 1 }, deps);
    const p2 = await sessions.history({ ...REP, page: 2, pageSize: 1 }, deps);
    expect(p1.items.map((s) => s.id)).toEqual(["2"]);
    expect(p1.pagination).toMatchObject({ totalItems: 3, totalPages: 3, hasNextPage: true });
    expect(p2.items.map((s) => s.id)).toEqual(["1"]);
    expect(p2.pagination).toMatchObject({ hasNextPage: true, hasPreviousPage: true });
  });

  test("status=FIRMADA solo devuelve firmadas", async () => {
    const { deps } = makeDeps(seeded());
    const out = await sessions.history({ ...REP, status: "FIRMADA" }, deps);
    expect(out.items.map((s) => s.id)).toEqual(["1"]);
  });

  test("dateFrom/dateTo filtra por session_date", async () => {
    const { deps } = makeDeps(seeded());
    const out = await sessions.history(
      { ...REP, dateFrom: "2026-10-01", dateTo: "2026-10-02" },
      deps,
    );
    expect(out.items.map((s) => s.id)).toEqual(["1"]);
  });

  test("courseOfferingId filtra por oferta", async () => {
    const { deps } = makeDeps(seeded());
    const out = await sessions.history({ ...ADMIN, courseOfferingId: "2" }, deps);
    expect(out.items.map((s) => s.id)).toEqual(["4"]);
  });

  test("search encuentra por asignatura, código y grupo", async () => {
    const { deps } = makeDeps(seeded());
    expect((await sessions.history({ ...ADMIN, search: "analítica" }, deps)).items.map((s) => s.id)).toEqual(["2", "1", "3"]);
    expect((await sessions.history({ ...ADMIN, search: "2720708" }, deps)).items.map((s) => s.id)).toEqual(["2", "1", "3"]);
    expect((await sessions.history({ ...ADMIN, search: "8A" }, deps)).items.map((s) => s.id)).toEqual(["2", "1", "3"]);
    expect((await sessions.history({ ...ADMIN, search: "8B" }, deps)).items.map((s) => s.id)).toEqual(["4"]);
  });

  test("filtros combinados", async () => {
    const { deps } = makeDeps(seeded());
    const out = await sessions.history(
      { ...REP, status: "ABIERTA", dateFrom: "2026-10-01", search: "datos" },
      deps,
    );
    expect(out.items.map((s) => s.id)).toEqual(["2"]);
  });

  test("dateFrom > dateTo → 400 por rango inválido", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      sessions.history({ ...REP, dateFrom: "2026-10-05", dateTo: "2026-10-01" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_DATE" });
  });

  test("estado desconocido → 400", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      sessions.history({ ...REP, status: "INVENTADO" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
  });

  test("representante no ve sesiones de otro grupo", async () => {
    const { deps } = makeDeps(seeded());
    const out = await sessions.history({ ...OTHER_REP }, deps);
    expect(out.items.map((s) => s.id)).toEqual(["4"]);
  });

  test("usuario sin asignación recibe vacío 200", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    const out = await sessions.history(
      { userId: "77", actorId: "77", roles: ["REPRESENTANTE"] },
      deps,
    );
    expect(out.items).toEqual([]);
    expect(out.pagination).toMatchObject({ totalItems: 0, totalPages: 0 });
  });

  test("otro rol → 403 y admin ve todo", async () => {
    const { deps } = makeDeps(seeded());
    await expect(sessions.history({ ...STUDENT }, deps)).rejects.toBeInstanceOf(
      AttendanceForbiddenError,
    );
    expect((await sessions.history({ ...ADMIN }, deps)).pagination.totalItems).toBe(4);
  });

  test("sin resultados: 200 con items [] y paginación consistente", async () => {
    const { deps } = makeDeps(seeded());
    const out = await sessions.history({ ...REP, search: "inexistente-xyz" }, deps);
    expect(out.items).toEqual([]);
    expect(out.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
