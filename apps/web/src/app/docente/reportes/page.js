/* Reportes del docente: alcance limitado a sus propias clases. */

"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import {
  ChartCard,
  Donut,
  HBars,
  LineChart,
  Pill,
  StatsCard,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { clasesDelDocente, sesionesDelDocente } from "@/features/shared/roleSelectors";
import { UMBRAL } from "@/features/shared/ai";

export default function DocenteReportesPage() {
  const { db, leerSesion, resumenSesion } = useAcademy();
  const clases = clasesDelDocente(db);
  const sesiones = sesionesDelDocente(db).map((s) => ({
    ...leerSesion(s.id),
    resumen: resumenSesion(s.id),
  }));

  const totales = sesiones.reduce(
    (acc, s) => ({
      total: acc.total + s.resumen.total,
      presentes: acc.presentes + s.resumen.presentes,
      ausentes: acc.ausentes + s.resumen.ausentes,
    }),
    { total: 0, presentes: 0, ausentes: 0 },
  );
  const pct = totales.total
    ? Math.round((totales.presentes / totales.total) * 100)
    : 0;

  /* Restringe el análisis a las sesiones propias: no se llama a
     agrupar(db) porque agregaría las de otros docentes. */
  const porGrupo = new Map();
  sesiones.forEach((s) => {
    const actual = porGrupo.get(s.grupo) ?? { label: s.grupo, total: 0, presentes: 0 };
    actual.total += s.resumen.total;
    actual.presentes += s.resumen.presentes;
    porGrupo.set(s.grupo, actual);
  });
  const grupos = Array.from(porGrupo.values())
    .map((g) => ({
      ...g,
      pct: g.total ? Math.round((g.presentes / g.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);

  const porFecha = new Map();
  sesiones.forEach((s) => {
    const actual = porFecha.get(s.fecha) ?? { label: s.fecha.slice(5), total: 0, presentes: 0 };
    actual.total += s.resumen.total;
    actual.presentes += s.resumen.presentes;
    porFecha.set(s.fecha, actual);
  });
  const tendencia = Array.from(porFecha.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      label: v.label,
      value: v.total ? Math.round((v.presentes / v.total) * 100) : 0,
      total: v.total,
    }));

  return (
    <>
      <PageHead
        eyebrow="Docencia"
        title="Reportes"
        sub="Indicadores de tus clases en el periodo vigente."
        actions={
          <button type="button" className={ui.btnSecondary} disabled>
            <FileDown aria-hidden="true" />
            Descargar informe
          </button>
        }
      />

      <div className={ui.kpiGrid}>
        <StatsCard label="Asistencia" value={`${pct}%`} foot="en tus clases" tone="accent" />
        <StatsCard label="Registros" value={totales.total} foot="totales del periodo" tone="info" />
        <StatsCard label="Presentes" value={totales.presentes} tone="teal" />
        <StatsCard label="Ausencias" value={totales.ausentes} tone="warn" />
      </div>

      <ChartCard title="Tendencia por fecha" sub="Asistencia por jornada y registros de cada una">
        {tendencia.length ? (
          <LineChart
            points={tendencia}
            average={pct}
            threshold={db.config?.umbralRiesgo}
          />
        ) : (
          <p className={ui.cellMuted}>Sin sesiones registradas.</p>
        )}
      </ChartCard>

      <div className={ui.twoCol}>
        <ChartCard title="Por grupo" sub="De menor a mayor asistencia">
          {grupos.length ? (
            <HBars
              rows={grupos.map((g) => ({
                label: g.label,
                value: g.pct,
                display: `${g.pct}%`,
              }))}
            />
          ) : (
            <p className={ui.cellMuted}>Sin datos por grupo.</p>
          )}
        </ChartCard>

        <ChartCard title="Composición" sub="Presentes y ausentes">
          <Donut
            value={totales.presentes}
            total={totales.total}
            label="de asistencia"
            segments={[
              { label: "Presentes", value: totales.presentes, color: "var(--chart-1)" },
              { label: "Ausentes", value: totales.ausentes, color: "var(--chart-5)" },
            ]}
          />
          <ul className={ui.legendList}>
            <li>
              <span>Presentes</span>
              <b>{totales.presentes}</b>
            </li>
            <li>
              <span>Ausentes</span>
              <b>{totales.ausentes}</b>
            </li>
            <li>
              <span>Umbral de riesgo</span>
              <b>{UMBRAL}%</b>
            </li>
          </ul>
        </ChartCard>
      </div>

      <ChartCard
        title="Sesiones del periodo"
        sub="Detalle por asignatura y fecha"
        actions={
          <Link href="/docente/asistencias" className={ui.linkBtn}>
            Gestionar
          </Link>
        }
      >
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
            {sesiones.map((s) => (
              <tr key={s.id}>
                <td className={ui.cellMuted}>{s.fecha}</td>
                <td>{s.asignatura}</td>
                <td className={ui.cellMuted}>{s.grupo}</td>
                <td align="right">{s.resumen.pct}%</td>
                <td>
                  <Pill tone={s.resumen.pct >= UMBRAL ? "ok" : "warn"}>
                    {s.resumen.presentes}/{s.resumen.total}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartCard>
    </>
  );
}
