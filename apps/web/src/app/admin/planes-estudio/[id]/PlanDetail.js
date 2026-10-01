/* Vista detallada de un plan de estudio: programa, versión, vigencia y la
   jerarquía niveles → asignaturas con su configuración curricular y
   prerrequisitos. */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  FolderTree,
  Link2,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardHead,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FormModal,
  Pill,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { COLLECTIONS } from "@/services";
import { nivelesDePlan, prerrequisitosDe } from "@/features/shared/selectors";
import { opciones, planesConfig } from "@/features/admin/modules/catalog";

export default function PlanDetail({ id }) {
  const { db, add, edit, remove, toggle } = useAcademy();
  const plan = db.planesEstudio.find((p) => p.id === id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [nivelParaAgregar, setNivelParaAgregar] = useState(null);
  const [asignaturaParaPrereq, setAsignaturaParaPrereq] = useState(null);

  const niveles = useMemo(() => (plan ? nivelesDePlan(db, plan.id) : []), [db, plan]);
  const programa = plan ? db.programas.find((p) => p.id === plan.programaId) : null;

  if (!plan) {
    return (
      <>
        <PageHead eyebrow="Planes de estudio" title="Plan no encontrado" />
        <EmptyState
          icon={FolderTree}
          title="Plan inexistente"
          text="El plan que buscas no existe o fue eliminado."
        >
          <Link href="/admin/planes-estudio" className={ui.btnPrimary}>
            <ArrowLeft aria-hidden="true" />
            Volver a planes
          </Link>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Planes de estudio"
        title={plan.nombre}
        sub={`${programa?.nombre ?? "—"} · Versión ${plan.version}`}
        crumbs={["Planes de estudio", plan.codigo]}
        actions={
          <>
            <Link href="/admin/planes-estudio" className={ui.btnSecondary}>
              <ArrowLeft aria-hidden="true" />
              Volver
            </Link>
            <button type="button" className={ui.btnSecondary} onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" />
              Editar
            </button>
            <button
              type="button"
              className={ui.btnSecondary}
              onClick={() =>
                toggle(COLLECTIONS.PLANES)(plan.id, {
                  modulo: "Planes de estudio",
                  accion: plan.estado === "Activo" ? "Desactivó" : "Activó",
                  entidad: plan.nombre,
                  descripcion: "Plan de estudio actualizado.",
                })
              }
            >
              <Power aria-hidden="true" />
              {plan.estado === "Activo" ? "Desactivar" : "Activar"}
            </button>
          </>
        }
      />

      <div className={ui.twoCol}>
        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Datos del plan</h2>
              <p className={ui.cellMuted}>Identificación y vigencia curricular.</p>
            </div>
            <Pill tone="neutral">{plan.estado}</Pill>
          </CardHead>
          <dl className={ui.defList}>
            <div>
              <dt>Programa</dt>
              <dd>{programa?.nombre ?? "—"}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{plan.codigo}</dd>
            </div>
            <div>
              <dt>Versión</dt>
              <dd>{plan.version}</dd>
            </div>
            <div>
              <dt>Vigencia</dt>
              <dd>{plan.vigenciaInicio} a {plan.vigenciaFin}</dd>
            </div>
            <div>
              <dt>Créditos totales</dt>
              <dd>{plan.creditosTotales}</dd>
            </div>
            <div>
              <dt>Asignaturas</dt>
              <dd>{niveles.reduce((acc, n) => acc + n.asignaturas.length, 0)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Estructura</h2>
              <p className={ui.cellMuted}>Niveles y asignaturas del plan.</p>
            </div>
          </CardHead>
          <ul className={ui.riskList}>
            {niveles.map((nivel) => (
              <li key={nivel.id}>
                <div>
                  <b>{nivel.nombre}</b>
                  <span className={ui.cellMuted}>{nivel.asignaturas.length} asignaturas</span>
                </div>
                <Pill tone="info">{nivel.numero}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {niveles.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Plan sin niveles"
          text="Este plan todavía no tiene niveles académicos asociados."
        />
      ) : (
        niveles.map((nivel) => (
          <Card key={nivel.id}>
            <CardHead>
              <div>
                <h2 className={ui.eyebrow}>{nivel.nombre}</h2>
                <p className={ui.cellMuted}>
                  Nivel {nivel.numero} · {nivel.asignaturas.length} asignaturas
                </p>
              </div>
              <button
                type="button"
                className={ui.btnSecondary}
                onClick={() => setNivelParaAgregar(nivel)}
              >
                <Plus aria-hidden="true" />
                Agregar asignatura
              </button>
            </CardHead>

            {nivel.asignaturas.length === 0 ? (
              <p className={ui.cellMuted} style={{ padding: "0 18px 18px" }}>
                Este nivel aún no tiene asignaturas.
              </p>
            ) : (
              <DataTable
                columns={[
                  { key: "codigo", header: "Código", muted: true, nowrap: true },
                  { key: "asignatura", header: "Asignatura" },
                  { key: "creditos", header: "Créditos", align: "right" },
                  {
                    key: "obligatoria",
                    header: "Obligatoria",
                    render: (row) => (
                      <Pill tone={row.obligatoria ? "ok" : "neutral"}>
                        {row.obligatoria ? "Sí" : "No"}
                      </Pill>
                    ),
                  },
                  { key: "posicion", header: "Posición", align: "right", muted: true },
                  {
                    key: "prerrequisitos",
                    header: "Prerrequisitos",
                    align: "right",
                    render: (row) => (
                      <button
                        type="button"
                        className={ui.linkBtn}
                        onClick={() => setAsignaturaParaPrereq(row)}
                      >
                        <Link2 aria-hidden="true" />
                        {prerrequisitosDe(db, row.asignaturaId).length}
                      </button>
                    ),
                  },
                  {
                    key: "__acciones",
                    header: "",
                    align: "right",
                    render: (row) => (
                      <button
                        type="button"
                        className={ui.btnIcon}
                        aria-label={`Quitar ${row.asignatura} del plan`}
                        onClick={() => setConfirmDelete(row)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    ),
                  },
                ]}
                rows={nivel.asignaturas}
              />
            )}
          </Card>
        ))
      )}

      <FormModal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar plan de estudio"
        sub={plan.nombre}
        schema={planesConfig.schema(db)}
        seed={plan}
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.PLANES)(
            plan.id,
            planesConfig.normalize(values, db, plan),
            {
              modulo: "Planes de estudio",
              accion: "Actualizó",
              entidad: plan.nombre,
              descripcion: "Plan de estudio modificado.",
            },
          );
          setEditing(false);
        }}
      />

      <NivelAsignaturaModal
        nivel={nivelParaAgregar}
        onClose={() => setNivelParaAgregar(null)}
        onSave={(values) => {
          add(COLLECTIONS.PLAN_ASIGNATURAS)(
            {
              planId: plan.id,
              nivelId: nivelParaAgregar.id,
              asignaturaId: values.asignaturaId,
              obligatoria: values.obligatoria === "true",
              posicion: Number(values.posicion),
              creditos: Number(values.creditos),
            },
            {
              modulo: "Planes de estudio",
              accion: "Asignó",
              entidad: `${values.asignaturaLabel} · ${nivelParaAgregar.nombre}`,
              descripcion: "Asignatura asociada al nivel del plan.",
            },
          );
          setNivelParaAgregar(null);
        }}
      />

      <PrerrequisitosModal
        asignatura={asignaturaParaPrereq}
        onClose={() => setAsignaturaParaPrereq(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          remove(COLLECTIONS.PLAN_ASIGNATURAS)(confirmDelete.id, {
            modulo: "Planes de estudio",
            accion: "Retiró",
            entidad: `${confirmDelete.asignatura} · ${confirmDelete.codigo}`,
            descripcion: "Asignatura retirada del plan.",
          });
          setConfirmDelete(null);
        }}
        title="Retirar asignatura del plan"
        text={`Se quitará "${confirmDelete?.asignatura}" de este plan. El historial de registros no se afecta.`}
        confirmLabel="Retirar"
        danger
        icon={Trash2}
      />
    </>
  );
}

/* Asociar una asignatura del catálogo a un nivel del plan. */
function NivelAsignaturaModal({ nivel, onClose, onSave }) {
  const { db } = useAcademy();

  const opciones = useMemo(
    () =>
      db.asignaturas
        .filter((a) => a.estado === "Activo")
        .map((a) => ({ value: a.id, label: `${a.codigo} · ${a.nombre}` })),
    [db.asignaturas],
  );

  const yaEnNivel = nivel
    ? db.planAsignaturas.filter((l) => l.nivelId === nivel.id).map((l) => l.asignaturaId)
    : [];

  return (
    <FormModal
      open={Boolean(nivel)}
      onClose={onClose}
      title={`Agregar asignatura · ${nivel?.nombre ?? ""}`}
      sub="La asignatura se asocia a este nivel del plan."
      schema={{
        sections: [
          {
            title: "Asignatura",
            fields: [
              {
                name: "asignaturaId",
                label: "Asignatura",
                type: "select",
                required: true,
                options: opciones.filter((o) => !yaEnNivel.includes(o.value)),
              },
              {
                name: "obligatoria",
                label: "Obligatoria",
                type: "select",
                required: true,
                default: "true",
                options: [
                  { value: "true", label: "Sí" },
                  { value: "false", label: "No" },
                ],
              },
              { name: "creditos", label: "Créditos", type: "number", required: true, default: 3 },
              { name: "posicion", label: "Posición en el nivel", type: "number", required: true, default: 1 },
            ],
          },
        ],
      }}
      submitLabel="Agregar al plan"
      onSubmit={(values) => {
        const seleccion = db.asignaturas.find((a) => a.id === values.asignaturaId);
        onSave({
          ...values,
          asignaturaLabel: `${seleccion?.codigo} · ${seleccion?.nombre}`,
        });
      }}
    />
  );
}

/* Gestionar los prerrequisitos de una asignatura del plan. */
function PrerrequisitosModal({ asignatura, onClose }) {
  const { db, add, remove } = useAcademy();
  const [nuevo, setNuevo] = useState("");

  if (!asignatura) return null;

  const prerrequisitos = prerrequisitosDe(db, asignatura.asignaturaId);
  const candidatos = db.asignaturas.filter(
    (a) =>
      a.id !== asignatura.asignaturaId &&
      !prerrequisitos.some((p) => p.prerrequisitoId === a.id),
  );

  return (
    <FormModal
      open={Boolean(asignatura)}
      onClose={onClose}
      title={`Prerrequisitos · ${asignatura.asignatura}`}
      sub="Asignaturas que se deben haber cursado antes."
      schema={{
        sections: [
          {
            title: "Nuevo prerrequisito",
            fields: [
              {
                name: "prerrequisitoId",
                label: "Prerrequisito",
                type: "select",
                required: true,
                options: candidatos.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.nombre}` })),
              },
            ],
          },
        ],
      }}
      submitLabel="Agregar prerrequisito"
      onSubmit={(values) => {
        add(COLLECTIONS.PRERREQUISITOS)(
          { asignaturaId: asignatura.asignaturaId, prerrequisitoId: values.prerrequisitoId },
          {
            modulo: "Asignaturas",
            accion: "Asignó",
            entidad: `${asignatura.asignatura} · prerrequisito`,
            descripcion: "Prerrequisito asociado a la asignatura.",
          },
        );
        setNuevo("");
      }}
    >
      {prerrequisitos.length === 0 ? (
        <p className={ui.cellMuted}>Esta asignatura no tiene prerrequisitos.</p>
      ) : (
        <ul className={ui.riskList}>
          {prerrequisitos.map((p) => (
            <li key={p.id}>
              <div>
                <b>{p.prerrequisito}</b>
                <span className={ui.cellMuted}>{p.codigo}</span>
              </div>
              <button
                type="button"
                className={ui.btnIcon}
                aria-label={`Eliminar prerrequisito ${p.prerrequisito}`}
                onClick={() =>
                  remove(COLLECTIONS.PRERREQUISITOS)(p.id, {
                    modulo: "Asignaturas",
                    accion: "Retiró",
                    entidad: `${asignatura.asignatura} · ${p.prerrequisito}`,
                    descripcion: "Prerrequisito retirado.",
                  })
                }
              >
                <Trash2 aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </FormModal>
  );
}
