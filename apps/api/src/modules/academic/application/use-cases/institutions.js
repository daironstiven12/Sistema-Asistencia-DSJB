const { assertStatus } = require("../../domain/academic-status");

async function get({ id }, deps) {
  return deps.store.institutionGet(id);
}

async function create({ name, code, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.institutionCreate({ name, code });
  await audit.log({
    action: "academic.create",
    userId: actorId,
    entityType: "institution",
    entityId: record.id,
    description: `Institución creada: ${record.name}`,
    ip,
    userAgent,
  });
  return record;
}

async function update({ id, name, code, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.institutionUpdate(id, { name, code });
  await audit.log({
    action: "academic.update",
    userId: actorId,
    entityType: "institution",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function setStatus({ id, status, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.institutionSetStatus(id, assertStatus(status));
  await audit.log({
    action: status === "ACTIVE" ? "academic.activate" : "academic.deactivate",
    userId: actorId,
    entityType: "institution",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

module.exports = {
  get,
  create,
  update,
  setStatus,
};
