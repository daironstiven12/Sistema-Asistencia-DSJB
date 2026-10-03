const { assertSubjectType } = require("../../domain/academic-status");

async function list({ curriculumId, levelId, subjectId }, deps) {
  return deps.store.curriculumSubjectList({ curriculumId, levelId, subjectId });
}

async function get({ id }, deps) {
  return deps.store.curriculumSubjectGet(id);
}

async function create(
  { curriculumId, subjectId, levelId, subjectType, credits, isMandatory, position, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  if (subjectType !== undefined) assertSubjectType(subjectType);
  await store.curriculumGet(curriculumId);
  await store.subjectGet(subjectId);
  await store.levelGet(levelId);
  const record = await store.curriculumSubjectCreate({
    curriculumId,
    subjectId,
    levelId,
    subjectType,
    credits,
    isMandatory,
    position,
  });
  await audit.log({
    action: "academic.create",
    userId: actorId,
    entityType: "curriculum_subject",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function remove({ id, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.curriculumSubjectRemove(id);
  await audit.log({
    action: "academic.delete",
    userId: actorId,
    entityType: "curriculum_subject",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

module.exports = {
  list,
  get,
  create,
  remove,
};
