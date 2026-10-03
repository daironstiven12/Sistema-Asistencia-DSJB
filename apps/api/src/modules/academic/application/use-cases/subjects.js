const { assertStatus } = require("../../domain/academic-status");

async function list({ query }, deps) {
  return deps.store.subjectList({ query });
}

async function get({ id }, deps) {
  return deps.store.subjectGet(id);
}

async function create(
  { code, name, description, credits, hoursTheoretical, hoursPractical, hoursIndependent, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const record = await store.subjectCreate({
    code,
    name,
    description,
    credits,
    hoursTheoretical,
    hoursPractical,
    hoursIndependent,
  });
  await audit.log({
    action: "academic.create",
    userId: actorId,
    entityType: "subject",
    entityId: record.id,
    description: `Asignatura creada: ${record.name}`,
    ip,
    userAgent,
  });
  return record;
}

async function update(
  { id, code, name, description, credits, hoursTheoretical, hoursPractical, hoursIndependent, actorId, ip, userAgent },
  deps,
) {
  const { store, audit } = deps;
  const record = await store.subjectUpdate(id, {
    code,
    name,
    description,
    credits,
    hoursTheoretical,
    hoursPractical,
    hoursIndependent,
  });
  await audit.log({
    action: "academic.update",
    userId: actorId,
    entityType: "subject",
    entityId: record.id,
    ip,
    userAgent,
  });
  return record;
}

async function setStatus({ id, status, actorId, ip, userAgent }, deps) {
  const { store, audit } = deps;
  const record = await store.subjectSetStatus(id, assertStatus(status));
  await audit.log({
    action: status === "ACTIVE" ? "academic.activate" : "academic.deactivate",
    userId: actorId,
    entityType: "subject",
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
