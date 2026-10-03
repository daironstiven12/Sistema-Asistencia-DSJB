/* Gestión de Instituciones contra la API real.
   Reutiliza los primitivos visuales globales (DataTable, FormModal,
   SearchBar, Pill, Card) sin el motor mock (CrudModule/AcademyProvider).
   Solo campos reales del backend: nombre y código. Sin botón Eliminar:
   la baja es desactivación (PATCH …/status → INACTIVE). */

"use client";

import { useState } from "react";
import { Building2, Pencil, Plus, Power } from "lucide-react";
import { Card, CardHead, DataTable, EmptyState, FormModal, Notice, PersonCell, Pill, SearchBar, ui } from "@/components/ui";
import { useInstitutionsApi } from "./useInstitutionsApi";

const SCHEMA = {
  sections: [
    {
      title: "Identificación",
      fields: [
        { name: "nombre", label: "Nombre", required: true, span: "wide" },
        { name: "codigo", label: "Código", placeholder: "UTCH" },
      ],
    },
  ],
};

export default function InstitutionsManager() {
  const { filas, cargando, error, query, setQuery, ocupado, reintentar, crear, editar, cambiarEstado } =
    useInstitutionsApi();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);

  const activa = filas.find((i) => i.estado === "Activo") ?? filas[0] ?? null;

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

      {activa ? (
        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Institución activa</h2>
              <p className={ui.cellMuted}>Registro vigente en la plataforma.</p>
            </div>
            <Pill tone="ok">{activa.estado}</Pill>
          </CardHead>
          <dl className={ui.defList}>
            <div>
              <dt>Nombre</dt>
              <dd>{activa.nombre}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{activa.codigo || "—"}</dd>
            </div>
          </dl>
        </Card>
      ) : cargando ? null : (
        <Notice tone="warn" icon={Building2}>
          No hay ninguna institución registrada. Crea la primera para que actas y reportes tengan
          encabezado institucional.
        </Notice>
      )}

      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre o código"
            ariaLabel="Buscar institución"
          />
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
          Crear institución
        </button>
      </div>

      {filas.length === 0 ? (
        cargando ? null : (
          <EmptyState
            icon={Building2}
            title={query ? "Sin coincidencias" : "Aún no hay instituciones"}
            text={
              query
                ? "Ajusta la búsqueda para ver otros registros."
                : "Crea el primer registro de instituciones."
            }
          >
            {query ? null : (
              <button
                type="button"
                className={ui.btnPrimary}
                disabled={ocupado}
                onClick={() => setCreando(true)}
              >
                <Plus aria-hidden="true" />
                Crear institución
              </button>
            )}
          </EmptyState>
        )
      ) : (
        <DataTable
          columns={[
            {
              key: "nombre",
              header: "Institución",
              render: (row) => <PersonCell name={row.nombre} detail={row.codigo} />,
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
                    className={ui.btnIcon}
                    aria-label={`Editar institución ${row.nombre}`}
                    disabled={ocupado}
                    onClick={() => setEditando(row)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`${row.estado === "Activo" ? "Desactivar" : "Activar"} institución ${row.nombre}`}
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
        Gestiona el registro institucional. Solo se guardan nombre y código; la baja se hace
        desactivando el registro.
      </p>

      <FormModal
        open={creando}
        onClose={() => setCreando(false)}
        title="Nueva institución"
        sub="Completa los datos para registrar la institución en el sistema."
        schema={SCHEMA}
        submitLabel="Crear"
        onSubmit={guardarNuevo}
      />

      <FormModal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Editar institución"
        sub={editando?.nombre}
        schema={SCHEMA}
        seed={editando ?? undefined}
        submitLabel="Guardar cambios"
        onSubmit={guardarEdicion}
      />
    </>
  );
}
