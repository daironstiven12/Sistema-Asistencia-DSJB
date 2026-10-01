async function list(_, deps) {
  return deps.store.levelList();
}

async function get({ id }, deps) {
  return deps.store.levelGet(id);
}

module.exports = { list, get };
