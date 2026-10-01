/* Periodos académicos: gestión con máquina de estados propia
   (PLANNED → ACTIVE → CLOSED). El administrador crea, edita, activa,
   cierra y revisa la planificación de cada periodo. */

"use client";

import { useMemo, useState } from "react";
import { CalendarRange, CheckCircle2, Pencil, Play, Lock } from "lucide-react";
import {
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FormModal,
  Modal,
  Notice,
  Pill,
  SearchBar,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { estadoLabel, tonoEstado } from "@/features/shared/selectors";
import { periodosConfig } from "@/features/admin/modules/catalog";

const SIGUIENTE = {
  PLANNED: { to: "ACTIVE", label: "Activar" },
  ACTIVE: { to: "CLOSED", label: "Cerrar" },
  CLOSED: null,
};

export default function PeriodosPage() {
  const { db, add, edit, transitionPeriodo } = useAcademy();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [planificacion, setPlanificacion] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const filas = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return db.periodos
      .filter((p) => (texto ? p.nombre.toLowerCase().includes(texto) : true))
      .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
  }, [db.periodos, query]);

  const activo = db.periodos.find((p) => p.estado === "ACTIVE");

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Periodos académicos"
        sub="Ciclos que delimitan la vigencia de grupos, ofertas y sesiones."
        actions={
          <button type="button" className={ui.btnPrimary} onClick={() => setCreating(true)}>
            <CalendarRange aria-hidden="true" />
            Nuevo periodo
          </button>
        }
      />

      {activo ? (
        <Notice tone="info" icon={CalendarRange}>
          Periodo vigente: <b>{activo.nombre}</b> · {activo.fechaInicio} a {activo.fechaFin}.
        </Notice>
      ) : (
        <Notice tone="warn" icon={CalendarRange}>
          No hay ningún periodo activo. Activa uno para que grupos y sesiones operen con normalidad.
        </Notice>
      )}

      <div className={ui.toolbar}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar periodo"
          ariaLabel="Buscar periodo"
        />
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {filas.length} de {db.periodos.length}
        </span>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={CalendarRange} title="Sin periodos" text="Crea el primer periodo académico.">
          <button type="button" className={ui.btnPrimary} onClick={() => setCreating(true)}>
            Nuevo periodo
          </button>
        </EmptyState>
      ) : (
        <DataTable
          columns={[
            { key: "nombre", header: "Periodo", render: (row) => <b style={{ fontVariantNumeric: "tabular-nums" }}>{row.nombre}</b> },
            { key: "anio", header: "Año", muted: true },
            { key: "periodo", header: "Ciclo", muted: true },
            { key: "fechaInicio", header: "Inicio", nowrap: true },
            { key: "fechaFin", header: "Fin", nowrap: true },
            {
              key: "grupos",
              header: "Grupos",
              align: "right",
              render: (row) => db.grupos.filter((g) => g.periodoId === row.id).length,
            },
            {
              key: "sesiones",
              header: "Sesiones",
              align: "right",
              render: (row) => db.sessions.filter((s) => s.periodoId === row.id).length,
            },
            {
              key: "estado",
              header: "Estado",
              render: (row) => (
                <Pill tone={tonoEstado(row.estado)}>{estadoLabel(row.estado)}</Pill>
              ),
            },
            {
              key: "__acciones",
              header: "Acciones",
              align: "right",
              render: (row) => {
                const siguiente = SIGUIENTE[row.estado];
                return (
                  <div>
                    <button
                      type="button"
                      className={ui.linkBtn}
                      onClick={() => setPlanificacion(row)}
                    >
                      <CalendarRange aria-hidden="true" />
                      Planificar
                    </button>
                    <button
                      type="button"
                      className={ui.btnIcon}
                      aria-label={`Editar ${row.nombre}`}
                      title="Editar"
                      onClick={() => setEditing(row)}
                    >
                      <Pencil aria-hidden="true" />
                    </button>
                    {siguiente ? (
                      <button
                        type="button"
                        className={ui.btnSm}
                        onClick={() =>
                          setConfirm({
                            row,
                            to: siguiente.to,
                            label: siguiente.label,
                          })
                        }
                      >
                        {siguiente.to === "ACTIVE" ? (
                          <Play aria-hidden="true" />
                        ) : (
                          <Lock aria-hidden="true" />
                        )}
                        {siguiente.label}
                      </button>
                    ) : (
                      <span className={ui.cellMuted}>
                        <CheckCircle2 aria-hidden="true" style={{ width: 12, height: 12 }} />
                        Cerrado
                      </span>
                    )}
                  </div>
                );
              },
            },
          ]}
          rows={filas}
        />
      )}

      <FormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo periodo"
        sub="Queda en estado planificado hasta que lo actives."
        schema={periodosConfig.schema(db)}
        submitLabel="Crear periodo"
        onSubmit={(values) => {
          add(COLLECTIONS.PERIODOS)(
            periodosConfig.normalize(values),
            {
              modulo: "Periodos",
              accion: "Creó",
              entidad: values.nombre,
              descripcion: "Periodo académico creado.",
            },
          );
          setCreating(false);
        }}
      />

      <FormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar periodo"
        sub={editing?.nombre}
        schema={periodosConfig.schema(db)}
        seed={editing}
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.PERIODOS)(
            editing.id,
            periodosConfig.normalize(values),
            {
              modulo: "Periodos",
              accion: "Actualizó",
              entidad: values.nombre,
              descripcion: "Periodo académico modificado.",
            },
          );
          setEditing(null);
        }}
      />

      <PlanificacionModal periodo={planificacion} onClose={() => setPlanificacion(null)} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          transitionPeriodo(confirm.row.id, confirm.to, "admin");
          setConfirm(null);
        }}
        title={`${confirm?.label} periodo`}
        text={
          confirm?.to === "ACTIVE"
            ? `Se activará "${confirm?.row.nombre}". Los grupos y ofertas asociadas podrán operar en este periodo.`
            : `Se cerrará "${confirm?.row.nombre}". Ya no se podrán crear nuevas sesiones en este periodo.`
        }
        confirmLabel={confirm?.label ?? "Confirmar"}
        icon={confirm?.to === "ACTIVE" ? Play : Lock}
      />
    </>
  );
}

/* Planificación del periodo: grupos, ofertas y sesiones previstas. */
function PlanificacionModal({ periodo, onClose }) {
  const { db } = useAcademy();

  if (!periodo) return null;

  const grupos = db.grupos.filter((g) => g.periodoId === periodo.id);
  const ofertas = db.offerings.filter((o) => o.periodoId === periodo.id);
  const sesiones = db.sessions.filter((s) => s.periodoId === periodo.id);

  return (
    <Modal open onClose={onClose} title={`Planificación · ${periodo.nombre}`} sub={`${periodo.fechaInicio} a ${periodo.fechaFin} · ${periodo.estado}`} wide>
      <div className={ui.twoCol}>
        <Card>
          <div className={ui.cardHead}>
            <h3 className={ui.eyebrow}>Grupos</h3>
          </div>
          {grupos.length === 0 ? (
            <p className={ui.cellMuted} style={{ padding: "0 18px 18px" }}>Sin grupos.</p>
          ) : (
            <ul className={ui.riskList}>
              {grupos.map((g) => (
                <li key={g.id}>
                  <div>
                    <b>{g.nombre}</b>
                    <span className={ui.cellMuted}>{g.aula}</span>
                  </div>
                  <Pill tone="neutral">{db.estudiantes.filter((e) => e.grupoId === g.id).length}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className={ui.cardHead}>
            <h3 className={ui.eyebrow}>Ofertas</h3>
          </div>
          {ofertas.length === 0 ? (
            <p className={ui.cellMuted} style={{ padding: "0 18px 18px" }}>Sin ofertas.</p>
          ) : (
            <ul className={ui.riskList}>
              {ofertas.map((o) => (
                <li key={o.id}>
                  <div>
                    <b>{db.asignaturas.find((a) => a.id === o.asignaturaId)?.nombre ?? "—"}</b>
                    <span className={ui.cellMuted}>
                      {db.grupos.find((g) => g.id === o.grupoId)?.nombre ?? "—"} · {o.horario}
                    </span>
                  </div>
                  <Pill tone="neutral">{o.estado}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className={ui.cellMuted} style={{ marginTop: 12 }}>
        {sesiones.length} sesiones registradas en este periodo.
      </p>
    </Modal>
  );
}
