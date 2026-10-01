const { assertStatus } = require("../../domain/academic-status");

async function list({ programId }, deps) {
  return deps.store.curriculumList({ programId });
}

async function get({ id }, deps) {
  return deps.store.curriculumGet(id);
}

async function create(
  { programId, name, code, version, effectiveFrom, effectiveUntil, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const record = await store.curriculumCreate({
    programId,
    name,
    code,
    version,
    effectiveFrom,
    effectiveUntil,
  });
  await audit.log({
    action: "academic.create",
    userId: actorId,
    entityType: "curriculum",
    entityId: record.id,
    description: `Plan de estudios creado: ${record.name}`,
    ip,
    userAgent,
  });
  return record;
}

async function update(
  { id, name, code, version, effectiveFrom, effectiveUntil, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const record = await store.curriculumUpdate(id, {
    name,
    code,
    version,
    effectiveFrom,
    effectiveUntil,
  });
  await audit.log({
    action: "academic.update",
    userId: actorId,
    entityType: "curriculum",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function setStatus({ id, status, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.curriculumSetStatus(id, assertStatus(status));
  await audit.log({
    action: status === "ACTIVE" ? "academic.activate" : "academic.deactivate",
    userId: actorId,
    entityType: "curriculum",
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
  update,
  setStatus,
};
