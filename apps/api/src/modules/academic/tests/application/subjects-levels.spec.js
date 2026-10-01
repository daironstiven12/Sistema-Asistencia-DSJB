const { fakeAcademicStore } = require("../helpers/fake-academic-store");
const levels = require("../../application/use-cases/levels");
const subjects = require("../../application/use-cases/subjects");
const {
  AcademicConflictError,
  AcademicNotFoundError,
} = require("../../application/academic-errors");

function makeDeps(store) {
  const audits = [];
  return {
    deps: { store, audit: { log: async (e) => audits.push(e) } },
    audits,
  };
}

describe("levels", () => {
  test("solo lectura del catálogo", async () => {
    const store = fakeAcademicStore();
    store.seed('levels', [{ number: 7, name: "VII" }]);
    const { deps } = makeDeps(store);
    expect(await levels.list({}, deps)).toHaveLength(1);
    expect(await levels.get({ id: "1" }, deps)).toMatchObject({ name: "VII" });
    await expect(levels.get({ id: "99" }, deps)).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
  });
});

describe("subjects", () => {
  test("ciclo completo con unicidad de código", async () => {
    const { deps, audits } = makeDeps(fakeAcademicStore());
    const created = await subjects.create(
      { code: "SOP-701", name: "Sistemas Operativos", credits: 4, actorId: "1" },
      deps,
    );
    expect(created.id).toBeDefined();
    await expect(
      subjects.create({ code: "SOP-701", name: "Duplicada", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicConflictError);
    const updated = await subjects.update(
      { id: created.id, name: "Sistemas Operativos II", actorId: "1" },
      deps,
    );
    expect(updated.name).toBe("Sistemas Operativos II");
    expect(audits.map((a) => a.action)).toEqual([
      "academic.create",
      "academic.update",
    ]);
  });
});
