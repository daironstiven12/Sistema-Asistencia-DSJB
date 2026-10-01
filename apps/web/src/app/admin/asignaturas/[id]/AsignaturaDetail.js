/* Detalle de una asignatura: datos del catálogo, intensidad horaria,
   planes en los que participa y gestión de prerrequisitos. */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
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
  EmptyState,
  FormModal,
  Pill,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { COLLECTIONS } from "@/services";
import { prerrequisitosDe } from "@/features/shared/selectors";
import { asignaturasConfig } from "@/features/admin/modules/catalog";

export default function AsignaturaDetail({ id }) {
  const { db, add, edit, remove, toggle } = useAcademy();
  const asignatura = db.asignaturas.find((a) => a.id === id);
  const [editing, setEditing] = useState(false);
  const [prereq, setPrereq] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const prerrequisitos = useMemo(
    () => (asignatura ? prerrequisitosDe(db, asignatura.id) : []),
    [db, asignatura],
  );
  const planes = useMemo(
    () =>
      asignatura
        ? db.planAsignaturas
            .filter((l) => l.asignaturaId === asignatura.id)
            .map((l) => ({
              ...l,
              plan: db.planesEstudio.find((p) => p.id === l.planId)?.nombre ?? "—",
              nivel: db.niveles.find((n) => n.id === l.nivelId)?.nombre ?? "—",
            }))
        : [],
    [db, asignatura],
  );

  if (!asignatura) {
    return (
      <>
        <PageHead eyebrow="Asignaturas" title="Asignatura no encontrada" />
        <EmptyState
          icon={BookMarked}
          title="Asignatura inexistente"
          text="La asignatura que buscas no existe o fue eliminada."
        >
          <Link href="/admin/asignaturas" className={ui.btnPrimary}>
            <ArrowLeft aria-hidden="true" />
            Volver a asignaturas
          </Link>
        </EmptyState>
      </>
    );
  }

  const candidatos = db.asignaturas.filter(
    (a) => a.id !== asignatura.id && !prerrequisitos.some((p) => p.prerrequisitoId === a.id),
  );

  return (
    <>
      <PageHead
        eyebrow="Asignaturas"
        title={asignatura.nombre}
        sub={`${asignatura.codigo} · ${asignatura.creditos} créditos`}
        crumbs={["Asignaturas", asignatura.codigo]}
        actions={
          <>
            <Link href="/admin/asignaturas" className={ui.btnSecondary}>
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
                toggle(COLLECTIONS.ASIGNATURAS)(asignatura.id, {
                  modulo: "Asignaturas",
                  accion: asignatura.estado === "Activo" ? "Desactivó" : "Activó",
                  entidad: asignatura.nombre,
                  descripcion: "Asignatura actualizada.",
                })
              }
            >
              <Power aria-hidden="true" />
              {asignatura.estado === "Activo" ? "Desactivar" : "Activar"}
            </button>
          </>
        }
      />

      <div className={ui.twoCol}>
        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Datos del catálogo</h2>
              <p className={ui.cellMuted}>Identificación y tipo.</p>
            </div>
            <Pill tone="info">{asignatura.tipo}</Pill>
          </CardHead>
          <dl className={ui.defList}>
            <div>
              <dt>Nombre</dt>
              <dd>{asignatura.nombre}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{asignatura.codigo}</dd>
            </div>
            <div>
              <dt>Créditos</dt>
              <dd>{asignatura.creditos}</dd>
            </div>
            <div>
              <dt>Descripción</dt>
              <dd>{asignatura.descripcion || "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Intensidad horaria</h2>
              <p className={ui.cellMuted}>Distribución semanal de horas.</p>
            </div>
          </CardHead>
          <dl className={ui.defList}>
            <div>
              <dt>Horas teóricas</dt>
              <dd>{asignatura.horasTeoricas}</dd>
            </div>
            <div>
              <dt>Horas prácticas</dt>
              <dd>{asignatura.horasPracticas}</dd>
            </div>
            <div>
              <dt>Horas independientes</dt>
              <dd>{asignatura.horasIndependientes}</dd>
            </div>
            <div>
              <dt>Total semanal</dt>
              <dd>
                {asignatura.horasTeoricas + asignatura.horasPracticas + asignatura.horasIndependientes}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <CardHead>
          <div>
            <h2 className={ui.eyebrow}>Prerrequisitos</h2>
            <p className={ui.cellMuted}>
              Asignaturas que se deben haber cursado antes de esta.
            </p>
          </div>
          <button type="button" className={ui.btnSecondary} onClick={() => setPrereq(true)}>
            <Plus aria-hidden="true" />
            Agregar prerrequisito
          </button>
        </CardHead>

        {prerrequisitos.length === 0 ? (
          <p className={ui.cellMuted} style={{ padding: "0 18px 18px" }}>
            Esta asignatura no tiene prerrequisitos.
          </p>
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
                  onClick={() => setConfirmDelete(p)}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHead>
          <div>
            <h2 className={ui.eyebrow}>Planes de estudio</h2>
            <p className={ui.cellMuted}>En los que participa esta asignatura.</p>
          </div>
        </CardHead>
        {planes.length === 0 ? (
          <p className={ui.cellMuted} style={{ padding: "0 18px 18px" }}>
            Aún no está asociada a ningún plan.
          </p>
        ) : (
          <ul className={ui.riskList}>
            {planes.map((p) => (
              <li key={p.id}>
                <div>
                  <b>{p.plan}</b>
                  <span className={ui.cellMuted}>
                    {p.nivel} · {p.obligatoria ? "Obligatoria" : "Electiva"} · {p.creditos} créditos
                  </span>
                </div>
                <Pill tone="neutral">Pos. {p.posicion}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <FormModal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar asignatura"
        sub={asignatura.nombre}
        schema={asignaturasConfig.schema(db)}
        seed={asignatura}
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.ASIGNATURAS)(
            asignatura.id,
            asignaturasConfig.normalize(values, db, asignatura),
            {
              modulo: "Asignaturas",
              accion: "Actualizó",
              entidad: asignatura.nombre,
              descripcion: "Asignatura modificada.",
            },
          );
          setEditing(false);
        }}
      />

      <FormModal
        open={prereq}
        onClose={() => setPrereq(false)}
        title="Agregar prerrequisito"
        sub={asignatura.nombre}
        schema={{
          sections: [
            {
              title: "Prerrequisito",
              fields: [
                {
                  name: "prerrequisitoId",
                  label: "Asignatura prerrequisito",
                  type: "select",
                  required: true,
                  options: candidatos.map((a) => ({
                    value: a.id,
                    label: `${a.codigo} · ${a.nombre}`,
                  })),
                },
              ],
            },
          ],
        }}
        submitLabel="Agregar"
        onSubmit={(values) => {
          add(COLLECTIONS.PRERREQUISITOS)(
            { asignaturaId: asignatura.id, prerrequisitoId: values.prerrequisitoId },
            {
              modulo: "Asignaturas",
              accion: "Asignó",
              entidad: `${asignatura.nombre} · prerrequisito`,
              descripcion: "Prerrequisito asociado a la asignatura.",
            },
          );
          setPrereq(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          remove(COLLECTIONS.PRERREQUISITOS)(confirmDelete.id, {
            modulo: "Asignaturas",
            accion: "Retiró",
            entidad: `${asignatura.nombre} · ${confirmDelete.prerrequisito}`,
            descripcion: "Prerrequisito retirado.",
          });
          setConfirmDelete(null);
        }}
        title="Eliminar prerrequisito"
        text={`Se quitará "${confirmDelete?.prerrequisito}" como prerrequisito de ${asignatura.nombre}.`}
        confirmLabel="Eliminar"
        danger
        icon={Trash2}
      />
    </>
  );
}
