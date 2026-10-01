/* Inicio del estudiante: síntesis personal con sus materias, el estado de
   su asistencia y los pendientes de validación de sus representantes. */

"use client";

import Link from "next/link";
import { BookMarked, CalendarClock, TrendingUp, UserCheck } from "lucide-react";
import {
  CHART_COLORS,
  ChartCard,
  DataTable,
  Meter,
  Pill,
  StatsCard,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { estudianteActual, historialEstudiante, materiasDelEstudiante } from "@/features/shared/roleSelectors";
import { UMBRAL } from "@/features/shared/ai";

export default function EstudianteHome() {
  const { db } = useAcademy();
  const estudiante = estudianteActual(db);
  const materias = estudiante ? materiasDelEstudiante(db, estudiante.id) : [];
  const resumen = estudiante ? historialEstudiante(db, estudiante.id) : null;

  const total = resumen?.total ?? 0;
  const pct = resumen?.pct ?? 0;
  const detalle = resumen?.detalle ?? [];

  return (
    <>
      <PageHead
        eyebrow="Estudiante"
        title={`Hola, ${estudiante?.nombre?.split(" ")[0] ?? "estudiante"}`}
        sub="Tu asistencia en el periodo vigente, asignatura por asignatura."
        actions={
          <Link href="/estudiante/registro" className={ui.btnPrimary}>
            Registrar asistencia
          </Link>
        }
      />

      <div className={ui.kpiGrid}>
        <StatsCard label="Asistencia" value={`${pct}%`} foot="en el periodo" icon={TrendingUp} tone={pct >= UMBRAL ? "teal" : "warn"} />
        <StatsCard label="Materias" value={materias.length} foot="en curso" icon={BookMarked} tone="accent" />
        <StatsCard label="Registros" value={total} foot="totales" icon={CalendarClock} tone="info" />
        <StatsCard label="Presentes" value={resumen?.presentes ?? 0} foot="registros" icon={UserCheck} tone="teal" />
      </div>

      <div className={ui.twoCol}>
        <ChartCard title="Asistencia por asignatura" sub={`Umbral de riesgo: ${UMBRAL}%`}>
          {detalle.length === 0 ? (
            <p className={ui.cellMuted}>Aún no tienes registros de asistencia.</p>
          ) : (
            <ul className={ui.riskList}>
              {detalle.map((row) => (
                <li key={row.asignaturaId}>
                  <div style={{ flex: 1 }}>
                    <b>{row.asignatura}</b>
                    <Meter
                      value={row.presentes}
                      max={Math.max(1, row.total)}
                      tone={row.pct < 60 ? "danger" : row.pct < UMBRAL ? "warn" : undefined}
                    />
                    <span className={ui.cellMuted}>
                      {row.presentes} de {row.total} registros
                    </span>
                  </div>
                  <Pill tone={row.pct < 60 ? "danger" : row.pct < UMBRAL ? "warn" : "ok"}>
                    {row.pct}%
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard
          title="Mis materias"
          sub="Asignaturas del periodo"
          actions={
            <Link href="/estudiante/materias" className={ui.linkBtn}>
              Ver detalle
            </Link>
          }
        >
          {materias.length === 0 ? (
            <p className={ui.cellMuted}>No tienes materias asignadas.</p>
          ) : (
            <DataTable
              columns={[
                { key: "asignatura", header: "Materia" },
                { key: "docente", header: "Docente", muted: true },
                { key: "creditos", header: "Créditos", align: "right", muted: true },
              ]}
              rows={materias}
            />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Recomendaciones"
        sub="Acciones sugeridas según tu asistencia"
      >
        <ul className={ui.riskList}>
          {pct >= UMBRAL ? (
            <li>
              <div style={{ flex: 1 }}>
                <b>Mantén tu asistencia</b>
                <span className={ui.cellMuted}>
                  Estás por encima del umbral del periodo. Revisa el detalle para detectar asignaturas
                  con menor seguimiento.
                </span>
              </div>
              <Pill tone="ok">En rango</Pill>
            </li>
          ) : (
            <li>
              <div style={{ flex: 1 }}>
                <b>Asistencia por debajo del umbral</b>
                <span className={ui.cellMuted}>
                  Solicita a tus docentes las novedades de las fechas en las que no pudiste asistir.
                </span>
              </div>
              <Pill tone="warn">{pct}%</Pill>
            </li>
          )}
          <li>
            <div style={{ flex: 1 }}>
              <b>Registra cada día</b>
              <span className={ui.cellMuted}>
                Usa el registro diario para que tu representante valide la asistencia sin revisar todo
                el periodo.
              </span>
            </div>
            <Link href="/estudiante/registro" className={ui.linkBtn}>
              Registrar
            </Link>
          </li>
        </ul>
      </ChartCard>

      <div className={ui.twoCol}>
        <ChartCard title="Indicador global" sub={`Meta: ${UMBRAL}% o más`}>
          <Meter
            value={pct}
            max={100}
            tone={pct < 60 ? "danger" : pct < UMBRAL ? "warn" : undefined}
          />
          <p className={ui.cellMuted} style={{ marginTop: 10 }}>
            {resumen?.presentes ?? 0} de {total} registrosAssistidos.
          </p>
        </ChartCard>

        <ChartCard title="Colores de estado" sub="Referencia del sistema">
          <ul className={ui.legendList}>
            <li>
              <span>En rango</span>
              <span className={ui.dot} style={{ background: CHART_COLORS.ok }} />
            </li>
            <li>
              <span>En riesgo</span>
              <span className={ui.dot} style={{ background: CHART_COLORS.warn }} />
            </li>
            <li>
              <span>Crítico</span>
              <span className={ui.dot} style={{ background: CHART_COLORS.danger }} />
            </li>
          </ul>
        </ChartCard>
      </div>
    </>
  );
}
