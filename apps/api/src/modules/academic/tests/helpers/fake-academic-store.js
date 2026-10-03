const {
  AcademicConflictError,
  AcademicInvalidReferenceError,
  AcademicNotFoundError,
} = require("../../application/academic-errors");

const UNIQUES = {
  institutions: [["code"]],
  faculties: [["institution_id", "name"], ["institution_id", "code"]],
  programs: [["code"], ["faculty_id", "name"]],
  curricula: [["code"], ["program_id", "name"]],
  levels: [["number"], ["name"]],
  subjects: [["code"]],
  curriculumSubjects: [["curriculum_id", "subject_id"]],
  prerequisites: [["curriculum_subject_id", "prerequisite_subject_id"]],
};

const PARENTS = {
  faculties: { institution_id: "institutions" },
  programs: { faculty_id: "faculties" },
  curricula: { program_id: "programs" },
  curriculumSubjects: {
    curriculum_id: "curricula",
    subject_id: "subjects",
    academic_level_id: "levels",
  },
  prerequisites: {
    curriculum_subject_id: "curriculumSubjects",
    prerequisite_subject_id: "curriculumSubjects",
  },
};

// Los use-cases hablan camelCase y el store real mapea a snake_case.
// El fake normaliza igual para validar padres/unicidad como Prisma (P2003/P2002).
const CAMEL_TO_SNAKE = {
  institutionId: "institution_id",
  facultyId: "faculty_id",
  programId: "program_id",
  curriculumId: "curriculum_id",
  subjectId: "subject_id",
  levelId: "academic_level_id",
  curriculumSubjectId: "curriculum_subject_id",
  prerequisiteSubjectId: "prerequisite_subject_id",
  durationSemesters: "duration_semesters",
};

function normalizeKeys(data = {}) {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [CAMEL_TO_SNAKE[k] ?? k, v]),
  );
}

function keyOf(keys, row) {
  return keys.map((k) => `${k}=${row[k] ?? ""}`).join("|");
}

function fakeAcademicStore() {
  const tables = Object.fromEntries(
    Object.keys(UNIQUES).map((entity) => [entity, new Map()]),
  );
  const counters = {};
  const nextId = (entity) => {
    counters[entity] = (counters[entity] ?? 0) + 1;
    return String(counters[entity]);
  };

  function create(entity, rawData) {
    const data = normalizeKeys(rawData);
    const table = tables[entity];
    for (const [field, parent] of Object.entries(PARENTS[entity] ?? {})) {
      if (data[field] !== undefined && !tables[parent].has(String(data[field]))) {
        throw new AcademicInvalidReferenceError();
      }
    }
    for (const keys of UNIQUES[entity] ?? []) {
      const scoped = [...table.values()].some(
        (row) => keys.every((k) => String(row[k] ?? "") !== "" && String(row[k]) === String(data[k])),
      );
      if (scoped && keys.every((k) => data[k] !== undefined && data[k] !== null && data[k] !== "")) {
        throw new AcademicConflictError();
      }
    }
    const row = { id: nextId(entity), status: "ACTIVE", ...data };
    table.set(row.id, row);
    return { ...row };
  }

  function get(entity, id) {
    const row = tables[entity].get(String(id));
    if (!row) throw new AcademicNotFoundError();
    return { ...row };
  }

  function update(entity, id, patch) {
    const table = tables[entity];
    const row = table.get(String(id));
    if (!row) throw new AcademicNotFoundError();
    const normalized = Object.fromEntries(
      Object.entries(normalizeKeys(patch)).filter(([, v]) => v !== undefined),
    );
    for (const keys of UNIQUES[entity] ?? []) {
      if (!keys.every((k) => normalized[k] !== undefined && normalized[k] !== null && normalized[k] !== "")) {
        continue;
      }
      const clash = [...table.values()].some(
        (other) =>
          String(other.id) !== String(id) &&
          keys.every((k) => String(other[k] ?? "") !== "" && String(other[k]) === String(normalized[k])),
      );
      if (clash) throw new AcademicConflictError();
    }
    Object.assign(row, normalized);
    return { ...row };
  }

  function remove(entity, id) {
    const row = tables[entity].get(String(id));
    if (!row) throw new AcademicNotFoundError();
    tables[entity].delete(String(id));
    return { ...row };
  }

  function seed(entity, rows) {
    rows.forEach((row) => {
      const normalized = normalizeKeys(row);
      const id = normalized.id ?? nextId(entity);
      tables[entity].set(String(id), { id: String(id), ...normalized });
    });
  }

  const store = { tables, seed };
  const list =
    (entity, filters = {}) =>
    (criteria = {}) => {
      let rows = [...tables[entity].values()];
      for (const [field, value] of Object.entries({ ...filters, ...criteria })) {
        if (value !== undefined && value !== "") {
          rows = rows.filter((r) => String(r[field]) === String(value));
        }
      }
      return rows.map((r) => ({ ...r }));
    };

  return {
    store,
    seed,
    institutionList: (criteria = {}) => {
      let rows = [...tables.institutions.values()];
      if (criteria?.query) {
        const q = String(criteria.query).toLowerCase();
        rows = rows.filter(
          (r) =>
            String(r.name).toLowerCase().includes(q) ||
            String(r.code ?? "").toLowerCase().includes(q),
        );
      }
      return rows.map((r) => ({ ...r }));
    },
    institutionGet: (id) => get("institutions", id),
    institutionCreate: (data) => create("institutions", data),
    institutionUpdate: (id, patch) => update("institutions", id, patch),
    institutionSetStatus: (id, status) => update("institutions", id, { status }),
    facultyList: (criteria = {}) => {
      let rows = [...tables.faculties.values()];
      if (criteria?.institutionId !== undefined && criteria?.institutionId !== "") {
        rows = rows.filter((r) => String(r.institution_id) === String(criteria.institutionId));
      }
      if (criteria?.query) {
        const q = String(criteria.query).toLowerCase();
        rows = rows.filter(
          (r) =>
            String(r.name).toLowerCase().includes(q) ||
            String(r.code ?? "").toLowerCase().includes(q),
        );
      }
      return rows.map((r) => ({ ...r }));
    },
    facultyGet: (id) => get("faculties", id),
    facultyCreate: (data) => create("faculties", data),
    facultyUpdate: (id, patch) => update("faculties", id, patch),
    facultySetStatus: (id, status) => update("faculties", id, { status }),
    programList: (criteria = {}) => {
      let rows = [...tables.programs.values()];
      if (criteria?.facultyId !== undefined && criteria?.facultyId !== "") {
        rows = rows.filter((r) => String(r.faculty_id) === String(criteria.facultyId));
      }
      if (criteria?.query) {
        const q = String(criteria.query).toLowerCase();
        rows = rows.filter(
          (r) =>
            String(r.name).toLowerCase().includes(q) ||
            String(r.code ?? "").toLowerCase().includes(q),
        );
      }
      return rows.map((r) => ({ ...r }));
    },
    programGet: (id) => get("programs", id),
    programCreate: (data) => create("programs", data),
    programUpdate: (id, patch) => update("programs", id, patch),
    programSetStatus: (id, status) => update("programs", id, { status }),
    curriculumList: (criteria = {}) => {
      let rows = [...tables.curricula.values()];
      if (criteria?.programId !== undefined && criteria?.programId !== "") {
        rows = rows.filter((r) => String(r.program_id) === String(criteria.programId));
      }
      if (criteria?.query) {
        const q = String(criteria.query).toLowerCase();
        rows = rows.filter(
          (r) =>
            String(r.name).toLowerCase().includes(q) ||
            String(r.code ?? "").toLowerCase().includes(q),
        );
      }
      return rows.map((r) => ({ ...r }));
    },
    curriculumGet: (id) => get("curricula", id),
    curriculumCreate: (data) => create("curricula", data),
    curriculumUpdate: (id, patch) => update("curricula", id, patch),
    curriculumSetStatus: (id, status) => update("curricula", id, { status }),
    levelList: () => [...tables.levels.values()].map((r) => ({ ...r })),
    levelGet: (id) => get("levels", id),
    subjectList: (criteria = {}) => {
      let rows = [...tables.subjects.values()];
      if (criteria.query) {
        const q = criteria.query.toLowerCase();
        rows = rows.filter(
          (r) =>
            String(r.name).toLowerCase().includes(q) ||
            String(r.code).toLowerCase().includes(q),
        );
      }
      return rows.map((r) => ({ ...r }));
    },
    subjectGet: (id) => get("subjects", id),
    subjectCreate: (data) => create("subjects", data),
    subjectUpdate: (id, patch) => update("subjects", id, patch),
    subjectSetStatus: (id, status) => update("subjects", id, { status }),
    curriculumSubjectList: (criteria) =>
      list("curriculumSubjects")({
        curriculum_id: criteria?.curriculumId,
        academic_level_id: criteria?.levelId,
        subject_id: criteria?.subjectId,
      }),
    curriculumSubjectGet: (id) => get("curriculumSubjects", id),
    curriculumSubjectCreate: (data) =>
      create("curriculumSubjects", {
        curriculum_id: data.curriculumId,
        subject_id: data.subjectId,
        academic_level_id: data.levelId,
        subject_type: data.subjectType ?? "NORMAL",
        credits: data.credits,
        is_mandatory: data.isMandatory ?? true,
        position: data.position,
      }),
    curriculumSubjectRemove: (id) => remove("curriculumSubjects", id),
    prerequisiteList: (criteria) =>
      list("prerequisites")({ curriculum_subject_id: criteria?.curriculumSubjectId }),
    prerequisiteCreate: (data) =>
      create("prerequisites", {
        curriculum_subject_id: data.curriculumSubjectId,
        prerequisite_subject_id: data.prerequisiteSubjectId,
      }),
    prerequisiteRemove: (id) => remove("prerequisites", id),
  };
}

module.exports = { fakeAcademicStore };
