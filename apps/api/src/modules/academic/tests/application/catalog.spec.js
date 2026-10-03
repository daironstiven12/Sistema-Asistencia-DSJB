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
    await expect(institutions.update({ id: "99", name: "X", actorId: "1" }, deps)).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
    await expect(
      institutions.setStatus({ id: "99", status: "INACTIVE", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await institutions.create({ name: "A", code: "X", actorId: "1" }, deps);
    await expect(
      institutions.create({ name: "B", code: "X", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicConflictError);
    await expect(
      institutions.setStatus({ id: "1", status: "ELIMINADO", actorId: "1" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
  });

  test("listado devuelve las instituciones creadas", async () => {
    const { deps } = makeDeps(fakeAcademicStore());
    expect(await institutions.list({}, deps)).toHaveLength(0);
    await institutions.create({ name: "A", code: "A", actorId: "1" }, deps);
    await institutions.create({ name: "B", actorId: "1" }, deps);
    const rows = await institutions.list({}, deps);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name).sort()).toEqual(["A", "B"]);
    expect(await institutions.list({ q: "a" }, deps)).toHaveLength(1);
    expect(await institutions.list({ q: "zzz" }, deps)).toHaveLength(0);
  });
});

describe("faculties", () => {
  test("valida institución y respeta unicidad", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    const { deps } = makeDeps(store);
    await expect(
      faculties.create({ institutionId: "99", name: "F", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    const created = await faculties.create(
      { institutionId: "1", name: "Ingeniería", code: "ING", actorId: "1" },
      deps,
    );
    expect(created.id).toBeDefined();
    await expect(
      faculties.create({ institutionId: "1", name: "Ingeniería", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicConflictError);
  });

  test("lista por institución y ciclo de estado", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    const { deps, audits } = makeDeps(store);
    await faculties.create({ institutionId: "1", name: "F1", actorId: "1" }, deps);
    await faculties.create({ institutionId: "1", name: "F2", actorId: "1" }, deps);
    expect(await faculties.list({ institutionId: "1" }, deps)).toHaveLength(2);
    expect(await faculties.list({ institutionId: "1", q: "f1" }, deps)).toHaveLength(1);
    expect(
      await faculties.list({ institutionId: "1", q: "zzz" }, deps),
    ).toHaveLength(0);
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

  test("actualiza, traslada de institución y valida estados", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    store.seed('institutions', [{ name: "OTRA" }]);
    const { deps } = makeDeps(store);
    const created = await faculties.create(
      { institutionId: "1", name: "F1", actorId: "1" },
      deps,
    );
    const updated = await faculties.update(
      { id: created.id, name: "F1-Ren", actorId: "1" },
      deps,
    );
    expect(updated.name).toBe("F1-Ren");
    const moved = await faculties.update(
      { id: created.id, institutionId: "2", actorId: "1" },
      deps,
    );
    expect(String(moved.institution_id)).toBe("2");
    await expect(
      faculties.update({ id: "99", name: "X", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      faculties.update({ id: created.id, institutionId: "99", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      faculties.setStatus({ id: "99", status: "INACTIVE", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      faculties.setStatus({ id: created.id, status: "ELIMINADO", actorId: "1" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
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
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    expect(await programs.list({ facultyId: "1" }, deps)).toHaveLength(1);
    await expect(programs.get({ id: "99" }, deps)).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
  });

  test("actualiza, traslada de facultad y filtra por búsqueda", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    store.seed('faculties', [{ institution_id: "1", name: "Ingeniería" }]);
    store.seed('faculties', [{ institution_id: "1", name: "Ciencias" }]);
    const { deps } = makeDeps(store);
    const created = await programs.create(
      { facultyId: "1", name: "Telecomunicaciones", code: "TEL", actorId: "1" },
      deps,
    );
    const updated = await programs.update(
      { id: created.id, modality: "Virtual", durationSemesters: 8, actorId: "1" },
      deps,
    );
    expect(updated.modality).toBe("Virtual");
    expect(updated.duration_semesters).toBe(8);
    const moved = await programs.update(
      { id: created.id, facultyId: "2", actorId: "1" },
      deps,
    );
    expect(String(moved.faculty_id)).toBe("2");
    await expect(
      programs.update({ id: "99", name: "X", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      programs.update({ id: created.id, facultyId: "99", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      programs.setStatus({ id: "99", status: "INACTIVE", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      programs.setStatus({ id: created.id, status: "ELIMINADO", actorId: "1" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
    expect(await programs.list({ facultyId: "2", q: "telecom" }, deps)).toHaveLength(1);
    expect(await programs.list({ facultyId: "2", q: "inexistente" }, deps)).toHaveLength(0);
    expect(await programs.list({ facultyId: "1" }, deps)).toHaveLength(0);
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
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
  });

  test("actualiza, traslada de programa y filtra por búsqueda", async () => {
    const store = fakeAcademicStore();
    store.seed('institutions', [{ name: "UTCH" }]);
    store.seed('faculties', [{ institution_id: "1", name: "Ingeniería" }]);
    store.seed('programs', [{ faculty_id: "1", name: "Telecomunicaciones" }]);
    store.seed('programs', [{ faculty_id: "1", name: "Sistemas" }]);
    const { deps } = makeDeps(store);
    const created = await curricula.create(
      { programId: "1", name: "Plan 2020", version: "2020", actorId: "1" },
      deps,
    );
    expect(created.version).toBe("2020");
    const updated = await curricula.update(
      { id: created.id, name: "Plan 2020-Ren", actorId: "1" },
      deps,
    );
    expect(updated.name).toBe("Plan 2020-Ren");
    expect(updated.version).toBe("2020");
    const moved = await curricula.update(
      { id: created.id, programId: "2", actorId: "1" },
      deps,
    );
    expect(String(moved.program_id)).toBe("2");
    await expect(
      curricula.update({ id: "99", name: "X", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      curricula.update({ id: created.id, programId: "99", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      curricula.setStatus({ id: "99", status: "INACTIVE", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      curricula.setStatus({ id: created.id, status: "ELIMINADO", actorId: "1" }, deps),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
    expect(await curricula.list({ programId: "2", q: "2020" }, deps)).toHaveLength(1);
    expect(await curricula.list({ programId: "2", q: "zzz" }, deps)).toHaveLength(0);
    expect(await curricula.list({ programId: "1" }, deps)).toHaveLength(0);
  });
});
