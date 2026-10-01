/* Contrato de la futura API.
   No se invoca en el prototipo: documenta la forma que la API debe cumplir
   para que `src/services/index.js` solo necesite cambiar el import.

   Endpoints sugeridos, uno por colección:
     GET    /api/{collection}
     POST   /api/{collection}
     PATCH  /api/{collection}/{id}
     DELETE /api/{collection}/{id}
     GET    /api/audit-logs?role=&module=&from=&to=
     POST   /api/attendance-sessions/{id}/transition
     POST   /api/attendance-sessions/{id}/records
     POST   /api/signatures

   Autenticación: Authorization: Bearer <token> con los claims de
   user_roles. El frontend ya pide {rol} en cada pantalla, así que el
   backend puede filtrar por rol sin cambios de UI. */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  load: () => request("/bootstrap"),
  list: (collection) => request(`/${collection}`),
  create: (collection, payload) =>
    request(`/${collection}`, { method: "POST", body: JSON.stringify(payload) }),
  update: (collection, id, payload) =>
    request(`/${collection}/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (collection, id) => request(`/${collection}/${id}`, { method: "DELETE" }),
  transition: (sessionId, to) =>
    request(`/attendance-sessions/${sessionId}/transition`, {
      method: "POST",
      body: JSON.stringify({ to }),
    }),
  save: () => Promise.resolve({ ok: true }),
};

export default api;
