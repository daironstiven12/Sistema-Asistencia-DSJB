const { fakeAttendanceStore } = require("../helpers/fake-attendance-store");
const offerings = require("../../application/use-cases/offerings");
const { AttendanceForbiddenError } = require("../../application/attendance-errors");

const REP = { userId: "10", roles: ["REPRESENTANTE"] };

function seeded() {
  const store = fakeAttendanceStore();
  store.seed("offerings", [
    { id: "1", group_id: "7", academic_period_id: "3", status: "ACTIVE", subject: "Ruteo", subjectCode: "RTS-701", group: "VII-A", period: "2026-2", level: "VII", program: "ITEL" },
    { id: "2", group_id: "7", academic_period_id: "3", status: "ACTIVE", subject: "SOP", subjectCode: "SOP-701", group: "VII-A", period: "2026-2", level: "VII", program: "ITEL" },
    { id: "3", group_id: "8", academic_period_id: "3", status: "ACTIVE", subject: "Otra", group: "VI-B", period: "2026-2" },
    { id: "4", group_id: "7", academic_period_id: "3", status: "INACTIVE", subject: "Vieja", group: "VII-A", period: "2026-2" },
  ]);
  store.seed("assignments", [
    { user_id: "10", group_id: "7", academic_period_id: "3", status: "ACTIVE" },
    { user_id: "11", group_id: "8", academic_period_id: "3", status: "ACTIVE" },
  ]);
  return store;
}

function makeDeps(store) {
  const audits = [];
  return { deps: { store, audit: { log: async (e) => audits.push(e) } }, audits };
}

describe("offerings", () => {
  test("representante obtiene solo sus ofertas activas con contexto", async () => {
    const { deps } = makeDeps(seeded());
    const rows = await offerings.list(REP, deps);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      courseOfferingId: "1",
      subject: "Ruteo",
      subjectCode: "RTS-701",
      group: "VII-A",
      period: "2026-2",
      level: "VII",
      program: "ITEL",
    });
    expect(rows.map((r) => r.courseOfferingId).sort()).toEqual(["1", "2"]);
  });

  test("representante no obtiene ofertas ajenas", async () => {
    const { deps } = makeDeps(seeded());
    const rows = await offerings.list({ userId: "11", roles: ["REPRESENTANTE"] }, deps);
    expect(rows.map((r) => r.courseOfferingId)).toEqual(["3"]);
  });

  test("otros roles reciben 403 (incluido ADMINISTRADOR)", async () => {
    const { deps } = makeDeps(seeded());
    for (const roles of [["ADMINISTRADOR"], ["ESTUDIANTE"], ["DOCENTE"], []]) {
      await expect(offerings.list({ userId: "10", roles }, deps)).rejects.toBeInstanceOf(
        AttendanceForbiddenError,
      );
    }
  });

  test("representante sin asignaciones recibe lista vacía", async () => {
    const { deps } = makeDeps(seeded());
    await expect(offerings.list({ userId: "99", roles: ["REPRESENTANTE"] }, deps)).resolves.toEqual(
      [],
    );
  });

  test("asignación inactiva no otorga ofertas", async () => {
    const store = fakeAttendanceStore();
    store.seed("offerings", [
      { id: "1", group_id: "7", academic_period_id: "3", subject: "Ruteo", group: "VII-A", period: "2026-2" },
    ]);
    store.seed("assignments", [
      { user_id: "10", group_id: "7", academic_period_id: "3", status: "INACTIVE" },
    ]);
    const { deps } = makeDeps(store);
    await expect(offerings.list(REP, deps)).resolves.toEqual([]);
  });
});
