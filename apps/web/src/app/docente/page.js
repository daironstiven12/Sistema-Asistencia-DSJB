/* Dashboard del docente: carga asignada, sesiones del día y estado de
   los registros que le corresponde cerrar. */

"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, CalendarClock, Users } from "lucide-react";
import {
  CHART_COLORS,
  ChartCard,
  DataTable,
  Pill,
  StatsCard,
  StackedColumns,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { ESTADOS_SESION, tonoEstado } from "@/features/shared/selectors";
import { transicionesDesde } from "@/features/shared/flowAdapter";
import { clasesDelDocente, sesionesDelDocente } from "@/features/shared/roleSelectors";

const COLOR_ESTADO = {
  Borrador: "var(--border-3)",
  Programada: CHART_COLORS.info,
  Abierta: CHART_COLORS.warn,
  Cerrada: CHART_COLORS.accent,
  Validada: CHART_COLORS.teal,
  Firmada: CHART_COLORS.ok,
};

export default function DocenteDashboard() {
  const { db, leerSesion, resumenSesion, cargaDocente, index } = useAcademy();
  const clases = clasesDelDocente(db);
  const sesiones = sesionesDelDocente(db).map((s) => ({
    ...leerSesion(s.id),
    resumen: resumenSesion(s.id),
  }));
  const carga = cargaDocente(clases[0]?.docenteId);

  const porEstado = ESTADOS_SESION.map((estado) => ({
    key: estado,
    label: estado,
    value: sesiones.filter((s) => s.estado === estado).length,
    color: COLOR_ESTADO[estado],
  })).filter((bucket) => bucket.value > 0);

  const pendientes = sesiones
    .filter((s) => transicionesDesde(s.estado).length > 0)
    .slice(0, 5);

  return (
    <>
      <PageHead
        eyebrow="Docencia"
        title="Mis clases"
        sub={`${clases.length} asignaciones activas en el periodo vigente.`}
        actions={
          <Link href="/docente/asistencias" className={ui.btnPrimary}>
            Registrar asistencia
          </Link>
        }
      />

      <div className={ui.kpiGrid}>
        <StatsCard
          label="Asignaciones"
          value={clases.length}
          foot="clases activas"
          icon={BookMarked}
          tone="accent"
        />
        <StatsCard
          label="Sesiones"
          value={sesiones.length}
          foot="registradas"
          icon={CalendarClock}
          tone="info"
        />
        <StatsCard
          label="Asistencia"
          value={`${carga.pct}%`}
          foot={`${carga.registros} registros`}
          icon={Users}
          tone={carga.pct >= 80 ? "teal" : "warn"}
        />
        <StatsCard
          label="Pendientes"
          value={carga.pendientes}
          foot="sin abrir o cerrar"
          tone="warn"
        />
      </div>

      <div className={ui.twoCol}>
        <ChartCard title="Composición de sesiones" sub="Distribución por estado de avance">
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
            <p className={ui.cellMuted}>Aún no hay sesiones en tus clases.</p>
          )}
        </ChartCard>

        <ChartCard
          title="Siguientes pasos"
          sub="Sesiones que admiten cambio de estado"
          actions={
            <Link href="/docente/asistencias" className={ui.linkBtn}>
              Ver todas
            </Link>
          }
        >
          {pendientes.length === 0 ? (
            <p className={ui.cellMuted}>No tienes sesiones pendientes de gestión.</p>
          ) : (
            <ul className={ui.riskList}>
              {pendientes.map((s) => (
                <li key={s.id}>
                  <div>
                    <b>{s.asignatura}</b>
                    <span className={ui.cellMuted}>
                      {s.fecha} · {s.grupo}
                    </span>
                  </div>
                  <Pill tone={tonoEstado(s.estado)}>{s.estado}</Pill>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Carga académica"
        sub="Asignaturas, grupos y horario"
        actions={
          <Link href="/docente/clases" className={ui.linkBtn}>
            Detalle <ArrowRight aria-hidden="true" />
          </Link>
        }
      >
        {clases.length === 0 ? (
          <p className={ui.cellMuted}>No tienes asignaciones activas.</p>
        ) : (
          <DataTable
            columns={[
              { key: "asignatura", header: "Asignatura" },
              {
                key: "grupo",
                header: "Grupo",
                render: (row) => (
                  <span>
                    {row.grupo?.nombre ?? "—"}
                    <p className={ui.cellMuted}>{row.grupo?.aula}</p>
                  </span>
                ),
              },
              { key: "horario", header: "Horario", muted: true, nowrap: true },
              { key: "periodo", header: "Periodo", muted: true },
              {
                key: "nivel",
                header: "Nivel",
                render: (row) => index.nivel.get(row.grupo?.nivelId)?.nombre ?? "—",
              },
            ]}
            rows={clases}
          />
        )}
      </ChartCard>
    </>
  );
}
