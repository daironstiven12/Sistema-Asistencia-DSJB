const { fakeAttendanceStore } = require("../helpers/fake-attendance-store");
const sessions = require("../../application/use-cases/sessions");
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");

const REP = { userId: "10", roles: ["REPRESENTANTE"] };
const ADMIN = { userId: "99", roles: ["ADMINISTRADOR"] };
const OTHER_REP = { userId: "11", roles: ["REPRESENTANTE"] };
const STUDENT = { userId: "20", roles: ["ESTUDIANTE"] };

function seeded() {
  const store = fakeAttendanceStore();
  store.seed("offerings", [{ id: "1", group_id: "7", academic_period_id: "3" }]);
  store.seed("assignments", [{ user_id: "10", group_id: "7", academic_period_id: "3", status: "ACTIVE" }]);
  store.seed("teachers", [{ course_offering_id: "1", user_id: "30", status: "ACTIVE" }]);
  return store;
}

function makeDeps(store) {
  const audits = [];
  return { deps: { store, audit: { log: async (e) => audits.push(e) } }, audits };
}

const BASE_INPUT = {
  courseOfferingId: "1",
  sessionDate: "2026-10-05",
  startTime: "14:00",
  endTime: "16:00",
  topics: "Tema 1",
  actorId: "10",
};

describe("sessions", () => {
  test("representante asignado crea sesión en BORRADOR", async () => {
    const { deps, audits } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    expect(created.representative_user_id).toBe("10");
    expect(created.attendance_code).toBeNull();
    expect(audits.map((a) => a.action)).toEqual(["attendance.create"]);
  });

  test("representante no asignado no puede crear (403)", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      sessions.create({ ...BASE_INPUT, actorId: "11", roles: OTHER_REP.roles }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
  });

  test("rol no representante no puede crear (403)", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      sessions.create({ ...BASE_INPUT, roles: STUDENT.roles }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
  });

  test("oferta inexistente (404) y sin docente asignado (404)", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      sessions.create({ ...BASE_INPUT, courseOfferingId: "99", roles: REP.roles }, deps),
    ).rejects.toBeInstanceOf(AttendanceNotFoundError);
    const empty = fakeAttendanceStore();
    empty.seed("offerings", [{ id: "1", group_id: "7", academic_period_id: "3" }]);
    empty.seed("assignments", [{ user_id: "10", group_id: "7", academic_period_id: "3" }]);
    const ctx = makeDeps(empty);
    await expect(
      sessions.create({ ...BASE_INPUT, roles: REP.roles }, ctx.deps),
    ).rejects.toBeInstanceOf(AttendanceNotFoundError);
  });

  test("horario: fin debe ser posterior al inicio (sin cruzar medianoche)", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      sessions.create({ ...BASE_INPUT, startTime: "08:00", endTime: "10:00", roles: REP.roles }, deps),
    ).resolves.toMatchObject({ representative_user_id: "10" });
    await expect(
      sessions.create({ ...BASE_INPUT, startTime: "16:00", endTime: "18:00", roles: REP.roles }, deps),
    ).resolves.toMatchObject({ representative_user_id: "10" });
    await expect(
      sessions.create({ ...BASE_INPUT, startTime: "16:00", endTime: "16:00", roles: REP.roles }, deps),
    ).rejects.toMatchObject({ code: "INVALID_TIME" });
    await expect(
      sessions.create({ ...BASE_INPUT, startTime: "16:00", endTime: "03:03", roles: REP.roles }, deps),
    ).rejects.toMatchObject({ code: "INVALID_TIME" });
    await expect(
      sessions.create({ ...BASE_INPUT, startTime: "10:00", endTime: "09:00", roles: REP.roles }, deps),
    ).rejects.toMatchObject({ code: "INVALID_TIME" });
  });

  test("listado: representante ve solo las suyas, admin ve todas", async () => {
    const { deps } = makeDeps(seeded());
    await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    expect(await sessions.list(REP, deps)).toHaveLength(1);
    expect(await sessions.list(OTHER_REP, deps)).toHaveLength(0);
    expect(await sessions.list(ADMIN, deps)).toHaveLength(1);
    await expect(sessions.list(STUDENT, deps)).rejects.toBeInstanceOf(
      AttendanceForbiddenError,
    );
  });

  test("detalle: ajeno no ve (403), inexistente 404", async () => {
    const { deps } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    await expect(sessions.get({ id: created.id, ...OTHER_REP }, deps)).rejects.toBeInstanceOf(
      AttendanceForbiddenError,
    );
    await expect(sessions.get({ id: "99", ...REP }, deps)).rejects.toBeInstanceOf(
      AttendanceNotFoundError,
    );
    await expect(sessions.get({ id: created.id, ...ADMIN }, deps)).resolves.toMatchObject({
      id: created.id,
    });
  });

  test("detalle conserva facultad y docente que entrega el store", async () => {
    const fila = {
      id: "1",
      representative_user_id: "10",
      course_offerings: {
        academic_groups: {
          name: "8A",
          academic_programs: { name: "INGENIERÍA", faculties: { name: "Facultad de Ingeniería" } },
        },
      },
      users_attendance_sessions_teacher_user_idTousers: {
        persons: { first_name: "Jack", middle_name: null, last_name: "Renteria", second_last_name: "Mena" },
      },
    };
    const deps = { store: { sessionGet: async () => ({ ...fila }) }, audit: { log: async () => {} } };
    await expect(sessions.get({ id: "1", ...REP }, deps)).resolves.toMatchObject({
      id: "1",
      course_offerings: {
        academic_groups: {
          academic_programs: { faculties: { name: "Facultad de Ingeniería" } },
        },
      },
      users_attendance_sessions_teacher_user_idTousers: {
        persons: { first_name: "Jack", last_name: "Renteria" },
      },
    });
  });

  test("apertura genera código y solo BORRADOR→ABIERTA", async () => {
    const { deps } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    const opened = await sessions.open({ id: created.id, ...REP, actorId: "10" }, deps);
    expect(opened.attendance_code).toMatch(/^ASIS-/);
    await expect(
      sessions.open({ id: created.id, ...REP, actorId: "10" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  test("apertura ajena 403", async () => {
    const { deps } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    await expect(
      sessions.open({ id: created.id, ...OTHER_REP, actorId: "11" }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
  });

  test("cierre ABIERTA→CERRADA y sin reapertura", async () => {
    const { deps } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    await expect(
      sessions.close({ id: created.id, ...REP, actorId: "10" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    await sessions.open({ id: created.id, ...REP, actorId: "10" }, deps);
    const closed = await sessions.close({ id: created.id, ...REP, actorId: "10" }, deps);
    expect(closed.closed_at).not.toBeNull();
    await expect(
      sessions.open({ id: created.id, ...REP, actorId: "10" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  test("cierre ajeno 403", async () => {
    const { deps } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    await sessions.open({ id: created.id, ...REP, actorId: "10" }, deps);
    await expect(
      sessions.close({ id: created.id, ...OTHER_REP, actorId: "11" }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
  });

  test("temas: propietario actualiza, audita y conserva lo demás", async () => {
    const { deps, audits } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    const updated = await sessions.updateTopics(
      { id: created.id, topics: "  Temática real desarrollada  ", ...REP, actorId: "10" },
      deps,
    );
    expect(updated.topics).toBe("Temática real desarrollada");
    expect(updated.representative_user_id).toBe("10");
    expect(audits.map((a) => a.action)).toContain("attendance.update-topics");
  });

  test("temas: ajeno, otro rol e inexistente", async () => {
    const { deps } = makeDeps(seeded());
    const created = await sessions.create({ ...BASE_INPUT, roles: REP.roles }, deps);
    await expect(
      sessions.updateTopics({ id: created.id, topics: "X", ...OTHER_REP, actorId: "11" }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
    await expect(
      sessions.updateTopics({ id: created.id, topics: "X", roles: STUDENT.roles, actorId: "20" }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
    await expect(
      sessions.updateTopics({ id: "99", topics: "X", ...REP, actorId: "10" }, deps),
    ).rejects.toBeInstanceOf(AttendanceNotFoundError);
    await expect(
      sessions.updateTopics({ id: created.id, topics: "   ", ...REP, actorId: "10" }, deps),
    ).rejects.toBeInstanceOf(AttendanceConflictError);
  });
});
