/* Dashboard administrativo: salud institucional, tendencia, composición
   por programa, riesgo estudiantil y cola de trabajo pendiente. */

"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  GraduationCap,
  PenLine,
  School,
  UserCheck,
  Users,
} from "lucide-react";
import {
  CHART_COLORS,
  ChartCard,
  Donut,
  HBars,
  LineChart,
  Pill,
  StackedColumns,
  StatsCard,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead, SplitGrid } from "@/features/shared/PageHead";
import { ESTADOS_SESION, tonoEstado } from "@/features/shared/selectors";
import { periodoActivo } from "@/features/admin/modules/catalog";

const COLOR_ESTADO = {
  Borrador: "var(--border-3)",
  Programada: CHART_COLORS.info,
  Abierta: CHART_COLORS.warn,
  Cerrada: CHART_COLORS.accent,
  Validada: CHART_COLORS.teal,
  Firmada: CHART_COLORS.ok,
};

const KPIS = [
  { key: "estudiantes", label: "Estudiantes", icon: GraduationCap, foot: "Matriculados activos", tone: "accent" },
  { key: "docentes", label: "Docentes", icon: UserCheck, foot: "Con carga asignada", tone: "teal" },
  { key: "grupos", label: "Grupos", icon: Users, foot: "Periodo vigente", tone: "info" },
  { key: "asignaturas", label: "Asignaturas", icon: School, foot: "Catálogo activo", tone: "warn" },
];

const PENDIENTES = ["Borrador", "Programada", "Abierta", "Cerrada"];

export default function AdminDashboard() {
  const { db, metrics, trend, byPrograma, riesgo: enRiesgo, leerSesion, resumenSesion, index } =
    useAcademy();
  const riesgo = enRiesgo();
  const umbral = db.config?.umbralRiesgo ?? 75;
  const periodo = periodoActivo(db);

  const porEstado = ESTADOS_SESION.map((estado) => ({
    key: estado,
    label: estado,
    value: db.sessions.filter((s) => s.estado === estado).length,
    color: COLOR_ESTADO[estado],
  })).filter((bucket) => bucket.value > 0);

  const pendientes = db.sessions
    .filter((s) => PENDIENTES.includes(s.estado))
    .slice(0, 6)
    .map((s) => ({ ...leerSesion(s.id), resumen: resumenSesion(s.id) }));

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Panel institucional"
        sub={
          periodo
            ? `Periodo ${periodo.nombre} · ${periodo.fechaInicio} a ${periodo.fechaFin}`
            : "Sin periodo activo configurado."
        }
        actions={
          <>
            <Link href="/admin/auditoria" className={ui.btnSecondary}>
              Ver auditoría
            </Link>
            <Link href="/admin/asignaciones" className={ui.btnPrimary}>
              Nueva asignación
            </Link>
          </>
        }
      />

      <div className={ui.kpiGrid}>
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <StatsCard
              key={kpi.key}
              label={kpi.label}
              value={metrics[kpi.key].toLocaleString("es-CO")}
              foot={kpi.foot}
              icon={Icon}
              tone={kpi.tone}
            />
          );
        })}
        <StatsCard
          label="Asistencia global"
          value={`${metrics.pct}%`}
          foot={`${metrics.presentes.toLocaleString("es-CO")} de ${metrics.registros.toLocaleString("es-CO")} registros`}
          icon={UserCheck}
          tone={metrics.pct >= 80 ? "accent" : "warn"}
        />
      </div>

      <SplitGrid
        main={
          <>
            <ChartCard
              title="Tendencia de asistencia"
              sub="Asistencia por fecha y volumen de registros"
              actions={
                <Link href="/admin/reportes" className={ui.linkBtn}>
                  Ver reportes <ArrowRight aria-hidden="true" />
                </Link>
              }
            >
              <LineChart points={trend} average={metrics.pct} threshold={umbral} />
            </ChartCard>

            <ChartCard title="Asistencia por programa" sub="Ordenado de menor a mayor presencia">
              {byPrograma.length ? (
                <HBars
                  rows={byPrograma.map((row) => ({
                    label: row.label,
                    value: row.pct,
                    display: `${row.pct}%`,
                  }))}
                />
              ) : (
                <p className={ui.cellMuted}>Sin sesiones registradas en el periodo.</p>
              )}
            </ChartCard>

            <ChartCard title="Composición del periodo" sub="Sesiones por estado de avance">
              {porEstado.length ? (
                <StackedColumns
                  columns={porEstado.map((bucket) => ({
                    label: bucket.label,
                    total: bucket.value,
                    parts: [{ key: bucket.key, label: bucket.label, value: bucket.value }],
                  }))}
                  colors={Object.fromEntries(porEstado.map((b) => [b.key, b.color]))}
                />
              ) : (
                <p className={ui.cellMuted}>Aún no hay sesiones creadas.</p>
              )}
            </ChartCard>
          </>
        }
        side={
          <>
            <ChartCard
              title="Estado de las sesiones"
              sub={`${db.sessions.length} sesiones en total`}
            >
              <Donut
                value={db.sessions.filter((s) =>
                  ["Cerrada", "Validada", "Firmada"].includes(s.estado),
                ).length}
                total={db.sessions.length}
                label="avanzadas"
                hideLegend
                segments={porEstado.map((bucket) => ({
                  label: bucket.label,
                  value: bucket.value,
                  color: bucket.color,
                }))}
              />
              <ul className={ui.legendList}>
                {porEstado.map((bucket) => (
                  <li key={bucket.key}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <i style={{ background: bucket.color }} aria-hidden="true" />
                      {bucket.label}
                    </span>
                    <b>{bucket.value}</b>
                  </li>
                ))}
              </ul>
            </ChartCard>

            <ChartCard title="Alertas" sub="Estados que requieren acción">
              <ul className={ui.alertList}>
                <li>
                  <CalendarClock aria-hidden="true" />
                  <span>
                    <b>{metrics.programadas}</b> sesiones programadas
                  </span>
                </li>
                <li>
                  <PenLine aria-hidden="true" />
                  <span>
                    <b>{metrics.pendientesFirma}</b> pendientes de validar o firmar
                  </span>
                </li>
                <li>
                  <AlertTriangle aria-hidden="true" />
                  <span>
                    <b>{riesgo.length}</b> estudiantes bajo el {umbral}% de asistencia
                  </span>
                </li>
              </ul>
            </ChartCard>
          </>
        }
      />

      <div className={ui.twoCol}>
        <ChartCard
          title="Sesiones que requieren seguimiento"
          sub="Borrador, programada, abierta o cerrada"
          actions={
            <Link href="/admin/asistencias" className={ui.linkBtn}>
              Administrar
            </Link>
          }
        >
          {pendientes.length === 0 ? (
            <p className={ui.cellMuted}>No hay sesiones pendientes.</p>
          ) : (
            <table className={ui.miniTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Asignatura</th>
                  <th>Grupo</th>
                  <th align="right">Asistencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((s) => (
                  <tr key={s.id}>
                    <td className={ui.cellMuted}>{s.fecha}</td>
                    <td>{s.asignatura}</td>
                    <td className={ui.cellMuted}>{s.grupo}</td>
                    <td align="right">{s.resumen.pct}%</td>
                    <td>
                      <Pill tone={tonoEstado(s.estado)}>{s.estado}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>

        <ChartCard
          title="Estudiantes en riesgo"
          sub={`Menos del ${umbral}% de asistencia acumulada`}
          actions={
            <Link href="/admin/reportes" className={ui.linkBtn}>
              Reporte completo
            </Link>
          }
        >
          {riesgo.length === 0 ? (
            <p className={ui.cellMuted}>Ningún estudiante por debajo del umbral.</p>
          ) : (
            <table className={ui.miniTable}>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Grupo</th>
                  <th align="right">Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {riesgo.slice(0, 8).map((row) => (
                  <tr key={row.estudiante.id}>
                    <td>{row.estudiante.nombre}</td>
                    <td className={ui.cellMuted}>
                      {index.grupo.get(row.estudiante.grupoId)?.nombre ?? "—"}
                    </td>
                    <td align="right">
                      <Pill tone={row.pct < 60 ? "danger" : "warn"}>{row.pct}%</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>
      </div>
    </>
  );
}
