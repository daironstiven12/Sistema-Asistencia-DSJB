/* Adaptador Facultades ↔ API real.
   Mapea el modelo visual (nombre, codigo, institucionId, estado
   Activo/Inactivo) al contrato del backend (name, code, institution_id,
   status ACTIVE/INACTIVE). Los campos extra del formulario anterior
   (decano, descripcion) NO se envían: no existen en `faculties`. */

import { apiRequest } from "./http";

const toFila = (row) => ({
  id: String(row.id),
  nombre: row.name,
  codigo: row.code ?? "",
  institucionId: row.institution_id != null ? String(row.institution_id) : "",
  estado: row.status === "ACTIVE" ? "Activo" : "Inactivo",
});

export const facultadesApi = {
  async list({ institutionId, q } = {}) {
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    if (q && q.trim()) params.set("q", q.trim());
    const qs = params.toString() ? `?${params.toString()}` : "";
    const rows = await apiRequest(`/academic/faculties${qs}`);
    return (Array.isArray(rows) ? rows : []).map(toFila);
  },

  async get(id) {
    return toFila(await apiRequest(`/academic/faculties/${id}`));
  },

  async create({ nombre, codigo, institucionId }) {
    const payload = { institutionId, name: nombre.trim() };
    if (codigo && codigo.trim()) payload.code = codigo.trim().toUpperCase();
    return toFila(await apiRequest("/academic/faculties", { method: "POST", body: payload }));
  },

  async update(id, { nombre, codigo, institucionId }) {
    const payload = {};
    if (nombre !== undefined) payload.name = nombre.trim();
    if (codigo !== undefined && codigo.trim()) payload.code = codigo.trim().toUpperCase();
    if (institucionId !== undefined && institucionId !== "") payload.institutionId = institucionId;
    return toFila(
      await apiRequest(`/academic/faculties/${id}`, { method: "PATCH", body: payload }),
    );
  },

  async setStatus(id, estado) {
    return toFila(
      await apiRequest(`/academic/faculties/${id}/status`, {
        method: "PATCH",
        body: { status: estado === "Activo" ? "ACTIVE" : "INACTIVE" },
      }),
    );
  },
};
