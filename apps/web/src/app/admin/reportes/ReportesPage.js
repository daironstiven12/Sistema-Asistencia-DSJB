/* Reportes administrativos: cada tipo de reporte se calcula sobre el
   estado filtrado y se puede exportar a CSV o PDF. Sin botones
   decorativos: ambas exportaciones generan el archivo en el navegador. */

"use client";

import { useMemo, useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import {
  ChartCard,
  Donut,
  HBars,
  LineChart,
  Notice,
  Pill,
  StatsCard,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import {
  agrupar,
  estudiantesEnRiesgo,
  registrosManuales,
  sessionStats,
  tendencia,
} from "@/features/shared/selectors";
import { descargarCsv, descargarInformePdf } from "@/lib/exportar";

const TIPOS = [
  { key: "general", label: "Asistencia general" },
  { key: "programa", label: "Por programa" },
  { key: "grupo", label: "Por grupo" },
  { key: "asignatura", label: "Por asignatura" },
  { key: "docente", label: "Por docente" },
  { key: "riesgo", label: "Estudiantes con baja asistencia" },
  { key: "sesiones", label: "Sesiones realizadas y pendientes" },
  { key: "manuales", label: "Registros manuales" },
];

export default function ReportesPage() {
  const { db, config, metrics, trend, riesgo } = useAcademy();
  const [tipo, setTipo] = useState("general");
  const [periodoId, setPeriodoId] = useState("");
  const [programaId, setProgramaId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [asignaturaId, setAsignaturaId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const riesgoList = riesgo(config.umbralRiesgo);

  /* Sesiones filtradas: la base de todos los reportes. */
  const sesiones = useMemo(() => {
    return db.sessions.filter((s) => {
      if (periodoId && s.periodoId !== periodoId) return false;
      if (grupoId && s.grupoId !== grupoId) return false;
      if (desde && s.fecha < desde) return false;
      if (hasta && s.fecha > hasta) return false;
      const oferta = db.offerings.find((o) => o.id === s.offeringId);
      if (programaId) {
        const grupo = db.grupos.find((g) => g.id === s.grupoId);
        if (grupo?.programaId !== programaId) return false;
      }
      if (asignaturaId && oferta?.asignaturaId !== asignaturaId) return false;
      if (docenteId && oferta?.docenteId !== docenteId) return false;
      return true;
    });
  }, [db.sessions, db.offerings, db.grupos, periodoId, programaId, grupoId, asignaturaId, docenteId, desde, hasta]);

  const stats = sesiones.map((s) => sessionStats(db, s.id));
  const registros = stats.reduce((acc, s) => acc + s.total, 0);
  const presentes = stats.reduce((acc, s) => acc + s.presentes, 0);
  const pct = registros ? Math.round((presentes / registros) * 100) : 0;
  const realizadas = sesiones.filter((s) => ["Cerrada", "Validada", "Firmada"].includes(s.estado)).length;
  const pendientes = sesiones.length - realizadas;

  const porPrograma = useMemo(
    () => agrupar({ ...db, sessions: sesiones }, "programa"),
    [db, sesiones],
  );
  const porGrupo = useMemo(
    () => agrupar({ ...db, sessions: sesiones }, "grupo"),
    [db, sesiones],
  );
  const porAsignatura = useMemo(
    () => agrupar({ ...db, sessions: sesiones }, "asignatura"),
    [db, sesiones],
  );
  const porDocente = useMemo(
    () => agrupar({ ...db, sessions: sesiones }, "docente"),
    [db, sesiones],
  );

  const manuales = useMemo(
    () => registrosManuales({ ...db, records: db.records.filter((r) => sesiones.some((s) => s.id === r.sesionId)) }),
    [db, sesiones],
  );

  const tendenciaFiltrada = useMemo(() => {
    const porFecha = new Map();
    sesiones.forEach((s) => {
      const st = sessionStats(db, s.id);
      const actual = porFecha.get(s.fecha) ?? { label: s.fecha.slice(5), total: 0, presentes: 0 };
      actual.total += st.total;
      actual.presentes += st.presentes;
      porFecha.set(s.fecha, actual);
    });
    return Array.from(porFecha.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        label: v.label,
        value: v.total ? Math.round((v.presentes / v.total) * 100) : 0,
        total: v.total,
      }));
  }, [db, sesiones]);

  const riesgoFiltrado = useMemo(
    () => estudiantesEnRiesgo({ ...db, records: db.records.filter((r) => sesiones.some((s) => s.id === r.sesionId)) }, config.umbralRiesgo),
    [db, sesiones, config.umbralRiesgo],
  );

  const filtros = [
    { key: "periodoId", label: "Periodo", value: periodoId, onChange: setPeriodoId, options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })) },
    { key: "programaId", label: "Programa", value: programaId, onChange: setProgramaId, options: db.programas.map((p) => ({ value: p.id, label: p.nombre })) },
    { key: "grupoId", label: "Grupo", value: grupoId, onChange: setGrupoId, options: db.grupos.map((g) => ({ value: g.id, label: g.nombre })) },
    { key: "asignaturaId", label: "Asignatura", value: asignaturaId, onChange: setAsignaturaId, options: db.asignaturas.map((a) => ({ value: a.id, label: a.nombre })) },
    { key: "docenteId", label: "Docente", value: docenteId, onChange: setDocenteId, options: db.docentes.map((d) => ({ value: d.id, label: d.nombre })) },
  ];

  const exportar = (formato) => {
    const nombre = `reporte_${tipo}`;
    if (formato === "csv") {
      descargarCsv({ nombre, columnas: columnasDelReporte(tipo), filas: filasDelReporte(tipo) });
    } else {
      descargarInformePdf({
        titulo: TIPOS.find((t) => t.key === tipo)?.label ?? "Reporte",
        sub: `Periodo vigente · ${registros} registros`,
        columnas: columnasDelReporte(tipo),
        filas: filasDelReporte(tipo),
      });
    }
  };

  function columnasDelReporte(t) {
    switch (t) {
      case "programa":
      case "grupo":
      case "asignatura":
      case "docente":
        return [
          { key: "label", header: "Nombre" },
          { key: "sesiones", header: "Sesiones", align: "right" },
          { key: "total", header: "Registros", align: "right" },
          { key: "presentes", header: "Presentes", align: "right" },
          { key: "pct", header: "Asistencia", align: "right" },
        ];
      case "riesgo":
        return [
          { key: "nombre", header: "Estudiante" },
          { key: "grupo", header: "Grupo" },
          { key: "total", header: "Registros", align: "right" },
          { key: "presentes", header: "Presentes", align: "right" },
          { key: "pct", header: "Asistencia", align: "right" },
        ];
      case "sesiones":
        return [
          { key: "label", header: "Estado" },
          { key: "total", header: "Cantidad", align: "right" },
        ];
      case "manuales":
        return [
          { key: "estudiante", header: "Estudiante" },
          { key: "asignatura", header: "Asignatura" },
          { key: "fecha", header: "Fecha", nowrap: true },
          { key: "estado", header: "Estado" },
          { key: "justificacion", header: "Justificación" },
        ];
      default:
        return [
          { key: "label", header: "Indicador" },
          { key: "value", header: "Valor", align: "right" },
        ];
    }
  }

  function filasDelReporte(t) {
    switch (t) {
      case "programa":
        return porPrograma;
      case "grupo":
        return porGrupo;
      case "asignatura":
        return porAsignatura;
      case "docente":
        return porDocente;
      case "riesgo":
        return riesgoFiltrado.map((r) => ({
          nombre: r.estudiante.nombre,
          grupo: db.grupos.find((g) => g.id === r.estudiante.grupoId)?.nombre ?? "—",
          total: r.total,
          presentes: r.presentes,
          pct: r.pct,
        }));
      case "sesiones":
        return [
          { label: "Realizadas", total: realizadas },
          { label: "Pendientes", total: pendientes },
        ];
      case "manuales":
        return manuales.map((r) => {
          const sesion = db.sessions.find((s) => s.id === r.sesionId);
          const oferta = sesion ? db.offerings.find((o) => o.id === sesion.offeringId) : null;
          return {
            estudiante: db.estudiantes.find((e) => e.id === r.estudianteId)?.nombre ?? "—",
            asignatura: oferta ? db.asignaturas.find((a) => a.id === oferta.asignaturaId)?.nombre ?? "—" : "—",
            fecha: sesion?.fecha ?? "—",
            estado: r.estado,
            justificacion: r.justificacion,
          };
        });
      default:
        return [
          { label: "Asistencia global", value: `${pct}%` },
          { label: "Registros", value: registros },
          { label: "Presentes", value: presentes },
          { label: "Sesiones", value: sesiones.length },
          { label: "Realizadas", value: realizadas },
          { label: "Pendientes", value: pendientes },
        ];
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Reportes"
        sub="Indicadores consolidados con filtros y exportación."
        actions={
          <>
            <button type="button" className={ui.btnSecondary} onClick={() => exportar("csv")}>
              <FileSpreadsheet aria-hidden="true" />
              Exportar CSV
            </button>
            <button type="button" className={ui.btnPrimary} onClick={() => exportar("pdf")}>
              <FileDown aria-hidden="true" />
              Descargar PDF
            </button>
          </>
        }
      />

      <div className={ui.filterBar} style={{ marginBottom: 16 }}>
        {TIPOS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={ui.btnSecondary}
            style={tipo === t.key ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            onClick={() => setTipo(t.key)}
            aria-pressed={tipo === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
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
          <span className={ui.filterGroup}>
            <span className={ui.filterLabel}>Desde</span>
            <input
              type="date"
              className={ui.input}
              style={{ width: "auto", minHeight: 36, height: 36 }}
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
              aria-label="Desde"
            />
          </span>
          <span className={ui.filterGroup}>
            <span className={ui.filterLabel}>Hasta</span>
            <input
              type="date"
              className={ui.input}
              style={{ width: "auto", minHeight: 36, height: 36 }}
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
              aria-label="Hasta"
            />
          </span>
        </div>
      </div>

      <div className={ui.kpiGrid}>
        <StatsCard label="Asistencia" value={`${pct}%`} foot={`${registros} registros`} tone="accent" />
        <StatsCard label="Sesiones" value={sesiones.length} foot={`${realizadas} realizadas`} tone="info" />
        <StatsCard label="Presentes" value={presentes} tone="teal" />
        <StatsCard label="Pendientes" value={pendientes} tone="warn" />
      </div>

      {tipo === "general" ? (
        <>
          <ChartCard
            title="Tendencia por fecha"
            sub="Asistencia por jornada, con los registros que la sostienen"
            actions={
              <span className={ui.cellMuted} style={{ marginTop: 0 }}>
                Promedio {pct}% · umbral {config.umbralRiesgo}%
              </span>
            }
          >
            <LineChart points={tendenciaFiltrada} average={pct} threshold={config.umbralRiesgo} />
          </ChartCard>
          <div className={ui.twoCol}>
            <ChartCard title="Asistencia por programa" sub="De menor a mayor presencia">
              <HBars
                rows={porPrograma.map((row) => ({ label: row.label, value: row.pct, display: `${row.pct}%` }))}
              />
            </ChartCard>
            <ChartCard title="Sesiones" sub="Realizadas vs pendientes">
              <Donut
                value={realizadas}
                total={Math.max(1, sesiones.length)}
                label="realizadas"
                segments={[
                  { label: "Realizadas", value: realizadas, color: "var(--chart-1)" },
                  { label: "Pendientes", value: pendientes, color: "var(--chart-3)" },
                ]}
              />
            </ChartCard>
          </div>
        </>
      ) : null}

      {tipo === "programa" ? (
        <ChartCard title="Asistencia por programa" sub="De menor a mayor presencia">
          <HBars rows={porPrograma.map((row) => ({ label: row.label, value: row.pct, display: `${row.pct}%` }))} />
        </ChartCard>
      ) : null}

      {tipo === "grupo" ? (
        <ChartCard title="Asistencia por grupo" sub="De menor a mayor presencia">
          <HBars rows={porGrupo.map((row) => ({ label: row.label, value: row.pct, display: `${row.pct}%` }))} />
        </ChartCard>
      ) : null}

      {tipo === "asignatura" ? (
        <ChartCard title="Asistencia por asignatura" sub="De menor a mayor presencia">
          <HBars rows={porAsignatura.map((row) => ({ label: row.label, value: row.pct, display: `${row.pct}%` }))} />
        </ChartCard>
      ) : null}

      {tipo === "docente" ? (
        <ChartCard title="Asistencia por docente" sub="De menor a mayor presencia">
          <HBars rows={porDocente.map((row) => ({ label: row.label, value: row.pct, display: `${row.pct}%` }))} />
        </ChartCard>
      ) : null}

      {tipo === "riesgo" ? (
        <ChartCard title="Estudiantes con baja asistencia" sub={`Menos del ${config.umbralRiesgo}% acumulado`}>
          {riesgoFiltrado.length === 0 ? (
            <p className={ui.cellMuted}>Ningún estudiante por debajo del umbral.</p>
          ) : (
            <ul className={ui.riskList}>
              {riesgoFiltrado.map((row) => (
                <li key={row.estudiante.id}>
                  <div>
                    <b>{row.estudiante.nombre}</b>
                    <span className={ui.cellMuted}>
                      {db.grupos.find((g) => g.id === row.estudiante.grupoId)?.nombre ?? ""} · {row.presentes} de {row.total}
                    </span>
                  </div>
                  <Pill tone={row.pct < 60 ? "danger" : "warn"}>{row.pct}%</Pill>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      ) : null}

      {tipo === "sesiones" ? (
        <ChartCard title="Sesiones realizadas y pendientes" sub="Estado de la operación">
          <Donut
            value={realizadas}
            total={Math.max(1, sesiones.length)}
            label="realizadas"
            hideLegend
            segments={[
              { label: "Realizadas", value: realizadas, color: "var(--chart-1)" },
              { label: "Pendientes", value: pendientes, color: "var(--chart-3)" },
            ]}
          />
          <ul className={ui.legendList}>
            <li>
              <span>Realizadas</span>
              <b>{realizadas}</b>
            </li>
            <li>
              <span>Pendientes</span>
              <b>{pendientes}</b>
            </li>
          </ul>
        </ChartCard>
      ) : null}

      {tipo === "manuales" ? (
        <ChartCard title="Registros manuales" sub="Correcciones hechas por coordinación">
          {manuales.length === 0 ? (
            <p className={ui.cellMuted}>No hay registros manuales.</p>
          ) : (
            <ul className={ui.riskList}>
              {manuales.map((r) => (
                <li key={r.id}>
                  <div style={{ flex: 1 }}>
                    <b>{db.estudiantes.find((e) => e.id === r.estudianteId)?.nombre ?? "—"}</b>
                    <span className={ui.cellMuted}>
                      {r.justificacion || "Sin justificación"} · {r.estado}
                    </span>
                  </div>
                  <Pill tone="warn">Manual</Pill>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      ) : null}

      <Notice tone="info" icon={FileDown}>
        Usa los filtros de periodo, programa, grupo, asignatura, docente y rango de fechas para
        acotar el reporte, luego expórtalo a CSV o PDF.
      </Notice>
    </>
  );
}
