/* Registro de asistencia del estudiante: el estudiante confirma su propia
   asistencia del día. Solo puede marcar las sesiones del periodo vigente y
   en estado Abierta. */

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ListChecks, Lock } from "lucide-react";
import {
  ChartCard,
  DataTable,
  EmptyState,
  Notice,
  Pill,
  SearchBar,
  StatsCard,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { estudianteActual, sesionesDelEstudiante } from "@/features/shared/roleSelectors";
import { tonoEstado } from "@/features/shared/selectors";

export default function RegistroPage() {
  const { db, leerSesion, resumenSesion, registerStudent } = useAcademy();
  const [query, setQuery] = useState("");
  const estudiante = estudianteActual(db);

  const sesiones = useMemo(() => {
    if (!estudiante) return [];
    const texto = query.trim().toLowerCase();
    return sesionesDelEstudiante(db, estudiante.id)
      .map((s) => ({ ...leerSesion(s.id), resumen: resumenSesion(s.id) }))
      .filter((s) =>
        texto ? [s.asignatura, s.grupo, s.fecha].join(" ").toLowerCase().includes(texto) : true,
      );
  }, [db, estudiante, query, leerSesion, resumenSesion]);

  const abiertas = sesiones.filter((s) => s.estado === "Abierta");
  const cerradas = sesiones.filter((s) => s.estado !== "Abierta");
  const misRegistros = new Map(
    db.records
      .filter((r) => r.estudianteId === estudiante?.id)
      .map((r) => [r.sesionId, r]),
  );

  return (
    <>
      <PageHead
        eyebrow="Estudiante"
        title="Registrar asistencia"
        sub="Confirma tu asistencia en las sesiones abiertas del periodo."
      />

      <Notice tone="info" icon={ListChecks}>
        Solo puedes registrar sesiones en estado Abierta. Las cerradas quedan para revisión de tu
        docente o representante.
      </Notice>

      <div className={ui.kpiGrid}>
        <StatsCard label="Abiertas" value={abiertas.length} foot="por confirmar" tone="warn" />
        <StatsCard label="Cerradas" value={cerradas.length} foot="ya procesadas" tone="info" />
        <StatsCard
          label="Confirmadas"
          value={sesiones.filter((s) => misRegistros.get(s.id)?.estado === "Presente").length}
          foot="registros tuyos"
          tone="teal"
        />
        <StatsCard
          label="Pendientes"
          value={abiertas.filter((s) => !misRegistros.has(s.id)).length}
          foot="sin registrar"
          tone="accent"
        />
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Buscar por asignatura, grupo o fecha"
        ariaLabel="Buscar sesión"
      />

      {sesiones.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Sin sesiones"
          text="No hay sesiones que coincidan con la búsqueda."
        />
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
                  <p className={ui.cellMuted}>
                    {row.grupo} · {row.horaInicio}
                  </p>
                </div>
              ),
            },
            {
              key: "mine",
              header: "Tu registro",
              render: (row) => {
                const registro = misRegistros.get(row.id);
                if (!registro) {
                  return <Pill tone="neutral">Sin registrar</Pill>;
                }
                return (
                  <Pill
                    tone={
                      registro.estado === "Presente"
                        ? "ok"
                        : registro.estado === "Ausente"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {registro.estado}
                  </Pill>
                );
              },
            },
            {
              key: "estado",
              header: "Sesión",
              render: (row) => <Pill tone={tonoEstado(row.estado)}>{row.estado}</Pill>,
            },
            {
              key: "__accion",
              header: "",
              align: "right",
              render: (row) =>
                row.estado !== "Abierta" ? (
                  <span className={ui.cellMuted}>
                    <Lock aria-hidden="true" />
                    No editable
                  </span>
                ) : misRegistros.get(row.id)?.estado === "Presente" ? (
                  <span className={ui.cellMuted}>Confirmado</span>
                ) : (
                  <button
                    type="button"
                    className={ui.linkBtn}
                    onClick={() =>
                      registerStudent(
                        row.id,
                        {
                          estudianteId: estudiante.id,
                          estado: "Presente",
                          hora: new Date().toTimeString().slice(0, 5),
                        },
                        "estudiante",
                      )
                    }
                  >
                    <CheckCircle2 aria-hidden="true" />
                    Confirmar asistencia
                  </button>
                ),
            },
          ]}
          rows={sesiones}
        />
      )}

      <ChartCard title="Cómo funciona" sub="Reglas del registro del estudiante">
        <ul className={ui.riskList}>
          <li>
            <div style={{ flex: 1 }}>
              <b>Sesiones abiertas</b>
              <span className={ui.cellMuted}>
                Solo las sesiones en estado Abierta admiten confirmación.
              </span>
            </div>
          </li>
          <li>
            <div style={{ flex: 1 }}>
              <b>Un registro por estudiante</b>
              <span className={ui.cellMuted}>
                Confirmar de nuevo actualiza el registro, no lo duplica.
              </span>
            </div>
          </li>
          <li>
            <div style={{ flex: 1 }}>
              <b>Revisión posterior</b>
              <span className={ui.cellMuted}>
                Tu representante valida las novedades y firma el acta del periodo.
              </span>
            </div>
          </li>
        </ul>
      </ChartCard>
    </>
  );
}
