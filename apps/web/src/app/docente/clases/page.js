/* Clases del docente: detalle de cada asignación con sus sesiones y la
   matrícula del grupo. */

"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
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
import { clasesDelDocente, sesionesDelDocente } from "@/features/shared/roleSelectors";
import { tonoEstado } from "@/features/shared/selectors";

export default function ClasesPage() {
  const { db, leerSesion, resumenSesion, index } = useAcademy();
  const clases = clasesDelDocente(db);
  const sesiones = sesionesDelDocente(db);

  if (clases.length === 0) {
    return (
      <>
        <PageHead eyebrow="Docencia" title="Mis clases" sub="Asignaturas que tienes a tu cargo." />
        <EmptyState icon={Users} title="Sin asignaciones" text="No tienes clases activas en el periodo vigente." />
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Docencia"
        title="Mis clases"
        sub="Asignaturas que tienes a tu cargo en el periodo vigente."
      />

      <SplitGrid
        main={
          <ChartCard title="Asignaciones" sub="Cada fila es una clase con su grupo y horario">
            <DataTable
              columns={[
                {
                  key: "asignatura",
                  header: "Asignatura",
                  render: (row) => (
                    <div>
                      <b style={{ fontSize: 13.5 }}>{row.asignatura}</b>
                      <p className={ui.cellMuted}>
                        {index.asignatura.get(row.asignaturaId)?.codigo} ·{" "}
                        {index.asignatura.get(row.asignaturaId)?.creditos} créditos
                      </p>
                    </div>
                  ),
                },
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
                {
                  key: "sesiones",
                  header: "Sesiones",
                  align: "right",
                  render: (row) =>
                    sesiones.filter(
                      (s) => s.offeringId === row.oferta?.id,
                    ).length,
                },
                {
                  key: "__detalle",
                  header: "",
                  align: "right",
                  render: (row) => (
                    <Link
                      href={`/docente/asistencias?oferta=${row.oferta?.id ?? ""}`}
                      className={ui.linkBtn}
                    >
                      Ver
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  ),
                },
              ]}
              rows={clases}
            />
          </ChartCard>
        }
        side={
          <ChartCard title="Matrícula por grupo" sub="Estudiantes activos del periodo">
            {clases.map((clase) => {
              const matriculados = db.estudiantes.filter(
                (e) => e.grupoId === clase.grupoId && e.estado === "Activo",
              );
              return (
                <div key={clase.id} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    <b>{clase.grupo?.nombre ?? "—"}</b>
                    <span className={ui.cellMuted}>
                      {matriculados.length} / {clase.grupo?.capacidad ?? "—"}
                    </span>
                  </div>
                  <Meter
                    value={matriculados.length}
                    max={clase.grupo?.capacidad ?? matriculados.length}
                    tone={
                      matriculados.length > (clase.grupo?.capacidad ?? Infinity)
                        ? "danger"
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </ChartCard>
        }
      />

      <ChartCard title="Sesiones por clase" sub="Últimas registradas en tus grupos">
        <DataTable
          columns={[
            { key: "fecha", header: "Fecha", muted: true, nowrap: true },
            {
              key: "asignatura",
              header: "Asignatura",
              render: (row) => leerSesion(row.id)?.asignatura ?? "—",
            },
            { key: "tema", header: "Tema", grow: true, muted: true },
            {
              key: "resumen",
              header: "Asistencia",
              align: "right",
              render: (row) => {
                const resumen = resumenSesion(row.id);
                return (
                  <span>
                    <b>{resumen.pct}%</b>
                    <p className={ui.cellMuted}>
                      {resumen.presentes}/{resumen.total}
                    </p>
                  </span>
                );
              },
            },
            {
              key: "estado",
              header: "Estado",
              render: (row) => (
                <Pill tone={tonoEstado(row.estado)}>{row.estado}</Pill>
              ),
            },
          ]}
          rows={sesiones.slice(0, 10)}
        />
      </ChartCard>
    </>
  );
}
