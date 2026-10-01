const {
  AcademicInvalidReferenceError,
} = require("../academic-errors");

async function list({ curriculumSubjectId }, deps) {
  return deps.store.prerequisiteList({ curriculumSubjectId });
}

async function create(
  { curriculumSubjectId, prerequisiteSubjectId, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  if (String(curriculumSubjectId) === String(prerequisiteSubjectId)) {
    throw new AcademicInvalidReferenceError();
  }
  const record = await store.prerequisiteCreate({
    curriculumSubjectId,
    prerequisiteSubjectId,
  });
  await audit.log({
    action: "academic.create",
    userId: actorId,
    entityType: "subject_prerequisite",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function remove({ id, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.prerequisiteRemove(id);
  await audit.log({
    action: "academic.delete",
    userId: actorId,
    entityType: "subject_prerequisite",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

module.exports = { list, create, remove };
