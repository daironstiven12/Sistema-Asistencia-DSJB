const { assertStatus } = require("../../domain/academic-status");

async function list({ facultyId }, deps) {
  return deps.store.programList({ facultyId });
}

async function get({ id }, deps) {
  return deps.store.programGet(id);
}

async function create(
  { facultyId, name, code, modality, durationSemesters, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const record = await store.programCreate({
    facultyId,
    name,
    code,
    modality,
    durationSemesters,
  });
  await audit.log({
    action: "academic.create",
    userId: actorId,
    entityType: "program",
    entityId: record.id,
    description: `Programa creado: ${record.name}`,
    ip,
    userAgent,
  });
  return record;
}

async function update(
  { id, name, code, modality, durationSemesters, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const record = await store.programUpdate(id, {
    name,
    code,
    modality,
    durationSemesters,
  });
  await audit.log({
    action: "academic.update",
    userId: actorId,
    entityType: "program",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function setStatus({ id, status, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.programSetStatus(id, assertStatus(status));
  await audit.log({
    action: status === "ACTIVE" ? "academic.activate" : "academic.deactivate",
    userId: actorId,
    entityType: "program",
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
