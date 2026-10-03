/* Gestión de Facultades contra la API real.
   Reutiliza los primitivos visuales globales sin el motor mock.
   Solo campos reales: nombre, código e institución. Sin botón Eliminar:
   la baja es desactivación (PATCH …/status → INACTIVE). */

"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Power, School } from "lucide-react";
import { Card, CardHead, DataTable, Drawer, EmptyState, FormModal, Notice, PersonCell, Pill, SearchBar, ui } from "@/components/ui";
import { useFacultadesApi } from "./useFacultadesApi";

function schemaFormulario(instituciones) {
  return {
    sections: [
      {
        title: "Identificación",
        fields: [
          { name: "nombre", label: "Nombre", required: true, span: "wide" },
          { name: "codigo", label: "Código", placeholder: "FI" },
          {
            name: "institucionId",
            label: "Institución",
            type: "select",
            required: true,
            options: instituciones.map((i) => ({ value: i.id, label: i.nombre })),
          },
        ],
      },
    ],
  };
}

export default function FacultadesManager() {
  const {
    filas,
    instituciones,
    cargando,
    error,
    query,
    setQuery,
    institucionId,
    setInstitucionId,
    ocupado,
    reintentar,
    crear,
    editar,
    cambiarEstado,
  } = useFacultadesApi();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const institucionesPorId = useMemo(
    () => new Map(instituciones.map((i) => [i.id, i])),
    [instituciones],
  );
  const esquema = useMemo(() => schemaFormulario(instituciones), [instituciones]);

  const guardarNuevo = async (values) => {
    setCreando(false);
    await crear(values);
  };

  const guardarEdicion = async (values) => {
    if (!editando) return;
    const id = editando.id;
    setEditando(null);
    await editar(id, values);
  };

  return (
    <>
      {error ? (
        <Notice tone="error">
          {error}{" "}
          <button type="button" className={ui.linkBtn} onClick={reintentar}>
            Reintentar
          </button>
        </Notice>
      ) : null}

      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre o código"
            ariaLabel="Buscar facultad"
          />
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={institucionId}
            onChange={(event) => setInstitucionId(event.target.value)}
            aria-label="Filtrar por institución"
          >
            <option value="">Todas las instituciones</option>
            {instituciones.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </div>
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {cargando ? "Cargando…" : `${filas.length} registro${filas.length === 1 ? "" : "s"}`}
        </span>
        <button
          type="button"
          className={ui.btnPrimary}
          disabled={ocupado || cargando}
          onClick={() => setCreando(true)}
        >
          <Plus aria-hidden="true" />
          Crear facultad
        </button>
      </div>

      {filas.length === 0 ? (
        cargando ? null : (
          <EmptyState
            icon={School}
            title={query || institucionId ? "Sin coincidencias" : "Aún no hay facultades"}
            text={
              query || institucionId
                ? "Ajusta la búsqueda o el filtro para ver otros registros."
                : "Crea el primer registro de facultades."
            }
          >
            {query || institucionId ? null : (
              <button
                type="button"
                className={ui.btnPrimary}
                disabled={ocupado}
                onClick={() => setCreando(true)}
              >
                <Plus aria-hidden="true" />
                Crear facultad
              </button>
            )}
          </EmptyState>
        )
      ) : (
        <DataTable
          columns={[
            {
              key: "nombre",
              header: "Facultad",
              render: (row) => <PersonCell name={row.nombre} detail={row.codigo} />,
            },
            {
              key: "institucionId",
              header: "Institución",
              render: (row) => institucionesPorId.get(row.institucionId)?.nombre ?? "—",
            },
            { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
            {
              key: "__actions",
              header: "Acciones",
              align: "right",
              render: (row) => (
                <div>
                  <button
                    type="button"
                    className={ui.linkBtn}
                    aria-label={`Ver detalle de facultad ${row.nombre}`}
                    onClick={() => setDetalle(row)}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`Editar facultad ${row.nombre}`}
                    disabled={ocupado}
                    onClick={() => setEditando(row)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`${row.estado === "Activo" ? "Desactivar" : "Activar"} facultad ${row.nombre}`}
                    disabled={ocupado}
                    onClick={() => cambiarEstado(row)}
                  >
                    <Power aria-hidden="true" />
                  </button>
                </div>
              ),
            },
          ]}
          rows={filas}
        />
      )}

      <p className={ui.cellMuted}>
        Gestiona las facultades de cada institución. Solo se guardan nombre, código e institución;
        la baja se hace desactivando el registro.
      </p>

      <FormModal
        open={creando}
        onClose={() => setCreando(false)}
        title="Nueva facultad"
        sub="Completa los datos para registrar la facultad en el sistema."
        schema={esquema}
        submitLabel="Crear"
        onSubmit={guardarNuevo}
      />

      <FormModal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Editar facultad"
        sub={editando?.nombre}
        schema={esquema}
        seed={editando ?? undefined}
        submitLabel="Guardar cambios"
        onSubmit={guardarEdicion}
      />

      {detalle ? (
        <Drawer open onClose={() => setDetalle(null)} title={detalle.nombre} sub={detalle.codigo}>
          <dl className={ui.defList}>
            <div>
              <dt>Institución</dt>
              <dd>{institucionesPorId.get(detalle.institucionId)?.nombre ?? "—"}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{detalle.codigo || "—"}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{detalle.estado}</dd>
            </div>
          </dl>
          <div className={ui.dialogActions}>
            <button type="button" className={ui.btnSecondary} onClick={() => setDetalle(null)}>
              Cerrar
            </button>
          </div>
        </Drawer>
      ) : null}
    </>
  );
}
