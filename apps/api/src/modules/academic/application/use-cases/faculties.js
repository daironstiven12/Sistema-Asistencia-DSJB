const { assertStatus } = require("../../domain/academic-status");

async function list({ institutionId }, deps) {
  return deps.store.facultyList({ institutionId });
}

async function get({ id }, deps) {
  return deps.store.facultyGet(id);
}

async function create({ institutionId, name, code, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.facultyCreate({ institutionId, name, code });
  await audit.log({
    action: "academic.create",
    userId: actorId,
    entityType: "faculty",
    entityId: record.id,
    description: `Facultad creada: ${record.name}`,
    ip,
    userAgent,
  });
  return record;
}

async function update({ id, name, code, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.facultyUpdate(id, { name, code });
  await audit.log({
    action: "academic.update",
    userId: actorId,
    entityType: "faculty",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function setStatus({ id, status, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.facultySetStatus(id, assertStatus(status));
  await audit.log({
    action: status === "ACTIVE" ? "academic.activate" : "academic.deactivate",
    userId: actorId,
    entityType: "faculty",
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
