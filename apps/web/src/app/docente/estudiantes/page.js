/* Estudiantes del docente: matrícula de sus grupos con asistencia
   acumulada y foco en quienes están en riesgo. */

"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
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
import { clasesDelDocente, estudiantesPorClase } from "@/features/shared/roleSelectors";
import { asistenciaDeEstudiante } from "@/features/shared/selectors";
import { UMBRAL } from "@/features/shared/ai";

export default function EstudiantesPage() {
  const { db, index } = useAcademy();
  const clases = clasesDelDocente(db);
  const [claseId, setClaseId] = useState(clases[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const clase = clases.find((c) => c.id === claseId) ?? clases[0];
  const todos = clase ? estudiantesPorClase(db, clase.id) : [];
  const visibles = todos.filter((e) =>
    query.trim()
      ? [e.nombre, e.identificacion].join(" ").toLowerCase().includes(query.toLowerCase())
      : true,
  );
  const enRiesgo = todos.filter((e) => e.asistencia.pct < UMBRAL);

  if (clases.length === 0) {
    return (
      <>
        <PageHead eyebrow="Docencia" title="Estudiantes" sub="Matrícula de tus grupos." />
        <EmptyState icon={Users} title="Sin grupos" text="No tienes grupos asignados." />
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Docencia"
        title="Estudiantes"
        sub="Matrícula de tus grupos con la asistencia acumulada de cada estudiante."
        actions={
          <select
            className={ui.select}
            style={{ width: "auto" }}
            value={clase?.id ?? ""}
            onChange={(event) => setClaseId(event.target.value)}
            aria-label="Elegir grupo"
          >
            {clases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grupo?.nombre} · {c.asignatura}
              </option>
            ))}
          </select>
        }
      />

      <SplitGrid
        main={
          <ChartCard
            title={clase ? `${clase.grupo?.nombre} · ${clase.asignatura}` : "Matrícula"}
            sub={`${visibles.length} estudiantes`}
          >
            <div className={ui.search}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o identificación"
                aria-label="Buscar estudiante"
              />
            </div>

            {visibles.length === 0 ? (
              <p className={ui.cellMuted}>Ningún estudiante coincide con la búsqueda.</p>
            ) : (
              <DataTable
                columns={[
                  {
                    key: "nombre",
                    header: "Estudiante",
                    render: (row) => (
                      <div>
                        <b style={{ fontSize: 13.5 }}>{row.nombre}</b>
                        <p className={ui.cellMuted}>{row.identificacion}</p>
                      </div>
                    ),
                  },
                  {
                    key: "pct",
                    header: "Asistencia",
                    align: "right",
                    render: (row) => (
                      <Pill tone={row.asistencia.pct < 60 ? "danger" : row.asistencia.pct < UMBRAL ? "warn" : "ok"}>
                        {row.asistencia.pct}%
                      </Pill>
                    ),
                  },
                  {
                    key: "registros",
                    header: "Registros",
                    align: "right",
                    muted: true,
                    render: (row) => `${row.asistencia.presentes}/${row.asistencia.total}`,
                  },
                  {
                    key: "ultima",
                    header: "Última sesión",
                    muted: true,
                    render: (row) => row.asistencia.ultima?.fecha ?? "—",
                  },
                ]}
                rows={visibles}
              />
            )}
          </ChartCard>
        }
        side={
          <>
            <ChartCard title="En riesgo" sub={`Menos del ${UMBRAL}% acumulado`}>
              {enRiesgo.length === 0 ? (
                <p className={ui.cellMuted}>Ningún estudiante por debajo del umbral.</p>
              ) : (
                <ul className={ui.riskList}>
                  {enRiesgo.map((e) => (
                    <li key={e.id}>
                      <div>
                        <b>{e.nombre}</b>
                        <span className={ui.cellMuted}>
                          {e.asistencia.presentes} de {e.asistencia.total}
                        </span>
                      </div>
                      <Pill tone={e.asistencia.pct < 60 ? "danger" : "warn"}>
                        {e.asistencia.pct}%
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>

            <ChartCard title="Detalle por asignatura" sub="Del grupo con menor asistencia">
              {(() => {
                const detalle = enRiesgo[0]
                  ? asistenciaDeEstudiante(db, enRiesgo[0].id).detalle
                  : todos[0]
                    ? asistenciaDeEstudiante(db, todos[0].id).detalle
                    : [];
                if (detalle.length === 0) {
                  return <p className={ui.cellMuted}>Sin datos de asistencia.</p>;
                }
                return (
                  <ul className={ui.riskList}>
                    {detalle.map((row) => (
                      <li key={row.asignaturaId}>
                        <div style={{ flex: 1 }}>
                          <b>{row.asignatura}</b>
                          <Meter
                            value={row.presentes}
                            max={Math.max(1, row.total)}
                            tone={row.pct < UMBRAL ? "warn" : undefined}
                          />
                        </div>
                        <Pill tone={row.pct < UMBRAL ? "warn" : "ok"}>{row.pct}%</Pill>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </ChartCard>

            <ChartCard title="Grupo" sub="Datos del aula">
              <dl className={ui.defList}>
                <div>
                  <dt>Programa</dt>
                  <dd>
                    {index.programa.get(clase?.grupo?.programaId)?.nombre ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>Nivel</dt>
                  <dd>{index.nivel.get(clase?.grupo?.nivelId)?.nombre ?? "—"}</dd>
                </div>
                <div>
                  <dt>Aula</dt>
                  <dd>{clase?.grupo?.aula ?? "—"}</dd>
                </div>
                <div>
                  <dt>Matriculados</dt>
                  <dd>{todos.length}</dd>
                </div>
              </dl>
            </ChartCard>
          </>
        }
      />
    </>
  );
}
