/* Gestión de grupos académicos: crear, editar, cerrar, activar y
   administrar la matrícula (agregar/retirar estudiantes) y el
   representante del grupo por periodo. */

"use client";

import { useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Power,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Card,
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
import { tonoEstado } from "@/features/shared/selectors";
import { COLLECTIONS } from "@/services";
import { opciones } from "@/features/admin/modules/catalog";

export default function GruposPage() {
  const { db, add, edit, toggle } = useAcademy();
  const [query, setQuery] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [agregando, setAgregando] = useState(false);

  const periodoActivo = db.periodos.find((p) => p.estado === "ACTIVE");

  const filas = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return db.grupos
      .map((g) => ({
        ...g,
        programa: db.programas.find((p) => p.id === g.programaId)?.nombre ?? "—",
        nivel: db.niveles.find((n) => n.id === g.nivelId)?.nombre ?? "—",
        periodo: db.periodos.find((p) => p.id === g.periodoId)?.nombre ?? "—",
        matriculados: db.estudiantes.filter((e) => e.grupoId === g.id && e.estado === "ACTIVE").length,
      }))
      .filter((g) =>
        texto
          ? [g.nombre, g.programa, g.aula].join(" ").toLowerCase().includes(texto)
          : true,
      );
  }, [db, query]);

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Grupos"
        sub="Grupos por programa, nivel y periodo con su matrícula y representante."
        actions={
          <button type="button" className={ui.btnPrimary} onClick={() => setCreando(true)}>
            <Plus aria-hidden="true" />
            Nuevo grupo
          </button>
        }
      />

      <div className={ui.toolbar}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar grupo, programa o aula"
          ariaLabel="Buscar grupo"
        />
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {filas.length} de {db.grupos.length}
        </span>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={Users} title="Sin grupos" text="Crea el primer grupo académico.">
          <button type="button" className={ui.btnPrimary} onClick={() => setCreando(true)}>
            Nuevo grupo
          </button>
        </EmptyState>
      ) : (
        <DataTable
          columns={[
            {
              key: "nombre",
              header: "Grupo",
              render: (row) => (
                <div>
                  <b style={{ fontSize: 13.5 }}>{row.nombre}</b>
                  <p className={ui.cellMuted}>
                    {row.programa} · {row.nivel}
                  </p>
                </div>
              ),
            },
            { key: "aula", header: "Aula" },
            { key: "periodo", header: "Periodo", muted: true },
            {
              key: "matriculados",
              header: "Matriculados",
              align: "right",
              render: (row) => `${row.matriculados} / ${row.capacidad}`,
            },
            { key: "estado", header: "Estado", render: (row) => <Pill tone={tonoEstado(row.estado)}>{row.estado}</Pill> },
            {
              key: "__acciones",
              header: "Acciones",
              align: "right",
              render: (row) => (
                <div>
                  <button type="button" className={ui.linkBtn} onClick={() => setDetalle(row)}>
                    <Users aria-hidden="true" />
                    Integrantes
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
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`${row.estado === "Activo" ? "Cerrar" : "Activar"} ${row.nombre}`}
                    title={row.estado === "Activo" ? "Cerrar grupo" : "Activar grupo"}
                    onClick={() =>
                      toggle(COLLECTIONS.GRUPOS)(row.id, {
                        modulo: "Grupos",
                        accion: row.estado === "Activo" ? "Cerró" : "Activó",
                        entidad: row.nombre,
                        descripcion: "Grupo actualizado.",
                      })
                    }
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

      <FormModal
        open={creando}
        onClose={() => setCreando(false)}
        title="Nuevo grupo"
        sub="Queda activo una vez creado."
        schema={{
          sections: [
            {
              title: "Grupo",
              fields: [
                { name: "nombre", label: "Nombre", required: true, placeholder: "VII-A" },
                {
                  name: "programaId",
                  label: "Programa",
                  type: "select",
                  required: true,
                  options: opciones(db.programas),
                },
                {
                  name: "nivelId",
                  label: "Nivel",
                  type: "select",
                  required: true,
                  options: db.niveles.map((n) => ({ value: n.id, label: n.nombre })),
                },
                {
                  name: "periodoId",
                  label: "Periodo",
                  type: "select",
                  required: true,
                  options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
                },
              ],
            },
            {
              title: "Aula y capacidad",
              fields: [
                { name: "aula", label: "Aula", required: true, placeholder: "Aula 204" },
                {
                  name: "capacidad",
                  label: "Capacidad",
                  type: "number",
                  required: true,
                  default: 35,
                  validate: (value) => (Number(value) > 0 ? null : "La capacidad debe ser mayor que cero."),
                },
              ],
            },
          ],
        }}
        submitLabel="Crear grupo"
        onSubmit={(values) => {
          add(COLLECTIONS.GRUPOS)(
            {
              nombre: values.nombre?.toUpperCase() ?? "",
              programaId: values.programaId,
              nivelId: values.nivelId,
              periodoId: values.periodoId,
              aula: values.aula,
              capacidad: Number(values.capacidad),
              estado: "Activo",
            },
            {
              modulo: "Grupos",
              accion: "Creó",
              entidad: values.nombre,
              descripcion: "Grupo académico creado.",
            },
          );
          setCreando(false);
        }}
      />

      <FormModal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Editar grupo"
        sub={editando?.nombre}
        schema={{
          sections: [
            {
              title: "Grupo",
              fields: [
                { name: "nombre", label: "Nombre", required: true },
                {
                  name: "programaId",
                  label: "Programa",
                  type: "select",
                  required: true,
                  options: opciones(db.programas),
                },
                {
                  name: "nivelId",
                  label: "Nivel",
                  type: "select",
                  required: true,
                  options: db.niveles.map((n) => ({ value: n.id, label: n.nombre })),
                },
                {
                  name: "periodoId",
                  label: "Periodo",
                  type: "select",
                  required: true,
                  options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
                },
              ],
            },
            {
              title: "Aula y capacidad",
              fields: [
                { name: "aula", label: "Aula", required: true },
                { name: "capacidad", label: "Capacidad", type: "number", required: true, default: 35 },
              ],
            },
          ],
        }}
        seed={editando}
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.GRUPOS)(
            editando.id,
            {
              nombre: values.nombre?.toUpperCase() ?? "",
              programaId: values.programaId,
              nivelId: values.nivelId,
              periodoId: values.periodoId,
              aula: values.aula,
              capacidad: Number(values.capacidad),
            },
            {
              modulo: "Grupos",
              accion: "Actualizó",
              entidad: values.nombre,
              descripcion: "Grupo académico modificado.",
            },
          );
          setEditando(null);
        }}
      />

      <DetalleDrawer
        grupo={detalle}
        periodoActivo={periodoActivo}
        onClose={() => setDetalle(null)}
        onAgregar={() => setAgregando(true)}
        onRetirar={(e) =>
          edit(COLLECTIONS.ESTUDIANTES)(
            e.id,
            { grupoId: null },
            {
              modulo: "Grupos",
              accion: "Retiró",
              entidad: `${e.nombre} · ${detalle?.nombre}`,
              descripcion: "Estudiante retirado del grupo.",
            },
          )
        }
        onAsignarRepresentante={(values) => {
          add(COLLECTIONS.REPRESENTATIVE_ASSIGNMENTS)(
            {
              representanteId: values.representanteId,
              grupoId: detalle.id,
              periodoId: values.periodoId,
              estado: "Activa",
            },
            {
              modulo: "Grupos",
              accion: "Asignó",
              entidad: `${detalle.nombre} · representante`,
              descripcion: "Representante asignado al grupo.",
            },
          );
          setDetalle(null);
        }}
      />

      <AgregarEstudianteModal
        open={agregando}
        grupo={detalle}
        onClose={() => setAgregando(false)}
        onSave={(estudianteId) => {
          edit(COLLECTIONS.ESTUDIANTES)(
            estudianteId,
            { grupoId: detalle.id },
            {
              modulo: "Grupos",
              accion: "Agregó",
              entidad: `${detalle.nombre} · estudiante`,
              descripcion: "Estudiante agregado al grupo.",
            },
          );
          setAgregando(false);
        }}
      />
    </>
  );
}

/* Detalle del grupo: integrantes y representante. */
function DetalleDrawer({ grupo, periodoActivo, onClose, onAgregar, onRetirar, onAsignarRepresentante }) {
  const { db } = useAcademy();
  if (!grupo) return null;

  const integrantes = db.estudiantes.filter((e) => e.grupoId === grupo.id);
  const programa = db.programas.find((p) => p.id === grupo.programaId);
  const asignacion = db.representativeAssignments.find(
    (a) => a.grupoId === grupo.id && a.periodoId === grupo.periodoId && a.estado === "Activa",
  );
  const representante = asignacion
    ? db.representantes.find((r) => r.id === asignacion.representanteId)
    : null;

  return (
    <Drawer open onClose={onClose} title={`Grupo ${grupo.nombre}`} sub={programa?.nombre ?? ""}>
      <dl className={ui.defList}>
        <div>
          <dt>Programa</dt>
          <dd>{programa?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Nivel</dt>
          <dd>{db.niveles.find((n) => n.id === grupo.nivelId)?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Periodo</dt>
          <dd>{db.periodos.find((p) => p.id === grupo.periodoId)?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Aula</dt>
          <dd>{grupo.aula}</dd>
        </div>
        <div>
          <dt>Capacidad</dt>
          <dd>
            {integrantes.filter((e) => e.estado === "ACTIVE").length} / {grupo.capacidad}
          </dd>
        </div>
      </dl>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>
        Integrantes ({integrantes.length})
      </h3>
      {integrantes.length === 0 ? (
        <p className={ui.cellMuted}>Sin estudiantes matriculados.</p>
      ) : (
        <ul className={ui.riskList}>
          {integrantes.map((e) => (
            <li key={e.id}>
              <div>
                <b>{e.nombre}</b>
                <span className={ui.cellMuted}>
                  {e.identificacion} · {e.estado}
                </span>
              </div>
              <button
                type="button"
                className={ui.btnIcon}
                aria-label={`Retirar a ${e.nombre}`}
                onClick={() => onRetirar(e)}
              >
                <UserMinus aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className={ui.btnSecondary} style={{ marginTop: 10 }} onClick={onAgregar}>
        <UserPlus aria-hidden="true" />
        Agregar estudiante
      </button>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>Representante</h3>
      {representante ? (
        <Card>
          <div className={ui.cardHead}>
            <div>
              <h4 className={ui.eyebrow}>{representante.nombre}</h4>
              <p className={ui.cellMuted}>
                {representante.parentesco} · {db.periodos.find((p) => p.id === grupo.periodoId)?.nombre}
              </p>
            </div>
            <Pill tone="ok">Asignado</Pill>
          </div>
          <AsignarRepresentanteForm
            grupo={grupo}
            periodoActivo={periodoActivo}
            onSave={onAsignarRepresentante}
            label="Cambiar representante"
          />
        </Card>
      ) : (
        <Card>
          <div className={ui.cardHead}>
            <div>
              <h4 className={ui.eyebrow}>Sin representante</h4>
              <p className={ui.cellMuted}>Asigna un representante para este grupo y periodo.</p>
            </div>
          </div>
          <AsignarRepresentanteForm
            grupo={grupo}
            periodoActivo={periodoActivo}
            onSave={onAsignarRepresentante}
            label="Asignar representante"
          />
        </Card>
      )}

      <div className={ui.dialogActions}>
        <button type="button" className={ui.btnSecondary} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Drawer>
  );
}

/* Formulario de asignación de representante dentro del detalle. */
function AsignarRepresentanteForm({ grupo, periodoActivo, onSave, label }) {
  const { db } = useAcademy();
  const [values, setValues] = useState({
    representanteId: "",
    periodoId: grupo.periodoId ?? periodoActivo?.id ?? "",
  });

  const disponibles = db.representantes.filter((r) => r.estado === "Activo");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!values.representanteId) return;
        onSave(values);
      }}
    >
      <div className={ui.fieldGrid}>
        <label className={ui.field}>
          <span>
            Representante <span className={ui.req}>*</span>
          </span>
          <select
            className={ui.select}
            value={values.representanteId}
            onChange={(event) => setValues((p) => ({ ...p, representanteId: event.target.value }))}
            required
          >
            <option value="">Selecciona</option>
            {disponibles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} · {r.parentesco}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          <span>Periodo</span>
          <select
            className={ui.select}
            value={values.periodoId}
            onChange={(event) => setValues((p) => ({ ...p, periodoId: event.target.value }))}
          >
            {db.periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className={ui.btnPrimary} style={{ marginTop: 10 }}>
        {label}
      </button>
    </form>
  );
}

/* Agregar un estudiante existente al grupo. */
function AgregarEstudianteModal({ open, grupo, onClose, onSave }) {
  const { db } = useAcademy();
  const candidatos = db.estudiantes.filter(
    (e) => e.estado === "ACTIVE" && e.grupoId !== grupo?.id,
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Agregar estudiante"
      sub={grupo ? `Grupo ${grupo.nombre}` : ""}
      schema={{
        sections: [
          {
            title: "Estudiante",
            fields: [
              {
                name: "estudianteId",
                label: "Estudiante",
                type: "select",
                required: true,
                options: candidatos.map((e) => ({
                  value: e.id,
                  label: `${e.nombre} · ${e.identificacion}`,
                })),
              },
            ],
          },
        ],
      }}
      submitLabel="Agregar al grupo"
      onSubmit={(values) => {
        onSave(values.estudianteId);
      }}
    />
  );
}
