/* Mis materias: detalle por asignatura con el docente, el horario y el
   resumen de asistencia del estudiante. */

"use client";

import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";
import {
  ChartCard,
  DataTable,
  EmptyState,
  Meter,
  Pill,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead, SplitGrid } from "@/features/shared/PageHead";
import {
  estudianteActual,
  historialEstudiante,
  materiasDelEstudiante,
} from "@/features/shared/roleSelectors";
import { UMBRAL } from "@/features/shared/ai";

export default function MateriasPage() {
  const { db } = useAcademy();
  const estudiante = estudianteActual(db);
  const materias = estudiante ? materiasDelEstudiante(db, estudiante.id) : [];
  const resumen = estudiante ? historialEstudiante(db, estudiante.id) : null;
  const porAsignatura = new Map((resumen?.detalle ?? []).map((d) => [d.asignaturaId, d]));

  if (materias.length === 0) {
    return (
      <>
        <PageHead eyebrow="Estudiante" title="Mis materias" sub="Asignaturas del periodo vigente." />
        <EmptyState
          icon={GraduationCap}
          title="Sin materias"
          text="No tienes asignaturas registradas en el periodo vigente."
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Estudiante"
        title="Mis materias"
        sub="Asignaturas del periodo vigente con tu asistencia en cada una."
      />

      <SplitGrid
        main={
          <ChartCard title="Asignaturas" sub="Detalle y asistencia por materia">
            <DataTable
              columns={[
                {
                  key: "asignatura",
                  header: "Materia",
                  render: (row) => (
                    <div>
                      <b style={{ fontSize: 13.5 }}>{row.asignatura}</b>
                      <p className={ui.cellMuted}>
                        {row.creditos} créditos · {row.horario ?? "Horario por confirmar"}
                      </p>
                    </div>
                  ),
                },
                { key: "docente", header: "Docente", muted: true },
                {
                  key: "pct",
                  header: "Asistencia",
                  align: "right",
                  render: (row) => {
                    const dato = porAsignatura.get(row.asignaturaId);
                    return (
                      <Pill
                        tone={
                          !dato
                            ? "neutral"
                            : dato.pct < 60
                              ? "danger"
                              : dato.pct < UMBRAL
                                ? "warn"
                                : "ok"
                        }
                      >
                        {dato ? `${dato.pct}%` : "—"}
                      </Pill>
                    );
                  },
                },
                {
                  key: "__detalle",
                  header: "",
                  align: "right",
                  render: (row) => (
                    <Link href="/estudiante/historial" className={ui.linkBtn}>
                      Historial
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  ),
                },
              ]}
              rows={materias}
            />
          </ChartCard>
        }
        side={
          <ChartCard title="Resumen por materia" sub="Presentes sobre el total de registros">
            <ul className={ui.riskList}>
              {(resumen?.detalle ?? []).map((d) => (
                <li key={d.asignaturaId}>
                  <div style={{ flex: 1 }}>
                    <b>{d.asignatura}</b>
                    <Meter
                      value={d.presentes}
                      max={Math.max(1, d.total)}
                      tone={d.pct < 60 ? "danger" : d.pct < UMBRAL ? "warn" : undefined}
                    />
                  </div>
                  <Pill tone={d.pct < UMBRAL ? "warn" : "ok"}>{d.pct}%</Pill>
                </li>
              ))}
            </ul>
          </ChartCard>
        }
      />
    </>
  );
}
