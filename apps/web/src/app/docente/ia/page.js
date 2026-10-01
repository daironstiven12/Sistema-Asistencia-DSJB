/* Asistente IA del docente: el análisis se ejecuta en el cliente sobre
   las sesiones propias, sin enviar datos a ningún servicio. */

"use client";

import { Sparkles, Wand2 } from "lucide-react";
import {
  ChartCard,
  Notice,
  Pill,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { clasesDelDocente, sesionesDelDocente } from "@/features/shared/roleSelectors";

const SUGERENCIAS = [
  "Alumnos que están por debajo del umbral en mis clases",
  "Asignaturas con mayor número de ausencias",
  "Recomendaciones de seguimiento para este periodo",
];

export default function DocenteIaPage() {
  const { db, leerSesion, resumenSesion } = useAcademy();
  const clases = clasesDelDocente(db);
  const sesiones = sesionesDelDocente(db);

  /* Reutiliza el mismo analizador que el panel administrativo, pero con el
     alcance acotado a las sesiones del docente. */
  const porAsignatura = new Map();
  sesiones.forEach((s) => {
    const sesion = leerSesion(s.id);
    const resumen = resumenSesion(s.id);
    const actual = porAsignatura.get(sesion.asignatura) ?? { total: 0, presentes: 0 };
    actual.total += resumen.total;
    actual.presentes += resumen.presentes;
    porAsignatura.set(sesion.asignatura, actual);
  });
  const filas = Array.from(porAsignatura.entries())
    .map(([asignatura, v]) => ({
      asignatura,
      total: v.total,
      presentes: v.presentes,
      pct: v.total ? Math.round((v.presentes / v.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);

  const bajoUmbral = filas.filter((f) => f.pct < 75);

  return (
    <>
      <PageHead
        eyebrow="Docencia"
        title="Asistente IA"
        sub="Análisis de asistencia limitado a tus clases."
        actions={
          <span className={ui.badgeSoft}>
            <Sparkles aria-hidden="true" />
            Análisis local
          </span>
        }
      />

      <Notice tone="info" icon={Wand2}>
        El asistente opera sobre los datos ya cargados en el navegador. Cuando se conecte el
        servicio de IA, esta misma vista consumirá el endpoint correspondiente.
      </Notice>

      <div className={ui.twoCol}>
        <ChartCard title="Hallazgos" sub="Sobre tus clases del periodo">
          {sesiones.length === 0 ? (
            <p className={ui.cellMuted}>Aún no hay sesiones para analizar.</p>
          ) : (
            <ul className={ui.riskList}>
              {filas.slice(0, 4).map((f) => (
                <li key={f.asignatura}>
                  <div>
                    <b>{f.asignatura}</b>
                    <span className={ui.cellMuted}>
                      {f.presentes} de {f.total} registros
                    </span>
                  </div>
                  <Pill tone={f.pct < 60 ? "danger" : f.pct < 75 ? "warn" : "ok"}>
                    {f.pct}%
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="Consultas frecuentes" sub="Atajos a los análisis del sistema">
          <ul className={ui.riskList}>
            {SUGERENCIAS.map((s) => (
              <li key={s}>
                <div style={{ flex: 1 }}>
                  <b>{s}</b>
                </div>
                <Pill tone="neutral">Local</Pill>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {bajoUmbral.length > 0 ? (
        <ChartCard title="Asignaturas que requieren seguimiento" sub="Bajo el 75% de asistencia">
          <ul className={ui.riskList}>
            {bajoUmbral.map((f) => (
              <li key={f.asignatura}>
                <div style={{ flex: 1 }}>
                  <b>{f.asignatura}</b>
                  <span className={ui.cellMuted}>
                    Asignada a {clases.filter((c) => c.asignatura === f.asignatura).length} grupo(s)
                  </span>
                </div>
                <Pill tone="warn">{f.pct}%</Pill>
              </li>
            ))}
          </ul>
        </ChartCard>
      ) : null}
    </>
  );
}
