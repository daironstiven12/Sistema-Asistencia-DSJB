/* Motor CRUD declarativo.
   Un módulo de administración se define con un objeto de configuración:
   colección, columnas, filtros y esquema de formulario. Este componente
   resuelve listado, búsqueda, filtros, alta, edición, activación,
   detalle y borrado. Añadir un módulo no requiere JSX nuevo. */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Power, Plus, Trash2 } from "lucide-react";
import {
  ConfirmDialog,
  DataTable,
  EmptyState,
  FormModal,
  SearchBar,
  ui,
} from "@/components/ui";
import { useAcademy } from "./AcademyProvider";
import { tonoEstado } from "./selectors";

function matchesQuery(row, query, fields) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  return fields.some((field) =>
    String(row[field] ?? "").toLowerCase().includes(text),
  );
}

export function CrudModule({
  config,
  eyebrow,
  intro,
  detail,
  extraActions,
  dependents = [],
}) {
  const { db, add, edit, toggle, remove } = useAcademy();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const rows = useMemo(() => db[config.collection] ?? [], [db, config.collection]);

  const filterDefs = useMemo(() => {
    if (typeof config.filters === "function") return config.filters(db);
    return config.filters ?? [];
  }, [config, db]);

  const searchField = filterDefs.find((f) => f.type === "search");
  const others = useMemo(
    () => filterDefs.filter((f) => f.type !== "search"),
    [filterDefs],
  );

  const filtered = useMemo(() => {
    const fields = config.searchFields ?? ["nombre"];
    return rows.filter((row) => {
      if (searchField && !matchesQuery(row, query, fields)) {
        return false;
      }
      return others.every((filter) => {
        const value = filters[filter.key];
        if (!value) return true;
        const raw = typeof row[filter.key] === "string" ? row[filter.key] : undefined;
        return raw === value || String(resolveFilter(row, filter, db)) === value;
      });
    });
  }, [rows, query, filters, config.searchFields, searchField, others, db]);

  const activeCount = Object.values(filters).filter(Boolean).length + (query ? 1 : 0);

  /* Tras guardar se cierra el modal: el alta o la edición ya quedó en el
     estado y el formulario se resetea al abrirse de nuevo. */
  const handleCreate = (values) => {
    add(config.collection)(
      config.normalize(values, db),
      config.log ? config.log(values, "Creó") : { modulo: config.title, accion: "Creó" },
    );
    setCreating(false);
  };

  const handleEdit = (values) => {
    if (!editing) return;
    edit(config.collection)(
      editing.id,
      config.normalize(values, db, editing),
      config.log ? config.log(values, "Actualizó", editing) : { modulo: config.title, accion: "Actualizó" },
    );
    setEditing(null);
  };

  const columns = [
    ...config.columns(db),
    {
      key: "__actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <div>
          {config.detailHref ? (
            <Link
              href={config.detailHref(row)}
              className={ui.linkBtn}
              aria-label={`Ver detalle de ${config.singular} ${row.nombre ?? row.codigo ?? row.id}`}
            >
              <Eye aria-hidden="true" />
              Ver
            </Link>
          ) : null}
          {config.detalle ? (
            <button
              type="button"
              className={ui.linkBtn}
              aria-label={`Ver detalle de ${config.singular} ${row.nombre ?? row.codigo ?? row.id}`}
              onClick={() => setDetalle(row)}
            >
              <Eye aria-hidden="true" />
              Ver
            </button>
          ) : null}
          <button
            type="button"
            className={ui.btnIcon}
            aria-label={`Editar ${config.singular} ${row.nombre ?? row.codigo ?? row.id}`}
            onClick={() => setEditing(row)}
          >
            <Pencil aria-hidden="true" />
          </button>
          {config.toggleable !== false ? (
            <button
              type="button"
              className={ui.btnIcon}
              aria-label={`${row.estado === "Activo" ? "Desactivar" : "Activar"} ${config.singular} ${row.nombre ?? row.codigo ?? row.id}`}
              onClick={() =>
                toggle(config.collection)(row.id, {
                  modulo: config.title,
                  accion: row.estado === "Activo" ? "Desactivó" : "Activó",
                  entidad: row.nombre ?? row.codigo ?? row.id,
                  descripcion: `Estado cambiado a ${row.estado === "Activo" ? "Inactivo" : "Activo"}.`,
                })
              }
            >
              <Power aria-hidden="true" />
            </button>
          ) : null}
          {config.deletable ? (
            <button
              type="button"
              className={ui.btnIcon}
              aria-label={`Eliminar ${config.singular} ${row.nombre ?? row.id}`}
              onClick={() => setConfirmDelete(row)}
            >
              <Trash2 aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          {searchField ? (
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={searchField.placeholder}
              ariaLabel={searchField.label}
            />
          ) : null}
          {others.map((filter) => (
            <select
              key={filter.key}
              className={ui.select}
              style={{ width: "auto", minHeight: 36, height: 36 }}
              value={filters[filter.key] ?? ""}
              onChange={(event) =>
                setFilters((p) => ({ ...p, [filter.key]: event.target.value }))
              }
              aria-label={filter.label}
            >
              <option value="">{filter.placeholder ?? filter.label}</option>
              {filter.options.map((option) => {
                const value = typeof option === "string" ? option : option.value;
                const label = typeof option === "string" ? option : option.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          ))}
          {activeCount > 0 ? (
            <>
              <span className={ui.filterCount}>
                {activeCount} filtro{activeCount > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className={ui.linkBtn}
                onClick={() => {
                  setQuery("");
                  setFilters({});
                }}
              >
                Limpiar
              </button>
            </>
          ) : null}
        </div>
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {filtered.length} de {rows.length}
        </span>
        {config.creatable !== false ? (
          <button type="button" className={ui.btnPrimary} onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            Crear {config.singular}
          </button>
        ) : null}
      </div>

      {dependents.length > 0 ? (
        <div className={ui.filterBar}>
          {dependents.map((node) => node)}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={config.icon}
          title={query || activeCount ? "Sin coincidencias" : `Aún no hay ${config.plural}`}
          text={
            query || activeCount
              ? "Ajusta la búsqueda o los filtros para ver otros registros."
              : config.emptyText ?? `Crea el primer registro de ${config.plural}.`
          }
        >
          {rows.length === 0 ? (
            <button type="button" className={ui.btnPrimary} onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" />
              Crear {config.singular}
            </button>
          ) : null}
        </EmptyState>
      ) : (
        <DataTable columns={columns} rows={filtered} />
      )}

      <p className={ui.cellMuted}>
        {intro ??
          `Gestiona ${config.plural} desde un solo lugar. Los cambios quedan registrados en la auditoría.`}
      </p>

      <FormModal
        open={creating}
        onClose={() => setCreating(false)}
        title={`Nuevo ${config.singular}`}
        sub={`Completa los datos para registrar ${config.singular.toLowerCase()} en el sistema.`}
        schema={config.schema(db)}
        submitLabel="Crear"
        onSubmit={handleCreate}
      />

      <FormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Editar ${config.singular}`}
        sub={editing ? editing.nombre ?? editing.codigo : ""}
        schema={config.schema(db)}
        seed={editing ? config.seed?.(editing) ?? editing : undefined}
        submitLabel="Guardar cambios"
        onSubmit={handleEdit}
        onDelete={
          config.deletable && editing
            ? () => {
                setConfirmDelete(editing);
                setEditing(null);
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          remove(config.collection)(confirmDelete.id, {
            modulo: config.title,
            accion: "Eliminó",
            entidad: confirmDelete.nombre ?? confirmDelete.id,
            descripcion: "Registro eliminado del sistema.",
          });
          setConfirmDelete(null);
        }}
        title={`Eliminar ${config.singular}`}
        text={`Esta acción no se puede deshacer. Se eliminará "${
          confirmDelete?.nombre ?? confirmDelete?.codigo ?? confirmDelete?.id
        }" de forma permanente.`}
        confirmLabel="Eliminar"
        danger
        icon={Trash2}
      />

      {extraActions ? extraActions : null}

      {config.detalle ? (
        <config.detalle row={detalle} onClose={() => setDetalle(null)} />
      ) : null}
    </>
  );
}

function resolveFilter(row, filter, db) {
  if (typeof filter.resolve === "function") return filter.resolve(row, db);
  return row[filter.key];
}
