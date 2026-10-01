const {
  AcademicConflictError,
  AcademicInvalidReferenceError,
  AcademicNotFoundError,
} = require("../application/academic-errors");

function normalize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return String(value);
  if (typeof value === "object" && value !== null && value.constructor?.name === "Decimal") {
    return Number(value);
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
  }
  return value;
}

function clean(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

async function run(promise, { notFound = true } = {}) {
  try {
    return await promise;
  } catch (error) {
    if (error?.code === "P2025" && notFound) throw new AcademicNotFoundError();
    throw error;
  }
}

async function creating(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error?.code === "P2002") throw new AcademicConflictError();
    if (error?.code === "P2003") throw new AcademicInvalidReferenceError();
    throw error;
  }
}

async function removing(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error?.code === "P2025") throw new AcademicNotFoundError();
    if (error?.code === "P2003") throw new AcademicConflictError();
    throw error;
  }
}

function bigId(value) {
  try {
    return BigInt(value);
  } catch {
    throw new AcademicInvalidReferenceError();
  }
}

function whereId(id) {
  try {
    return { id: BigInt(id) };
  } catch {
    throw new AcademicNotFoundError();
  }
}

class PrismaAcademicStore {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async institutionGet(id) {
    return run(this.prisma.institutions.findUnique({ where: whereId(id) }).then(required)).then(normalize);
  }

  async institutionList() {
    return this.prisma.institutions.findMany({ orderBy: { name: "asc" } }).then(normalize);
  }

  async institutionCreate({ name, code }) {
    return creating(
      this.prisma.institutions.create({ data: clean({ name, code }) }),
    ).then(normalize);
  }

  async institutionUpdate(id, { name, code }) {
    return run(
      this.prisma.institutions.update({ where: whereId(id), data: clean({ name, code }) }),
    ).then(normalize);
  }

  async institutionSetStatus(id, status) {
    return run(
      this.prisma.institutions.update({ where: whereId(id), data: { status } }),
    ).then(normalize);
  }

  async facultyList({ institutionId } = {}) {
    return this.prisma.faculties
      .findMany({
        where: institutionId ? { institution_id: bigId(institutionId) } : {},
        orderBy: { name: "asc" },
      })
      .then(normalize);
  }

  async facultyGet(id) {
    return run(this.prisma.faculties.findUnique({ where: whereId(id) }).then(required)).then(normalize);
  }

  async facultyCreate({ institutionId, name, code }) {
    return creating(
      this.prisma.faculties.create({
        data: clean({ institution_id: bigId(institutionId), name, code }),
      }),
    ).then(normalize);
  }

  async facultyUpdate(id, { name, code }) {
    return run(
      this.prisma.faculties.update({ where: whereId(id), data: clean({ name, code }) }),
    ).then(normalize);
  }

  async facultySetStatus(id, status) {
    return run(
      this.prisma.faculties.update({ where: whereId(id), data: { status } }),
    ).then(normalize);
  }

  async programList({ facultyId } = {}) {
    return this.prisma.academic_programs
      .findMany({
        where: facultyId ? { faculty_id: bigId(facultyId) } : {},
        orderBy: { name: "asc" },
      })
      .then(normalize);
  }

  async programGet(id) {
    return run(this.prisma.academic_programs.findUnique({ where: whereId(id) }).then(required)).then(normalize);
  }

  async programCreate({ facultyId, name, code, modality, durationSemesters }) {
    return creating(
      this.prisma.academic_programs.create({
        data: clean({
          faculty_id: bigId(facultyId),
          name,
          code,
          modality,
          duration_semesters: durationSemesters,
        }),
      }),
    ).then(normalize);
  }

  async programUpdate(id, { name, code, modality, durationSemesters }) {
    return run(
      this.prisma.academic_programs.update({
        where: whereId(id),
        data: clean({ name, code, modality, duration_semesters: durationSemesters }),
      }),
    ).then(normalize);
  }

  async programSetStatus(id, status) {
    return run(
      this.prisma.academic_programs.update({ where: whereId(id), data: { status } }),
    ).then(normalize);
  }

  async curriculumList({ programId } = {}) {
    return this.prisma.curricula
      .findMany({
        where: programId ? { program_id: bigId(programId) } : {},
        orderBy: { name: "asc" },
      })
      .then(normalize);
  }

  async curriculumGet(id) {
    return run(this.prisma.curricula.findUnique({ where: whereId(id) }).then(required)).then(normalize);
  }

  async curriculumCreate({ programId, name, code, version, effectiveFrom, effectiveUntil }) {
    return creating(
      this.prisma.curricula.create({
        data: clean({
          program_id: bigId(programId),
          name,
          code,
          version,
          effective_from: effectiveFrom,
          effective_until: effectiveUntil,
        }),
      }),
    ).then(normalize);
  }

  async curriculumUpdate(id, { name, code, version, effectiveFrom, effectiveUntil }) {
    return run(
      this.prisma.curricula.update({
        where: whereId(id),
        data: clean({ name, code, version, effective_from: effectiveFrom, effective_until: effectiveUntil }),
      }),
    ).then(normalize);
  }

  async curriculumSetStatus(id, status) {
    return run(
      this.prisma.curricula.update({ where: whereId(id), data: { status } }),
    ).then(normalize);
  }

  async levelList() {
    return this.prisma.academic_levels.findMany({ orderBy: { number: "asc" } }).then(normalize);
  }

  async levelGet(id) {
    return run(this.prisma.academic_levels.findUnique({ where: whereId(id) }).then(required)).then(normalize);
  }

  async subjectList({ query } = {}) {
    return this.prisma.subjects
      .findMany({
        where: query
          ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { code: { contains: query, mode: "insensitive" } }] }
          : {},
        orderBy: { name: "asc" },
      })
      .then(normalize);
  }

  async subjectGet(id) {
    return run(this.prisma.subjects.findUnique({ where: whereId(id) }).then(required)).then(normalize);
  }

  async subjectCreate({ code, name, description, credits, hoursTheoretical, hoursPractical, hoursIndependent }) {
    return creating(
      this.prisma.subjects.create({
        data: clean({
          code,
          name,
          description,
          credits,
          hours_theoretical: hoursTheoretical,
          hours_practical: hoursPractical,
          hours_independent: hoursIndependent,
        }),
      }),
    ).then(normalize);
  }

  async subjectUpdate(id, { name, description, credits, hoursTheoretical, hoursPractical, hoursIndependent }) {
    return run(
      this.prisma.subjects.update({
        where: whereId(id),
        data: clean({
          name,
          description,
          credits,
          hours_theoretical: hoursTheoretical,
          hours_practical: hoursPractical,
          hours_independent: hoursIndependent,
        }),
      }),
    ).then(normalize);
  }

  async subjectSetStatus(id, status) {
    return run(
      this.prisma.subjects.update({ where: whereId(id), data: { status } }),
    ).then(normalize);
  }

  async curriculumSubjectList({ curriculumId, levelId } = {}) {
    return this.prisma.curriculum_subjects
      .findMany({
        where: clean({
          curriculum_id: curriculumId ? bigId(curriculumId) : undefined,
          academic_level_id: levelId ? bigId(levelId) : undefined,
        }),
        orderBy: { id: "asc" },
      })
      .then(normalize);
  }

  async curriculumSubjectGet(id) {
    return run(this.prisma.curriculum_subjects.findUnique({ where: whereId(id) }).then(required)).then(normalize);
  }

  async curriculumSubjectCreate({ curriculumId, subjectId, levelId, subjectType, credits, isMandatory, position }) {
    return creating(
      this.prisma.curriculum_subjects.create({
        data: clean({
          curriculum_id: bigId(curriculumId),
          subject_id: bigId(subjectId),
          academic_level_id: bigId(levelId),
          subject_type: subjectType,
          credits,
          is_mandatory: isMandatory,
          position,
        }),
      }),
    ).then(normalize);
  }

  async curriculumSubjectRemove(id) {
    return removing(this.prisma.curriculum_subjects.delete({ where: whereId(id) })).then(normalize);
  }

  async prerequisiteList({ curriculumSubjectId } = {}) {
    return this.prisma.subject_prerequisites
      .findMany({
        where: curriculumSubjectId ? { curriculum_subject_id: bigId(curriculumSubjectId) } : {},
        orderBy: { id: "asc" },
      })
      .then(normalize);
  }

  async prerequisiteCreate({ curriculumSubjectId, prerequisiteSubjectId }) {
    return creating(
      this.prisma.subject_prerequisites.create({
        data: {
          curriculum_subject_id: bigId(curriculumSubjectId),
          prerequisite_subject_id: bigId(prerequisiteSubjectId),
        },
      }),
    ).then(normalize);
  }

  async prerequisiteRemove(id) {
    return removing(this.prisma.subject_prerequisites.delete({ where: whereId(id) })).then(normalize);
  }
}

function required(row) {
  if (!row) throw new AcademicNotFoundError();
  return row;
}

module.exports = { PrismaAcademicStore };
