/* Asistente IA: análisis local sobre el estado del provider. Las
   consultas rápidas devuelven datos estructurados; la pregunta libre usa
   el análisis completo. La interfaz está lista para enviar la pregunta a
   un endpoint sin cambiar las pantallas. */

"use client";

import { useState } from "react";
import { Sparkles, TriangleAlert, Wand2 } from "lucide-react";
import { ChartCard, HBars, Notice, Pill, StatsCard, ui } from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { consultaRapida, ejecutarAnalisis } from "@/features/shared/ai";

const PRIORIDAD = {
  Alta: "danger",
  Media: "warn",
  Baja: "info",
};

const PREGUNTAS = [
  "¿Qué asignaturas tienen menor asistencia?",
  "¿Cuántas sesiones se realizaron este periodo?",
  "¿Qué grupos tienen más registros manuales?",
  "Resume la asistencia del periodo actual.",
];

export default function IaPage() {
  const { db } = useAcademy();
  const [pregunta, setPregunta] = useState("");
  const [resultado, setResultado] = useState(() => ejecutarAnalisis(db, ""));
  const [rapida, setRapida] = useState(null);

  function analizar(texto) {
    const consulta = consultaRapida(db, texto);
    setRapida(consulta);
    setResultado(ejecutarAnalisis(db, texto));
  }

  function enviar(event) {
    event.preventDefault();
    analizar(pregunta);
  }

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Analítica IA"
        sub="Lectura analítica del estado de asistencia del periodo."
      />

      <form onSubmit={enviar} className={ui.toolbar}>
        <div className={ui.search} style={{ flex: "1 1 420px" }}>
          <Wand2 aria-hidden="true" />
          <input
            type="text"
            value={pregunta}
            onChange={(event) => setPregunta(event.target.value)}
            placeholder="Pregunta sobre la asistencia del periodo"
            aria-label="Consulta para el asistente"
          />
        </div>
        <button type="submit" className={ui.btnPrimary}>
          <Sparkles aria-hidden="true" />
          Analizar
        </button>
      </form>

      <div className={ui.filterBar} style={{ marginBottom: 16 }}>
        {PREGUNTAS.map((p) => (
          <button
            key={p}
            type="button"
            className={ui.btnSecondary}
            onClick={() => {
              setPregunta(p);
              analizar(p);
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {rapida ? (
        <ChartCard title={rapida.titulo} sub="Respuesta directa sobre los datos">
          <HBars rows={rapida.filas.map((f) => ({ label: f.label, value: f.value, display: f.display }))} />
          {rapida.filas[0]?.detalle ? (
            <ul className={ui.riskList} style={{ marginTop: 12 }}>
              {rapida.filas.map((f) => (
                <li key={f.label}>
                  <div>
                    <b>{f.label}</b>
                    <span className={ui.cellMuted}>{f.detalle}</span>
                  </div>
                  <Pill tone="neutral">{f.display}</Pill>
                </li>
              ))}
            </ul>
          ) : null}
        </ChartCard>
      ) : null}

      <section className={ui.card}>
        <div className={ui.cardHead}>
          <div>
            <h2 className={ui.eyebrow}>Análisis completo</h2>
            <p className={ui.cellMuted}>{resultado.pregunta}</p>
          </div>
          <Pill tone="info">{resultado.generadoEn}</Pill>
        </div>
        <p style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.01em", margin: "0 0 4px" }}>
          {resultado.titulo}
        </p>
        <p className={ui.cellMuted}>
          Análisis generado sobre {resultado.metricas.registros.toLocaleString("es-CO")} registros de{" "}
          {resultado.metricas.sesiones} sesiones.
        </p>
      </section>

      <div className={ui.kpiGrid}>
        <StatsCard label="Asistencia" value={`${resultado.metricas.pct}%`} foot="acumulada del periodo" tone="accent" />
        <StatsCard label="Sesiones" value={resultado.metricas.sesiones} foot="creadas en total" tone="info" />
        <StatsCard label="Estudiantes" value={resultado.metricas.estudiantes} foot="en el periodo" tone="teal" />
        <StatsCard label="Hallazgos" value={resultado.hallazgos.length} foot="puntos detectados" tone="warn" />
      </div>

      <div className={ui.twoCol}>
        <ChartCard title="Hallazgos" sub="Lecturas derivadas del estado actual">
          <ul className={ui.alertList}>
            {resultado.hallazgos.map((item) => (
              <li key={item.titulo}>
                <Sparkles aria-hidden="true" />
                <span>
                  <b style={{ display: "block" }}>{item.titulo}</b>
                  {item.detalle}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Recomendaciones" sub="Acciones sugeridas por prioridad">
          <ul className={ui.alertList}>
            {resultado.recomendaciones.map((item) => (
              <li key={item.accion}>
                <TriangleAlert aria-hidden="true" />
                <span>
                  <b style={{ display: "block" }}>{item.accion}</b>
                  <span className={ui.cellMuted}>{item.detalle}</span>
                </span>
                <Pill tone={PRIORIDAD[item.prioridad] ?? "info"}>{item.prioridad}</Pill>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <Notice tone="info" icon={Sparkles}>
        El asistente opera sobre los datos ya cargados en el sistema. No realiza consultas externas ni
        modifica registros: todas las acciones se ejecutan desde los módulos y quedan auditadas.
      </Notice>
    </>
  );
}
