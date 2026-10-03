const { fakeAcademicStore } = require("../helpers/fake-academic-store");
const links = require("../../application/use-cases/curriculum-subjects");
const prerequisites = require("../../application/use-cases/prerequisites");
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

function seeded() {
  const store = fakeAcademicStore();
  store.seed('institutions', [{ name: "UTCH" }]);
  store.seed('faculties', [{ institution_id: "1", name: "Ingeniería" }]);
  store.seed('programs', [{ faculty_id: "1", name: "Telecomunicaciones" }]);
  store.seed('curricula', [{ program_id: "1", name: "Plan 2024" }]);
  store.seed('subjects', [
    { code: "SOP-701", name: "Sistemas Operativos" },
    { code: "RDC-702", name: "Redes" },
  ]);
  store.seed('levels', [{ number: 7, name: "VII" }]);
  return store;
}

describe("curriculum-subjects", () => {
  test("vincula plan, asignatura y nivel validando referencias", async () => {
    const { deps, audits } = makeDeps(seeded());
    const created = await links.create(
      { curriculumId: "1", subjectId: "1", levelId: "1", actorId: "1" },
      deps,
    );
    expect(created.subject_type).toBe("NORMAL");
    await expect(
      links.create({ curriculumId: "1", subjectId: "1", levelId: "1", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicConflictError);
    await expect(
      links.create({ curriculumId: "99", subjectId: "1", levelId: "1", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      links.create({ curriculumId: "1", subjectId: "99", levelId: "1", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      links.create({ curriculumId: "1", subjectId: "1", levelId: "99", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    expect(await links.list({ curriculumId: "1" }, deps)).toHaveLength(1);
    expect(await links.list({ subjectId: "1" }, deps)).toHaveLength(1);
    expect(
      await links.list({ curriculumId: "1", subjectId: "1", levelId: "1" }, deps),
    ).toHaveLength(1);
    expect(await links.list({ subjectId: "99" }, deps)).toHaveLength(0);
    const removed = await links.remove({ id: created.id, actorId: "1" }, deps);
    expect(removed.id).toBe(created.id);
    expect(audits.map((a) => a.action)).toEqual(["academic.create", "academic.delete"]);
    await expect(links.get({ id: "99" }, deps)).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
  });

  test("rechaza tipo inválido", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      links.create(
        { curriculumId: "1", subjectId: "1", levelId: "1", subjectType: "RARA", actorId: "1" },
        deps,
      ),
    ).rejects.toMatchObject({ code: "INVALID_STATUS" });
  });
});

describe("prerequisites", () => {
  test("evita autoreferencia, duplicados e inexistentes", async () => {
    const store = seeded();
    store.seed('curriculumSubjects', [
      { curriculum_id: "1", subject_id: "1", academic_level_id: "1" },
      { curriculum_id: "1", subject_id: "2", academic_level_id: "1" },
    ]);
    const { deps } = makeDeps(store);
    const created = await prerequisites.create(
      { curriculumSubjectId: "2", prerequisiteSubjectId: "1", actorId: "1" },
      deps,
    );
    expect(created.id).toBeDefined();
    await expect(
      prerequisites.create({ curriculumSubjectId: "2", prerequisiteSubjectId: "2", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicInvalidReferenceError);
    await expect(
      prerequisites.create({ curriculumSubjectId: "2", prerequisiteSubjectId: "1", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicConflictError);
    await expect(
      prerequisites.create({ curriculumSubjectId: "99", prerequisiteSubjectId: "1", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    await expect(
      prerequisites.create({ curriculumSubjectId: "2", prerequisiteSubjectId: "99", actorId: "1" }, deps),
    ).rejects.toBeInstanceOf(AcademicNotFoundError);
    expect(await prerequisites.list({ curriculumSubjectId: "2" }, deps)).toHaveLength(1);
    await prerequisites.remove({ id: created.id, actorId: "1" }, deps);
    expect(await prerequisites.list({}, deps)).toHaveLength(0);
  });
});
