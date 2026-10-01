/* Historial del estudiante: registro cronológico de sus asistencias con
   filtros por asignatura y por estado, alineado con la máquina de estados. */

"use client";

import { useState } from "react";
import { Download, ScrollText } from "lucide-react";
import {
  ChartCard,
  DataTable,
  EmptyState,
  HBars,
  Notice,
  Pill,
  StatsCard,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { estudianteActual, historialEstudiante } from "@/features/shared/roleSelectors";
import { UMBRAL } from "@/features/shared/ai";

const ESTADOS = ["Presente", "Ausente", "Tardanza", "Excusa"];

export default function HistorialPage() {
  const { db } = useAcademy();
  const estudiante = estudianteActual(db);
  const [materia, setMateria] = useState("todas");
  const [estado, setEstado] = useState("todos");

  const resumen = estudiante ? historialEstudiante(db, estudiante.id) : null;
  const detalle = resumen?.detalle ?? [];

  const eventos = (resumen?.eventos ?? [])
    .filter((r) => (materia === "todas" ? true : r.asignatura === materia))
    .filter((r) => (estado === "todos" ? true : r.estado === estado));

  const conteo = ESTADOS.map((e) => ({
    label: e,
    value: eventos.filter((r) => r.estado === e).length,
  })).filter((c) => c.value > 0);

  if (!estudiante) {
    return (
      <>
        <PageHead eyebrow="Estudiante" title="Mi historial" />
        <EmptyState icon={ScrollText} title="Sin estudiante" text="No hay un estudiante en sesión." />
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Estudiante"
        title="Mi historial"
        sub="Cada registro de asistencia del periodo, con su estado y su sesión."
        actions={
          <button type="button" className={ui.btnSecondary} disabled>
            <Download aria-hidden="true" />
            Exportar
          </button>
        }
      />

      <div className={ui.kpiGrid}>
        <StatsCard label="Asistencia" value={`${resumen?.pct ?? 0}%`} foot="del periodo" tone={resumen && resumen.pct >= UMBRAL ? "teal" : "warn"} />
        <StatsCard label="Registros" value={resumen?.total ?? 0} foot="totales" tone="info" />
        <StatsCard label="Presentes" value={resumen?.presentes ?? 0} tone="teal" />
        <StatsCard
          label="Ausencias"
          value={(resumen?.total ?? 0) - (resumen?.presentes ?? 0)}
          tone="warn"
        />
      </div>

      {resumen && resumen.pct < UMBRAL ? (
        <Notice tone="warn" icon={ScrollText}>
          Tu asistencia acumulada está por debajo del umbral del {UMBRAL}%. Solicita a tus docentes
          las novedades de las fechas marcadas como ausencia.
        </Notice>
      ) : null}

      <div className={ui.twoCol}>
        <ChartCard title="Filtros" sub="Acota el historial por asignatura o estado">
          <div className={ui.filterStack}>
            <label className={ui.label} htmlFor="filtro-materia">
              Asignatura
            </label>
            <select
              id="filtro-materia"
              className={ui.select}
              value={materia}
              onChange={(event) => setMateria(event.target.value)}
            >
              <option value="todas">Todas las asignaturas</option>
              {detalle.map((d) => (
                <option key={d.asignaturaId} value={d.asignatura}>
                  {d.asignatura}
                </option>
              ))}
            </select>

            <label className={ui.label} htmlFor="filtro-estado">
              Estado del registro
            </label>
            <select
              id="filtro-estado"
              className={ui.select}
              value={estado}
              onChange={(event) => setEstado(event.target.value)}
            >
              <option value="todos">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </ChartCard>

        <ChartCard title="Distribución" sub="Registros filtrados por estado">
          {conteo.length === 0 ? (
            <p className={ui.cellMuted}>Sin registros para los filtros aplicados.</p>
          ) : (
            <HBars
              rows={conteo.map((c) => ({ label: c.label, value: c.value, display: String(c.value) }))}
            />
          )}
        </ChartCard>
      </div>

      <ChartCard title="Detalle" sub={`${eventos.length} registros`}>
        {eventos.length === 0 ? (
          <p className={ui.cellMuted}>No hay registros que coincidan con los filtros.</p>
        ) : (
          <DataTable
            columns={[
              { key: "fecha", header: "Fecha", muted: true, nowrap: true },
              { key: "asignatura", header: "Asignatura" },
              {
                key: "estado",
                header: "Registro",
                render: (row) => (
                  <Pill
                    tone={
                      row.estado === "Presente"
                        ? "ok"
                        : row.estado === "Ausente"
                          ? "danger"
                          : row.estado === "Tardanza"
                            ? "warn"
                            : "neutral"
                    }
                  >
                    {row.estado}
                  </Pill>
                ),
              },
              {
                key: "estadoSesion",
                header: "Sesión",
                render: (row) => <Pill tone="neutral">{row.estadoSesion}</Pill>,
              },
              { key: "hora", header: "Hora", muted: true, nowrap: true },
              { key: "observacion", header: "Observación", grow: true, muted: true, render: (row) => row.observacion ?? "—" },
            ]}
            rows={eventos}
          />
        )}
      </ChartCard>
    </>
  );
}
