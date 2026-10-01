/* Supervisión de asistencias: sesiones, registros y firmas. El
   administrador consulta y filtra; las transiciones de estado siguen
   pasando por la máquina existente y quedan auditadas. */

"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus,
  ClipboardList,
  Eye,
  Lock,
  Play,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  DataTable,
  Drawer,
  EmptyState,
  FormModal,
  Notice,
  Pill,
  SearchBar,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import {
  ESTADOS_SESION,
  firmasPorSesion,
  registrosManuales,
  sessionStats,
  tonoEstado,
} from "@/features/shared/selectors";
import { transicionesDesde } from "@/features/shared/flowAdapter";

const TABS = [
  { key: "sesiones", label: "Sesiones", icon: ClipboardList },
  { key: "registros", label: "Registros", icon: ScrollText },
  { key: "firmas", label: "Firmas", icon: ShieldCheck },
];

/* Verbo de la transición: la acción del botón, no el estado destino. */
const VERBO = {
  Programada: "Programar",
  Abierta: "Abrir",
  Cerrada: "Cerrar",
  Validada: "Validar",
  Firmada: "Firmar",
};

export default function AsistenciasPage() {
  const [tab, setTab] = useState("sesiones");

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Asistencias"
        sub="Supervisión de sesiones, registros y firmas del periodo."
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

      {tab === "sesiones" ? <SesionesTab /> : null}
      {tab === "registros" ? <RegistrosTab /> : null}
      {tab === "firmas" ? <FirmasTab /> : null}
    </>
  );
}

/* ── Sesiones ─────────────────────────────────────────────── */
function SesionesTab() {
  const { db, createSession, transitionSession, leerSesion, resumenSesion } = useAcademy();
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [facultadId, setFacultadId] = useState("");
  const [programaId, setProgramaId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [nivelId, setNivelId] = useState("");
  const [asignaturaId, setAsignaturaId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [creando, setCreando] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const periodoActivo = db.periodos.find((p) => p.estado === "ACTIVE");

  const idx = {
    grupo: new Map(db.grupos.map((g) => [g.id, g])),
    asignatura: new Map(db.asignaturas.map((a) => [a.id, a])),
    docente: new Map(db.docentes.map((d) => [d.id, d])),
    oferta: new Map(db.offerings.map((o) => [o.id, o])),
  };

  const filas = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return db.sessions
      .map((s) => ({ ...leerSesion(s.id), resumen: resumenSesion(s.id) }))
      .filter((s) => {
        const grupo = idx.grupo.get(s.grupoId);
        const oferta = idx.oferta.get(s.offeringId);
        if (estado && s.estado !== estado) return false;
        if (periodoId && s.periodoId !== periodoId) return false;
        if (facultadId && grupo?.programaId) {
          const programa = db.programas.find((p) => p.id === grupo.programaId);
          if (programa?.facultadId !== facultadId) return false;
        } else if (facultadId) return false;
        if (programaId && grupo?.programaId !== programaId) return false;
        if (grupoId && s.grupoId !== grupoId) return false;
        if (nivelId && grupo?.nivelId !== nivelId) return false;
        if (asignaturaId && oferta?.asignaturaId !== asignaturaId) return false;
        if (docenteId && oferta?.docenteId !== docenteId) return false;
        if (fecha && s.fecha !== fecha) return false;
        if (!texto) return true;
        return [s.asignatura, s.grupo, s.tema, s.docente].join(" ").toLowerCase().includes(texto);
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    db.sessions,
    db.grupos,
    db.offerings,
    db.programas,
    query,
    estado,
    periodoId,
    facultadId,
    programaId,
    grupoId,
    nivelId,
    asignaturaId,
    docenteId,
    fecha,
  ]);

  const esquema = useMemo(
    () => ({
      sections: [
        {
          title: "Sesión",
          fields: [
            {
              name: "grupoId",
              label: "Grupo",
              type: "select",
              required: true,
              options: db.grupos
                .filter((g) => g.estado === "Activo")
                .map((g) => ({ value: g.id, label: `${g.nombre} · ${g.aula}` })),
            },
            {
              name: "periodoId",
              label: "Periodo",
              type: "select",
              required: true,
              options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
            },
            { name: "fecha", label: "Fecha", type: "date", required: true },
            { name: "horaInicio", label: "Hora de inicio", type: "time", required: true },
            { name: "horaFin", label: "Hora de fin", type: "time", required: true },
          ],
        },
        {
          title: "Contenido",
          fields: [{ name: "tema", label: "Tema de la clase", required: true, span: "wide" }],
        },
      ],
    }),
    [db],
  );

  const filtros = [
    {
      key: "periodoId",
      label: "Periodo",
      value: periodoId,
      onChange: setPeriodoId,
      options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
    },
    {
      key: "facultadId",
      label: "Facultad",
      value: facultadId,
      onChange: setFacultadId,
      options: db.facultades.map((f) => ({ value: f.id, label: f.nombre })),
    },
    {
      key: "programaId",
      label: "Programa",
      value: programaId,
      onChange: setProgramaId,
      options: db.programas.map((p) => ({ value: p.id, label: p.nombre })),
    },
    {
      key: "grupoId",
      label: "Grupo",
      value: grupoId,
      onChange: setGrupoId,
      options: db.grupos.map((g) => ({ value: g.id, label: g.nombre })),
    },
    {
      key: "nivelId",
      label: "Nivel",
      value: nivelId,
      onChange: setNivelId,
      options: db.niveles.map((n) => ({ value: n.id, label: n.nombre })),
    },
    {
      key: "asignaturaId",
      label: "Asignatura",
      value: asignaturaId,
      onChange: setAsignaturaId,
      options: db.asignaturas.map((a) => ({ value: a.id, label: a.nombre })),
    },
    {
      key: "docenteId",
      label: "Docente",
      value: docenteId,
      onChange: setDocenteId,
      options: db.docentes.map((d) => ({ value: d.id, label: d.nombre })),
    },
  ];

  return (
    <>
      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por asignatura, grupo, tema o docente"
            ariaLabel="Buscar sesión"
          />
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_SESION.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {filtros.map((filtro) => (
            <select
              key={filtro.key}
              className={ui.select}
              style={{ width: "auto", minHeight: 36, height: 36 }}
              value={filtro.value}
              onChange={(event) => filtro.onChange(event.target.value)}
              aria-label={`Filtrar por ${filtro.label.toLowerCase()}`}
            >
              <option value="">{filtro.label}</option>
              {filtro.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
          <input
            type="date"
            className={ui.input}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            aria-label="Filtrar por fecha"
          />
        </div>
        <span className={ui.toolbarSpacer} />
        <button type="button" className={ui.btnPrimary} onClick={() => setCreando(true)}>
          <CalendarPlus aria-hidden="true" />
          Nueva sesión
        </button>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin sesiones" text="No hay coincidencias para los filtros aplicados." />
      ) : (
        <DataTable
          columns={[
            { key: "fecha", header: "Fecha", muted: true, nowrap: true },
            {
              key: "asignatura",
              header: "Asignatura",
              render: (row) => (
                <div>
                  <b style={{ fontSize: 13.5 }}>{row.asignatura}</b>
                  <p className={ui.cellMuted}>{row.tema}</p>
                </div>
              ),
            },
            { key: "grupo", header: "Grupo", muted: true },
            { key: "docente", header: "Docente", muted: true },
            {
              key: "resumen",
              header: "Asistencia",
              align: "right",
              render: (row) => (
                <span>
                  <b style={{ fontVariantNumeric: "tabular-nums" }}>{row.resumen.pct}%</b>
                  <p className={ui.cellMuted}>
                    {row.resumen.presentes}/{row.resumen.total}
                  </p>
                </span>
              ),
            },
            { key: "estado", header: "Estado", render: (row) => <Pill tone={tonoEstado(row.estado)}>{row.estado}</Pill> },
            {
              key: "__acciones",
              header: "Acciones",
              align: "right",
              render: (row) => {
                const posibles = transicionesDesde(row.estado);
                const siguiente = posibles[0];
                return (
                  <div>
                    <button type="button" className={ui.linkBtn} onClick={() => setDetalle(row)}>
                      <Eye aria-hidden="true" />
                      Ver
                    </button>
                    {siguiente ? (
                      <button
                        type="button"
                        className={ui.btnSm}
                        title={`Pasar a ${siguiente}`}
                        onClick={() => transitionSession(row.id, siguiente, "admin")}
                      >
                        {siguiente === "Abierta" ? <Play aria-hidden="true" /> : <Lock aria-hidden="true" />}
                        {VERBO[siguiente] ?? siguiente}
                      </button>
                    ) : (
                      <span className={ui.cellMuted}>
                        <Lock aria-hidden="true" style={{ width: 12, height: 12 }} />
                        Firmada
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

      <Notice tone="info" icon={ClipboardList}>
        Las transiciones siguen la máquina de estados: Borrador, Programada, Abierta, Cerrada,
        Validada y Firmada. El administrador supervisa; la captura la hace el docente y la validación
        el representante.
      </Notice>

      <FormModal
        open={creando}
        onClose={() => setCreando(false)}
        title="Nueva sesión"
        sub="La sesión se crea en estado Borrador."
        schema={esquema}
        submitLabel="Crear sesión"
        onSubmit={(values) => {
          const oferta = db.offerings.find(
            (o) => o.grupoId === values.grupoId && o.periodoId === values.periodoId,
          );
          if (!oferta) return;
          createSession({
            ...values,
            offeringId: oferta.id,
            grupoId: values.grupoId,
            creadoPor: oferta.docenteId,
          });
          setCreando(false);
        }}
      />

      <DetalleSesionDrawer sesion={detalle} onClose={() => setDetalle(null)} />
    </>
  );
}

/* Detalle de la sesión: registros y estado de firmas. */
function DetalleSesionDrawer({ sesion, onClose }) {
  const { db } = useAcademy();
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("");

  if (!sesion) return null;

  const registros = db.records
    .filter((r) => r.sesionId === sesion.id)
    .map((r) => ({
      ...r,
      estudiante: db.estudiantes.find((e) => e.id === r.estudianteId),
    }))
    .filter((r) => (filtroEstado ? r.estado === filtroEstado : true))
    .filter((r) => (filtroMetodo ? r.metodo === filtroMetodo : true))
    .sort((a, b) => (a.estudiante?.nombre ?? "").localeCompare(b.estudiante?.nombre ?? ""));

  const firmas = db.sessionSignatures.filter((f) => f.sesionId === sesion.id);
  const stats = sessionStats(db, sesion.id);

  return (
    <Drawer open onClose={onClose} title={`${sesion.asignatura} · ${sesion.grupo}`} sub={sesion.fecha}>
      <dl className={ui.defList}>
        <div>
          <dt>Tema</dt>
          <dd>{sesion.tema}</dd>
        </div>
        <div>
          <dt>Docente</dt>
          <dd>{sesion.docente}</dd>
        </div>
        <div>
          <dt>Horario</dt>
          <dd>
            {sesion.horaInicio} a {sesion.horaFin}
          </dd>
        </div>
        <div>
          <dt>Asistencia</dt>
          <dd>
            {stats.presentes} de {stats.total} ({stats.pct}%)
          </dd>
        </div>
        <div>
          <dt>Registros manuales</dt>
          <dd>{stats.manuales}</dd>
        </div>
      </dl>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>Firmas del acta</h3>
      <ul className={ui.riskList}>
        <li>
          <div>
            <b>Docente</b>
            <span className={ui.cellMuted}>
              {firmas.find((f) => f.rol === "Docente")?.estado ?? "Sin firma"}
            </span>
          </div>
          <Pill tone={firmas.find((f) => f.rol === "Docente")?.estado === "Firmada" ? "ok" : "warn"}>
            {firmas.find((f) => f.rol === "Docente")?.estado ?? "Sin firma"}
          </Pill>
        </li>
        <li>
          <div>
            <b>Representante</b>
            <span className={ui.cellMuted}>
              {firmas.find((f) => f.rol === "Representante")?.estado ?? "Sin firma"}
            </span>
          </div>
          <Pill tone={firmas.find((f) => f.rol === "Representante")?.estado === "Firmada" ? "ok" : "warn"}>
            {firmas.find((f) => f.rol === "Representante")?.estado ?? "Sin firma"}
          </Pill>
        </li>
      </ul>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>Registros ({registros.length})</h3>
      <div className={ui.filterBar} style={{ marginBottom: 10 }}>
        <select
          className={ui.select}
          style={{ width: "auto", minHeight: 34, height: 34 }}
          value={filtroEstado}
          onChange={(event) => setFiltroEstado(event.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {["Presente", "Ausente", "Tardanza", "Excusa"].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className={ui.select}
          style={{ width: "auto", minHeight: 34, height: 34 }}
          value={filtroMetodo}
          onChange={(event) => setFiltroMetodo(event.target.value)}
          aria-label="Filtrar por método"
        >
          <option value="">Todos los métodos</option>
          {["QR", "CODE", "MANUAL"].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      {registros.length === 0 ? (
        <p className={ui.cellMuted}>Sin registros para los filtros.</p>
      ) : (
        <ul className={ui.riskList}>
          {registros.map((r) => (
            <li key={r.id}>
              <div style={{ flex: 1 }}>
                <b>{r.estudiante?.nombre ?? r.estudianteId}</b>
                <span className={ui.cellMuted}>
                  {r.estado} · {r.metodo}
                  {r.manual ? " · Manual" : ""} · {r.hora}
                </span>
                {r.justificacion ? (
                  <span className={ui.cellMuted}> · {r.justificacion}</span>
                ) : null}
              </div>
              <Pill tone={r.estado === "Presente" ? "ok" : r.estado === "Ausente" ? "danger" : "warn"}>
                {r.estado}
              </Pill>
            </li>
          ))}
        </ul>
      )}

      <div className={ui.dialogActions}>
        <button type="button" className={ui.btnSecondary} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Drawer>
  );
}

/* ── Registros ────────────────────────────────────────────── */
function RegistrosTab() {
  const { db } = useAcademy();
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [metodo, setMetodo] = useState("");
  const [soloManuales, setSoloManuales] = useState(false);

  const registros = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return db.records
      .map((r) => {
        const sesion = db.sessions.find((s) => s.id === r.sesionId);
        const estudiante = db.estudiantes.find((e) => e.id === r.estudianteId);
        return {
          ...r,
          estudiante: estudiante?.nombre ?? "—",
          fecha: sesion?.fecha ?? "—",
          asignatura: sesion
            ? db.asignaturas.find((a) => a.id === db.offerings.find((o) => o.id === sesion.offeringId)?.asignaturaId)?.nombre ?? "—"
            : "—",
        };
      })
      .filter((r) => {
        if (estado && r.estado !== estado) return false;
        if (metodo && r.metodo !== metodo) return false;
        if (soloManuales && !r.manual) return false;
        if (!texto) return true;
        return [r.estudiante, r.asignatura, r.fecha].join(" ").toLowerCase().includes(texto);
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [db.records, db.sessions, db.estudiantes, db.offerings, db.asignaturas, query, estado, metodo, soloManuales]);

  return (
    <>
      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por estudiante, asignatura o fecha"
            ariaLabel="Buscar registro"
          />
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {["Presente", "Ausente", "Tardanza", "Excusa"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={metodo}
            onChange={(event) => setMetodo(event.target.value)}
            aria-label="Filtrar por método"
          >
            <option value="">Todos los métodos</option>
            {["QR", "CODE", "MANUAL"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={soloManuales}
              onChange={(event) => setSoloManuales(event.target.checked)}
            />
            Solo manuales
          </label>
        </div>
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {registros.length} de {db.records.length}
        </span>
      </div>

      {registros.length === 0 ? (
        <EmptyState icon={ScrollText} title="Sin registros" text="No hay coincidencias para los filtros aplicados." />
      ) : (
        <DataTable
          columns={[
            { key: "estudiante", header: "Estudiante" },
            { key: "asignatura", header: "Asignatura", muted: true },
            { key: "fecha", header: "Fecha", muted: true, nowrap: true },
            { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
            { key: "metodo", header: "Método", muted: true, render: (row) => row.metodo },
            { key: "hora", header: "Hora", muted: true, nowrap: true },
            {
              key: "manual",
              header: "Manual",
              align: "right",
              render: (row) => (row.manual ? <Pill tone="warn">Sí</Pill> : <span className={ui.cellMuted}>—</span>),
            },
          ]}
          rows={registros}
        />
      )}
    </>
  );
}

/* ── Firmas ───────────────────────────────────────────────── */
function FirmasTab() {
  const { db } = useAcademy();
  const firmasSesion = useMemo(() => firmasPorSesion(db), [db]);
  const manuales = registrosManuales(db).length;

  return (
    <>
      <div className={ui.kpiGrid}>
        <Card>
          <div className={ui.cardHead}>
            <h2 className={ui.eyebrow}>Sesiones firmadas</h2>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700 }}>
            {firmasSesion.filter((f) => f.docente === "Firmada" && f.representante === "Firmada").length}
          </p>
          <p className={ui.cellMuted}>Con acta completa</p>
        </Card>
        <Card>
          <div className={ui.cardHead}>
            <h2 className={ui.eyebrow}>Pendientes de firma</h2>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700 }}>
            {firmasSesion.filter((f) => f.docente !== "Firmada" || f.representante !== "Firmada").length}
          </p>
          <p className={ui.cellMuted}>Algún rol sin firmar</p>
        </Card>
        <Card>
          <div className={ui.cardHead}>
            <h2 className={ui.eyebrow}>Registros manuales</h2>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700 }}>{manuales}</p>
          <p className={ui.cellMuted}>Correcciones auditadas</p>
        </Card>
      </div>

      <DataTable
        columns={[
          { key: "asignatura", header: "Asignatura" },
          { key: "grupo", header: "Grupo", muted: true },
          { key: "fecha", header: "Fecha", muted: true, nowrap: true, render: (row) => row.sesion.fecha },
          {
            key: "docente",
            header: "Docente",
            render: (row) => <Pill tone={row.docente === "Firmada" ? "ok" : "warn"}>{row.docente}</Pill>,
          },
          {
            key: "representante",
            header: "Representante",
            render: (row) => <Pill tone={row.representante === "Firmada" ? "ok" : "warn"}>{row.representante}</Pill>,
          },
        ]}
        rows={firmasSesion}
      />

      <Notice tone="info" icon={ShieldCheck}>
        El administrador consulta el estado de las firmas. Las firmas las crean docentes,
        representantes y estudiantes desde sus propios paneles; aquí no se pueden falsificar.
      </Notice>
    </>
  );
}
