/* Adaptador Instituciones ↔ API real.
   Mapea el modelo visual (nombre, codigo, estado Activo/Inactivo) al
   contrato del backend (name, code, status ACTIVE/INACTIVE).
   Solo se envían columnas reales de `institutions`: los campos extra del
   formulario anterior (sigla, nit, rector, etc.) NO se envían. */

import { apiRequest } from "./http";

const toApiEstado = (estado) => (estado === "Activo" ? "ACTIVE" : "INACTIVE");

const toFila = (row) => ({
  id: String(row.id),
  nombre: row.name,
  codigo: row.code ?? "",
  estado: row.status === "ACTIVE" ? "Activo" : "Inactivo",
});

export const institutionsApi = {
  async list({ q } = {}) {
    const qs = q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    const rows = await apiRequest(`/academic/institutions${qs}`);
    return (Array.isArray(rows) ? rows : []).map(toFila);
  },

  async get(id) {
    return toFila(await apiRequest(`/academic/institutions/${id}`));
  },

  async create({ nombre, codigo }) {
    const payload = { name: nombre.trim() };
    if (codigo && codigo.trim()) payload.code = codigo.trim().toUpperCase();
    return toFila(await apiRequest("/academic/institutions", { method: "POST", body: payload }));
  },

  async update(id, { nombre, codigo }) {
    const payload = {};
    if (nombre !== undefined) payload.name = nombre.trim();
    if (codigo !== undefined) {
      if (codigo.trim()) payload.code = codigo.trim().toUpperCase();
    }
    return toFila(
      await apiRequest(`/academic/institutions/${id}`, { method: "PATCH", body: payload }),
    );
  },

  async setStatus(id, estado) {
    return toFila(
      await apiRequest(`/academic/institutions/${id}/status`, {
        method: "PATCH",
        body: { status: toApiEstado(estado) },
      }),
    );
  },
};
