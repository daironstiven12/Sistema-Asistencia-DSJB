/* Gestión de estudiantes: matrícula, estados del ciclo de vida y consulta
   individual. Los estados son los del contrato: ACTIVE, INACTIVE,
   GRADUATED y WITHDRAWN. */

"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import {
  Card,
  ConfirmDialog,
  DataTable,
  Drawer,
  EmptyState,
  FormModal,
  Pill,
  SearchBar,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { estadoLabel, tonoEstado } from "@/features/shared/selectors";
import { COLLECTIONS } from "@/services";
import { opciones } from "@/features/admin/modules/catalog";

const ESTADOS = ["ACTIVE", "INACTIVE", "GRADUATED", "WITHDRAWN"];

export default function EstudiantesPage() {
  const { db, add, edit, createEstudiante, asistenciaEstudiante } = useAcademy();
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const personas = useMemo(() => new Map(db.personas.map((p) => [p.id, p])), [db.personas]);

  const filas = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return db.estudiantes
      .map((e) => ({
        ...e,
        programa: db.programas.find((p) => p.id === e.programaId)?.nombre ?? "—",
        grupo: db.grupos.find((g) => g.id === e.grupoId)?.nombre ?? "—",
        nivel: db.niveles.find((n) => n.id === e.nivelId)?.nombre ?? "—",
      }))
      .filter((e) => {
        if (estado && e.estado !== estado) return false;
        if (!texto) return true;
        return [e.nombre, e.identificacion, e.codigo, e.grupo]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      });
  }, [db, query, estado]);

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Estudiantes"
        sub="Matrícula, estados del ciclo de vida y consulta individual."
        actions={
          <button type="button" className={ui.btnPrimary} onClick={() => setCreando(true)}>
            <Plus aria-hidden="true" />
            Registrar estudiante
          </button>
        }
      />

      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre, identificación, código o grupo"
            ariaLabel="Buscar estudiante"
          />
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {filas.length} de {db.estudiantes.length}
        </span>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Sin estudiantes" text="No hay coincidencias para los filtros aplicados." />
      ) : (
        <DataTable
          columns={[
            {
              key: "nombre",
              header: "Estudiante",
              render: (row) => (
                <div>
                  <b style={{ fontSize: 13.5 }}>{row.nombre}</b>
                  <p className={ui.cellMuted}>
                    {row.identificacion} · Cód. {row.codigo}
                  </p>
                </div>
              ),
            },
            { key: "programa", header: "Programa", muted: true },
            { key: "grupo", header: "Grupo", muted: true },
            { key: "nivel", header: "Nivel", muted: true },
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
              render: (row) => (
                <div>
                  <button type="button" className={ui.linkBtn} onClick={() => setDetalle(row)}>
                    <Eye aria-hidden="true" />
                    Ver
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`Editar ${row.nombre}`}
                    title="Editar"
                    onClick={() => setEditando(row)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  {row.estado !== "GRADUATED" ? (
                    <button
                      type="button"
                      className={ui.btnSm}
                      onClick={() => setConfirm({ row, to: "GRADUATED", label: "Graduar" })}
                    >
                      <Award aria-hidden="true" />
                      Graduar
                    </button>
                  ) : null}
                  {row.estado !== "WITHDRAWN" ? (
                    <button
                      type="button"
                      className={ui.btnSm}
                      onClick={() => setConfirm({ row, to: "WITHDRAWN", label: "Retirar" })}
                    >
                      <UserMinus aria-hidden="true" />
                      Retirar
                    </button>
                  ) : null}
                  {row.estado === "INACTIVE" || row.estado === "WITHDRAWN" ? (
                    <button
                      type="button"
                      className={ui.btnSm}
                      onClick={() => setConfirm({ row, to: "ACTIVE", label: "Activar" })}
                    >
                      <UserPlus aria-hidden="true" />
                      Activar
                    </button>
                  ) : null}
                </div>
              ),
            },
          ]}
          rows={filas}
        />
      )}

      <FormModal
        open={creando}
        onClose={() => setCreando(false)}
        title="Registrar estudiante"
        sub="Se crea la persona y su matrícula."
        schema={{
          sections: [
            {
              title: "Persona",
              fields: [
                { name: "nombre", label: "Nombre completo", required: true, span: "wide" },
                { name: "identificacion", label: "Identificación", required: true },
                { name: "correo", label: "Correo", type: "email", required: true },
                { name: "telefono", label: "Teléfono" },
              ],
            },
            {
              title: "Matrícula",
              fields: [
                { name: "codigo", label: "Código estudiantil", required: true, placeholder: "20231001" },
                {
                  name: "programaId",
                  label: "Programa",
                  type: "select",
                  required: true,
                  options: opciones(db.programas),
                },
                {
                  name: "grupoId",
                  label: "Grupo",
                  type: "select",
                  required: true,
                  options: db.grupos.map((g) => ({ value: g.id, label: `${g.nombre} · ${g.aula}` })),
                },
                {
                  name: "nivelId",
                  label: "Nivel",
                  type: "select",
                  required: true,
                  options: db.niveles.map((n) => ({ value: n.id, label: n.nombre })),
                },
              ],
            },
          ],
        }}
        submitLabel="Registrar estudiante"
        onSubmit={(values) => {
          createEstudiante(
            {
              persona: {
                nombre: values.nombre,
                identificacion: values.identificacion,
                correo: values.correo,
                telefono: values.telefono,
              },
              estudiante: {
                codigo: values.codigo,
                programaId: values.programaId,
                grupoId: values.grupoId,
                nivelId: values.nivelId,
              },
            },
            "admin",
          );
          setCreando(false);
        }}
      />

      <FormModal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Editar estudiante"
        sub={editando?.nombre}
        schema={{
          sections: [
            {
              title: "Estudiante",
              fields: [
                { name: "nombre", label: "Nombre completo", required: true, span: "wide" },
                { name: "identificacion", label: "Identificación", required: true },
                { name: "correo", label: "Correo", type: "email", required: true },
                { name: "telefono", label: "Teléfono" },
                { name: "codigo", label: "Código estudiantil", required: true },
              ],
            },
            {
              title: "Matrícula",
              fields: [
                {
                  name: "programaId",
                  label: "Programa",
                  type: "select",
                  required: true,
                  options: opciones(db.programas),
                },
                {
                  name: "grupoId",
                  label: "Grupo",
                  type: "select",
                  required: true,
                  options: db.grupos.map((g) => ({ value: g.id, label: `${g.nombre} · ${g.aula}` })),
                },
                {
                  name: "nivelId",
                  label: "Nivel",
                  type: "select",
                  required: true,
                  options: db.niveles.map((n) => ({ value: n.id, label: n.nombre })),
                },
              ],
            },
          ],
        }}
        seed={
          editando
            ? {
                nombre: editando.nombre,
                identificacion: editando.identificacion,
                correo: editando.correo,
                telefono: editando.telefono,
                codigo: editando.codigo,
                programaId: editando.programaId,
                grupoId: editando.grupoId,
                nivelId: editando.nivelId,
              }
            : undefined
        }
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.ESTUDIANTES)(
            editando.id,
            {
              nombre: values.nombre,
              identificacion: values.identificacion,
              correo: values.correo,
              telefono: values.telefono,
              codigo: values.codigo,
              programaId: values.programaId,
              grupoId: values.grupoId,
              nivelId: values.nivelId,
            },
            {
              modulo: "Estudiantes",
              accion: "Actualizó",
              entidad: values.nombre,
              descripcion: "Estudiante modificado.",
            },
          );
          setEditando(null);
        }}
      />

      <DetalleDrawer estudiante={detalle} onClose={() => setDetalle(null)} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          edit(COLLECTIONS.ESTUDIANTES)(
            confirm.row.id,
            { estado: confirm.to },
            {
              modulo: "Estudiantes",
              accion: confirm.to,
              entidad: confirm.row.nombre,
              descripcion: `Estudiante pasó a ${confirm.to}.`,
            },
          );
          setConfirm(null);
        }}
        title={`${confirm?.label} estudiante`}
        text={`Se cambiará el estado de "${confirm?.row.nombre}" a ${confirm?.to}.`}
        confirmLabel={confirm?.label ?? "Confirmar"}
        icon={confirm?.to === "GRADUATED" ? Award : confirm?.to === "WITHDRAWN" ? UserMinus : UserPlus}
      />
    </>
  );
}

/* Detalle del estudiante: datos de matrícula y asistencia acumulada. */
function DetalleDrawer({ estudiante, onClose }) {
  const { db } = useAcademy();
  if (!estudiante) return null;

  const asistencia = asistenciaEstudiante(estudiante.id);
  const grupo = db.grupos.find((g) => g.id === estudiante.grupoId);
  const programa = db.programas.find((p) => p.id === estudiante.programaId);

  return (
    <Drawer open onClose={onClose} title={estudiante.nombre} sub={`Cód. ${estudiante.codigo}`}>
      <dl className={ui.defList}>
        <div>
          <dt>Identificación</dt>
          <dd>{estudiante.identificacion}</dd>
        </div>
        <div>
          <dt>Correo</dt>
          <dd>{estudiante.correo}</dd>
        </div>
        <div>
          <dt>Programa</dt>
          <dd>{programa?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Grupo</dt>
          <dd>{grupo?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{estudiante.estado}</dd>
        </div>
      </dl>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>Asistencia acumulada</h3>
      <Card>
        <div className={ui.cardHead}>
          <div>
            <h4 className={ui.eyebrow}>Global</h4>
            <p className={ui.cellMuted}>
              {asistencia.presentes} de {asistencia.total} registros
            </p>
          </div>
          <Pill tone={asistencia.pct >= 75 ? "ok" : "warn"}>{asistencia.pct}%</Pill>
        </div>
        <ul className={ui.riskList}>
          {asistencia.detalle.map((d) => (
            <li key={d.asignaturaId}>
              <div>
                <b>{d.asignatura}</b>
                <span className={ui.cellMuted}>
                  {d.presentes} de {d.total}
                </span>
              </div>
              <Pill tone={d.pct >= 75 ? "ok" : "warn"}>{d.pct}%</Pill>
            </li>
          ))}
        </ul>
      </Card>

      <div className={ui.dialogActions}>
        <button type="button" className={ui.btnSecondary} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Drawer>
  );
}
