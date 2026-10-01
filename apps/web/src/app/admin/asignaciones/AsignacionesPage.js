/* Asignaciones académicas: oferta, docentes y representatives. La oferta
   es la materia abierta en un grupo y periodo; el docente y el
   representante se asignan por separado. Cada pestaña gestiona su
   entidad con sus propias reglas. */

"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ListChecks,
  Lock,
  Pencil,
  Play,
  Plus,
  Power,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  DataTable,
  EmptyState,
  FormModal,
  Notice,
  Pill,
  SearchBar,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { estadoLabel, tonoEstado } from "@/features/shared/selectors";
import { COLLECTIONS } from "@/services";
import { opciones, periodoActivo } from "@/features/admin/modules/catalog";

const TABS = [
  { key: "oferta", label: "Oferta académica", icon: ListChecks },
  { key: "docentes", label: "Docentes", icon: UserCheck },
  { key: "representantes", label: "Representantes", icon: Users },
];

const SIGUIENTE_OFERTA = {
  PLANNED: [
    { to: "ACTIVE", label: "Activar" },
    { to: "CANCELLED", label: "Cancelar" },
  ],
  ACTIVE: [
    { to: "CLOSED", label: "Cerrar" },
    { to: "CANCELLED", label: "Cancelar" },
  ],
  CLOSED: [],
  CANCELLED: [],
};

export default function AsignacionesPage() {
  const [tab, setTab] = useState("oferta");

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Asignaciones académicas"
        sub="Oferta de materias, docentes y representantes por grupo y periodo."
      />

      <div className={ui.filterBar} style={{ marginBottom: 16 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={ui.btnSecondary}
            style={tab === key ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === "oferta" ? <OfertaTab /> : null}
      {tab === "docentes" ? <DocentesTab /> : null}
      {tab === "representantes" ? <RepresentantesTab /> : null}
    </>
  );
}

/* ── Oferta académica ─────────────────────────────────────── */
function OfertaTab() {
  const { db, createTeachingAssignment, transitionOffering } = useAcademy();
  const [query, setQuery] = useState("");
  const [creando, setCreando] = useState(false);
  const periodo = periodoActivo(db);

  const filas = useMemo(() => {
    const idx = {
      asignatura: new Map(db.asignaturas.map((a) => [a.id, a])),
      grupo: new Map(db.grupos.map((g) => [g.id, g])),
      docente: new Map(db.docentes.map((d) => [d.id, d])),
      periodo: new Map(db.periodos.map((p) => [p.id, p])),
    };
    const texto = query.trim().toLowerCase();
    return db.offerings
      .map((o) => ({
        ...o,
        asignatura: idx.asignatura.get(o.asignaturaId)?.nombre ?? "—",
        grupo: idx.grupo.get(o.grupoId)?.nombre ?? "—",
        docente: idx.docente.get(o.docenteId)?.nombre ?? "—",
        periodo: idx.periodo.get(o.periodoId)?.nombre ?? "—",
      }))
      .filter((o) =>
        texto
          ? [o.asignatura, o.grupo, o.docente].join(" ").toLowerCase().includes(texto)
          : true,
      );
  }, [db.offerings, db.asignaturas, db.grupos, db.docentes, db.periodos, query]);

  return (
    <>
      <div className={ui.toolbar}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar por asignatura, grupo o docente"
          ariaLabel="Buscar oferta"
        />
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {filas.length} de {db.offerings.length}
        </span>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={ListChecks} title="Sin ofertas" text="Crea la primera oferta académica.">
          <button type="button" className={ui.btnPrimary} onClick={() => setCreando(true)}>
            Nueva oferta
          </button>
        </EmptyState>
      ) : (
        <DataTable
          columns={[
            { key: "asignatura", header: "Asignatura" },
            { key: "grupo", header: "Grupo", muted: true },
            { key: "docente", header: "Docente", muted: true },
            { key: "periodo", header: "Periodo", muted: true },
            { key: "horario", header: "Horario", muted: true, nowrap: true },
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
                  {SIGUIENTE_OFERTA[row.estado]?.map((accion) => {
                    const Icono =
                      accion.to === "ACTIVE" ? Play : accion.to === "CLOSED" ? Lock : XCircle;
                    return (
                      <button
                        key={accion.to}
                        type="button"
                        className={ui.btnSm}
                        title={`${accion.label} la oferta`}
                        onClick={() => transitionOffering(row.id, accion.to, "admin")}
                      >
                        <Icono aria-hidden="true" />
                        {accion.label}
                      </button>
                    );
                  })}
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
        title="Nueva oferta académica"
        sub={periodo ? `Se aplicará al periodo ${periodo.nombre}.` : undefined}
        schema={{
          sections: [
            {
              title: "Oferta",
              fields: [
                {
                  name: "asignaturaId",
                  label: "Asignatura",
                  type: "select",
                  required: true,
                  options: opciones(db.asignaturas.filter((a) => a.estado === "Activo")),
                },
                {
                  name: "grupoId",
                  label: "Grupo",
                  type: "select",
                  required: true,
                  options: db.grupos
                    .filter((g) => g.estado === "Activo" && g.periodoId === periodo?.id)
                    .map((g) => ({ value: g.id, label: `${g.nombre} · ${g.aula}` })),
                },
                {
                  name: "docenteId",
                  label: "Docente",
                  type: "select",
                  required: true,
                  options: db.docentes
                    .filter((d) => d.estado === "Activo")
                    .map((d) => ({ value: d.id, label: `${d.nombre} · ${d.profesion}` })),
                },
                {
                  name: "periodoId",
                  label: "Periodo",
                  type: "select",
                  required: true,
                  default: periodo?.id ?? "",
                  options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
                },
                {
                  name: "horario",
                  label: "Horario",
                  required: true,
                  span: "wide",
                  placeholder: "L-V 14:00-16:00",
                },
              ],
            },
          ],
        }}
        submitLabel="Crear oferta"
        onSubmit={(values) => {
          createTeachingAssignment({
            docenteId: values.docenteId,
            asignaturaId: values.asignaturaId,
            grupoId: values.grupoId,
            periodoId: values.periodoId,
            horario: values.horario,
          });
          setCreando(false);
        }}
      />
    </>
  );
}

/* ── Asignación de docentes ───────────────────────────────── */
function DocentesTab() {
  const { db, add, edit, toggle } = useAcademy();
  const [query, setQuery] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const periodo = periodoActivo(db);

  const filas = useMemo(() => {
    const idx = {
      docente: new Map(db.docentes.map((d) => [d.id, d])),
      asignatura: new Map(db.asignaturas.map((a) => [a.id, a])),
      grupo: new Map(db.grupos.map((g) => [g.id, g])),
      periodo: new Map(db.periodos.map((p) => [p.id, p])),
    };
    const texto = query.trim().toLowerCase();
    return db.teachingAssignments
      .map((a) => ({
        ...a,
        docente: idx.docente.get(a.docenteId)?.nombre ?? "—",
        asignatura: idx.asignatura.get(a.asignaturaId)?.nombre ?? "—",
        grupo: idx.grupo.get(a.grupoId)?.nombre ?? "—",
        periodo: idx.periodo.get(a.periodoId)?.nombre ?? "—",
      }))
      .filter((a) =>
        texto
          ? [a.docente, a.asignatura, a.grupo].join(" ").toLowerCase().includes(texto)
          : true,
      );
  }, [db.teachingAssignments, db.docentes, db.asignaturas, db.grupos, db.periodos, query]);

  return (
    <>
      <div className={ui.toolbar}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar por docente, asignatura o grupo"
          ariaLabel="Buscar asignación"
        />
        <span className={ui.toolbarSpacer} />
        <button type="button" className={ui.btnPrimary} onClick={() => setCreando(true)}>
          <Plus aria-hidden="true" />
          Nueva asignación
        </button>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={UserCheck} title="Sin asignaciones" text="Asigna el primer docente a un grupo." />
      ) : (
        <DataTable
          columns={[
            { key: "docente", header: "Docente" },
            { key: "asignatura", header: "Asignatura", muted: true },
            { key: "grupo", header: "Grupo", muted: true },
            { key: "periodo", header: "Periodo", muted: true },
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
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`Editar asignación de ${row.docente}`}
                    title="Editar"
                    onClick={() => setEditando(row)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`${row.estado === "Activa" ? "Desactivar" : "Activar"} asignación de ${row.docente}`}
                    title={row.estado === "Activa" ? "Desactivar" : "Activar"}
                    onClick={() =>
                      toggle(COLLECTIONS.TEACHING)(row.id, {
                        modulo: "Asignaciones",
                        accion: row.estado === "Activa" ? "Desactivó" : "Activó",
                        entidad: `${row.docente} · ${row.asignatura}`,
                        descripcion: "Asignación docente actualizada.",
                      })
                    }
                  >
                    <Power aria-hidden="true" />
                  </button>
                  {row.estado === "Activa" ? (
                    <button
                      type="button"
                      className={ui.btnSm}
                      onClick={() =>
                        edit(COLLECTIONS.TEACHING)(
                          row.id,
                          { estado: "Inactiva" },
                          {
                            modulo: "Asignaciones",
                            accion: "Finalizó",
                            entidad: `${row.docente} · ${row.asignatura}`,
                            descripcion: "Asignación docente finalizada.",
                          },
                        )
                      }
                    >
                      <CheckCircle2 aria-hidden="true" />
                      Finalizar
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
        title="Nueva asignación docente"
        sub={periodo ? `Se aplicará al periodo ${periodo.nombre}.` : undefined}
        schema={{
          sections: [
            {
              title: "Asignación",
              fields: [
                {
                  name: "docenteId",
                  label: "Docente",
                  type: "select",
                  required: true,
                  options: db.docentes
                    .filter((d) => d.estado === "Activo")
                    .map((d) => ({ value: d.id, label: `${d.nombre} · ${d.profesion}` })),
                },
                {
                  name: "asignaturaId",
                  label: "Asignatura",
                  type: "select",
                  required: true,
                  options: opciones(db.asignaturas.filter((a) => a.estado === "Activo")),
                },
                {
                  name: "grupoId",
                  label: "Grupo",
                  type: "select",
                  required: true,
                  options: db.grupos
                    .filter((g) => g.estado === "Activo" && g.periodoId === periodo?.id)
                    .map((g) => ({ value: g.id, label: `${g.nombre} · ${g.aula}` })),
                },
                {
                  name: "periodoId",
                  label: "Periodo",
                  type: "select",
                  required: true,
                  default: periodo?.id ?? "",
                  options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
                },
                {
                  name: "horario",
                  label: "Horario",
                  required: true,
                  span: "wide",
                  placeholder: "L-V 14:00-16:00",
                },
              ],
            },
          ],
        }}
        submitLabel="Crear asignación"
        onSubmit={(values) => {
          add(COLLECTIONS.TEACHING)(
            {
              docenteId: values.docenteId,
              asignaturaId: values.asignaturaId,
              grupoId: values.grupoId,
              periodoId: values.periodoId,
              horario: values.horario,
              estado: "Activa",
            },
            {
              modulo: "Asignaciones",
              accion: "Asignó",
              entidad: `${values.docenteId} · ${values.asignaturaId}`,
              descripcion: "Carga académica asignada a docente.",
            },
          );
          setCreando(false);
        }}
      />

      <FormModal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Editar asignación"
        sub={`${editando?.docente} · ${editando?.asignatura}`}
        schema={{
          sections: [
            {
              title: "Asignación",
              fields: [
                {
                  name: "docenteId",
                  label: "Docente",
                  type: "select",
                  required: true,
                  options: db.docentes.map((d) => ({ value: d.id, label: `${d.nombre} · ${d.profesion}` })),
                },
                {
                  name: "horario",
                  label: "Horario",
                  required: true,
                  span: "wide",
                  placeholder: "L-V 14:00-16:00",
                },
              ],
            },
          ],
        }}
        seed={editando}
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.TEACHING)(
            editando.id,
            { docenteId: values.docenteId, horario: values.horario },
            {
              modulo: "Asignaciones",
              accion: "Actualizó",
              entidad: `${editando.docente} · ${editando.asignatura}`,
              descripcion: "Asignación docente modificada.",
            },
          );
          setEditando(null);
        }}
      />
    </>
  );
}

/* ── Asignación de representantes ─────────────────────────── */
function RepresentantesTab() {
  const { db, add, edit, toggle } = useAcademy();
  const [query, setQuery] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const periodo = periodoActivo(db);

  const filas = useMemo(() => {
    const idx = {
      representante: new Map(db.representantes.map((r) => [r.id, r])),
      grupo: new Map(db.grupos.map((g) => [g.id, g])),
      periodo: new Map(db.periodos.map((p) => [p.id, p])),
    };
    const texto = query.trim().toLowerCase();
    return db.representativeAssignments
      .map((a) => ({
        ...a,
        representante: idx.representante.get(a.representanteId)?.nombre ?? "—",
        grupo: idx.grupo.get(a.grupoId)?.nombre ?? "—",
        periodo: idx.periodo.get(a.periodoId)?.nombre ?? "—",
      }))
      .filter((a) =>
        texto
          ? [a.representante, a.grupo].join(" ").toLowerCase().includes(texto)
          : true,
      );
  }, [db.representativeAssignments, db.representantes, db.grupos, db.periodos, query]);

  /* Un grupo no puede tener dos representantes activos en el mismo
     periodo: se avisa antes de duplicar. */
  const duplicadas = useMemo(() => {
    const vistas = new Set();
    return db.representativeAssignments.filter((a) => {
      if (a.estado !== "Activa") return false;
      const clave = `${a.grupoId}|${a.periodoId}`;
      if (vistas.has(clave)) return true;
      vistas.add(clave);
      return false;
    });
  }, [db.representativeAssignments]);

  return (
    <>
      {duplicadas.length > 0 ? (
        <Notice tone="warn" icon={Users}>
          Hay {duplicadas.length} grupo(s) con más de un representante activo en el mismo periodo.
        </Notice>
      ) : null}

      <div className={ui.toolbar}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar por representante o grupo"
          ariaLabel="Buscar representante"
        />
        <span className={ui.toolbarSpacer} />
        <button type="button" className={ui.btnPrimary} onClick={() => setCreando(true)}>
          <Plus aria-hidden="true" />
          Asignar representante
        </button>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={Users} title="Sin representantes" text="Asigna el primer representante a un grupo." />
      ) : (
        <DataTable
          columns={[
            { key: "grupo", header: "Grupo" },
            { key: "periodo", header: "Periodo", muted: true },
            { key: "representante", header: "Representante" },
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
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`Cambiar representante de ${row.grupo}`}
                    title="Cambiar"
                    onClick={() => setEditando(row)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`${row.estado === "Activa" ? "Desactivar" : "Activar"} representante de ${row.grupo}`}
                    title={row.estado === "Activa" ? "Desactivar" : "Activar"}
                    onClick={() =>
                      toggle(COLLECTIONS.REPRESENTATIVE_ASSIGNMENTS)(row.id, {
                        modulo: "Grupos",
                        accion: row.estado === "Activa" ? "Desactivó" : "Activó",
                        entidad: `${row.grupo} · ${row.representante}`,
                        descripcion: "Asignación de representante actualizada.",
                      })
                    }
                  >
                    <Power aria-hidden="true" />
                  </button>
                  {row.estado === "Activa" ? (
                    <button
                      type="button"
                      className={ui.btnSm}
                      onClick={() =>
                        edit(COLLECTIONS.REPRESENTATIVE_ASSIGNMENTS)(
                          row.id,
                          { estado: "Inactiva" },
                          {
                            modulo: "Grupos",
                            accion: "Finalizó",
                            entidad: `${row.grupo} · ${row.representante}`,
                            descripcion: "Asignación de representante finalizada.",
                          },
                        )
                      }
                    >
                      <CheckCircle2 aria-hidden="true" />
                      Finalizar
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
        title="Asignar representante"
        sub={periodo ? `Periodo vigente: ${periodo.nombre}.` : undefined}
        schema={{
          sections: [
            {
              title: "Asignación",
              fields: [
                {
                  name: "grupoId",
                  label: "Grupo",
                  type: "select",
                  required: true,
                  options: db.grupos.map((g) => ({ value: g.id, label: `${g.nombre} · ${g.aula}` })),
                },
                {
                  name: "periodoId",
                  label: "Periodo",
                  type: "select",
                  required: true,
                  default: periodo?.id ?? "",
                  options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
                },
                {
                  name: "representanteId",
                  label: "Representante",
                  type: "select",
                  required: true,
                  options: db.representantes
                    .filter((r) => r.estado === "Activo")
                    .map((r) => ({ value: r.id, label: `${r.nombre} · ${r.parentesco}` })),
                },
              ],
            },
          ],
        }}
        submitLabel="Asignar"
        onSubmit={(values) => {
          add(COLLECTIONS.REPRESENTATIVE_ASSIGNMENTS)(
            {
              representanteId: values.representanteId,
              grupoId: values.grupoId,
              periodoId: values.periodoId,
              estado: "Activa",
            },
            {
              modulo: "Grupos",
              accion: "Asignó",
              entidad: `${values.grupoId} · ${values.representanteId}`,
              descripcion: "Representante asignado al grupo.",
            },
          );
          setCreando(false);
        }}
      />

      <FormModal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Cambiar representante"
        sub={`${editando?.grupo} · ${editando?.periodo}`}
        schema={{
          sections: [
            {
              title: "Asignación",
              fields: [
                {
                  name: "representanteId",
                  label: "Representante",
                  type: "select",
                  required: true,
                  options: db.representantes
                    .filter((r) => r.estado === "Activo")
                    .map((r) => ({ value: r.id, label: `${r.nombre} · ${r.parentesco}` })),
                },
              ],
            },
          ],
        }}
        seed={editando}
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.REPRESENTATIVE_ASSIGNMENTS)(
            editando.id,
            { representanteId: values.representanteId },
            {
              modulo: "Grupos",
              accion: "Actualizó",
              entidad: `${editando.grupo} · ${editando.representante}`,
              descripcion: "Representante cambiado.",
            },
          );
          setEditando(null);
        }}
      />
    </>
  );
}
