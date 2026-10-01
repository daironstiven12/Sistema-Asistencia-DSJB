const { fakeAcademicStore } = require("../helpers/fake-academic-store");
const institutions = require("../../application/use-cases/institutions");
const faculties = require("../../application/use-cases/faculties");
const programs = require("../../application/use-cases/programs");
const curricula = require("../../application/use-cases/curricula");
const {
  AcademicConflictError,
  AcademicInvalidReferenceError,
  AcademicNotFoundError,
} = require("../../application/academic-errors");

function makeDeps(store) {
  const audits = [];
  return {
    deps: { store, audit: { log: async (e) => audits.push(e) } },
    audits,
  };
}

describe("institutions", () => {
  test("ciclo crear, consultar, actualizar y desactivar", async () => {
    const { deps, audits } = makeDeps(fakeAcademicStore());
    const created = await institutions.create(
      { name: "UTCH", code: "UTCH", actorId: "1" },
      deps,
    );
    expect(created.id).toBe("1");
    expect(await institutions.get({ id: created.id }, deps)).toMatchObject({
      name: "UTCH",
    });
    const updated = await institutions.update(
      { id: created.id, name: "UTCH-DC", actorId: "1" },
      deps,
    );
    expect(updated.name).toBe("UTCH-DC");
    const off = await institutions.setStatus(
      { id: created.id, status: "INACTIVE", actorId: "1" },
      deps,
    );
    expect(off.status).toBe("INACTIVE");
    expect(audits.map((a) => a.action)).toEqual([
      "academic.create",
      "academic.update",
      "academic.deactivate",
    ]);
  });

  test("inexistente, duplicado y estado inválido", async () => {
    const { deps } = makeDeps(fakeAcademicStore());
    await expect(institutions.get({ id: "99" }, deps)).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
    await institutions.create({ name: "A", code: "X", actorId: "1" }, deps);
    await expect(
      institutions.create({ name: "B", code: "X", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicConflictError);
    await expect(
      institutions.setStatus({ id: "1", status: "ELIMINADO", actorId: "1" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
  });
});

describe("faculties", () => {
  test("valida institución y respeta unicidad", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    const { deps } = makeDeps(store);
    await expect(
      faculties.create({ institutionId: "99", name: "F", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicInvalidReferenceError);
    const created = await faculties.create(
      { institutionId: "1", name: "Ingeniería", code: "ING", actorId: "1" },
      deps,
    );
    expect(created.id).toBeDefined();
  });

  test("lista por institución y ciclo de estado", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    const { deps, audits } = makeDeps(store);
    await faculties.create({ institutionId: "1", name: "F1", actorId: "1" }, deps);
    await faculties.create({ institutionId: "1", name: "F2", actorId: "1" }, deps);
    expect(await faculties.list({ institutionId: "1" }, deps)).toHaveLength(2);
    const off = await faculties.setStatus({ id: "1", status: "INACTIVE", actorId: "1" }, deps);
    expect(off.status).toBe("INACTIVE");
    expect(audits.map((a) => a.action)).toEqual([
      "academic.create",
      "academic.create",
      "academic.deactivate",
    ]);
    await expect(faculties.get({ id: "99" }, deps)).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
  });
});

describe("programs", () => {
  test("crea con facultad válida y rechaza duplicados e inválidos", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    store.seed('faculties', [{ institution_id: "1", name: "Ingeniería" }]);
    const { deps } = makeDeps(store);
    const created = await programs.create(
      { facultyId: "1", name: "Telecomunicaciones", code: "TEL", actorId: "1" },
      deps,
    );
    expect(created.id).toBeDefined();
    await expect(
      programs.create({ facultyId: "1", name: "Telecomunicaciones", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicConflictError);
    await expect(
      programs.create({ facultyId: "99", name: "X", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicInvalidReferenceError);
    expect(await programs.list({ facultyId: "1" }, deps)).toHaveLength(1);
    await expect(programs.get({ id: "99" }, deps)).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
  });
});

describe("curricula", () => {
  test("conserva versiones y valida programa", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    store.seed('faculties', [{ institution_id: "1", name: "Ingeniería" }]);
    store.seed('programs', [{ faculty_id: "1", name: "Telecomunicaciones" }]);
    const { deps } = makeDeps(store);
    await curricula.create({ programId: "1", name: "Plan 2020", actorId: "1" }, deps);
    await curricula.create({ programId: "1", name: "Plan 2024", actorId: "1" }, deps);
    expect(await curricula.list({ programId: "1" }, deps)).toHaveLength(2);
    await expect(
      curricula.create({ programId: "99", name: "X", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicInvalidReferenceError);
  });
});
