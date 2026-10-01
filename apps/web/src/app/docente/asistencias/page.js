/* Registro de asistencia del docente. Es la pantalla operativa: abre la
   sesión, marca estudiantes y cierra. Las transiciones pasan por la
   máquina de estados, no por lógica local. */

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Lock, Play, Users } from "lucide-react";
import {
  ChartCard,
  DataTable,
  EmptyState,
  Meter,
  Notice,
  Pill,
  SearchBar,
  StatsCard,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { clasesDelDocente, sesionesDelDocente } from "@/features/shared/roleSelectors";
import { tonoEstado } from "@/features/shared/selectors";
import { transicionesDesde } from "@/features/shared/flowAdapter";

export default function DocenteAsistenciasPage() {
  const { db, leerSesion, resumenSesion, transitionSession, registerStudent } = useAcademy();
  const [query, setQuery] = useState("");
  const [activa, setActiva] = useState(null);

  const clases = clasesDelDocente(db);
  const sesiones = useMemo(() => {
    const ofertaIds = new Set(clases.map((c) => c.oferta?.id).filter(Boolean));
    const texto = query.trim().toLowerCase();
    return sesionesDelDocente(db)
      .filter((s) => ofertaIds.has(s.offeringId))
      .map((s) => ({ ...leerSesion(s.id), resumen: resumenSesion(s.id) }))
      .filter((s) =>
        texto
          ? [s.asignatura, s.grupo, s.tema].join(" ").toLowerCase().includes(texto)
          : true,
      );
  }, [db, clases, query, leerSesion, resumenSesion]);

  const detalle = activa ? leerSesion(activa) : null;
  const resumenActivo = activa ? resumenSesion(activa) : null;
  const registros = activa
    ? db.records
        .filter((r) => r.sesionId === activa)
        .map((r) => ({
          ...r,
          estudiante: db.estudiantes.find((e) => e.id === r.estudianteId),
        }))
        .sort((a, b) => a.estudiante?.nombre.localeCompare(b.estudiante?.nombre ?? ""))
    : [];

  return (
    <>
      <PageHead
        eyebrow="Docencia"
        title="Asistencias"
        sub="Abre la sesión, registra la asistencia y ciérrala para que el representante la valide."
      />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Buscar por asignatura, grupo o tema"
        ariaLabel="Buscar sesión"
      />

      {sesiones.length === 0 ? (
        <EmptyState
          icon={Users}
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
                  <p className={ui.cellMuted}>{row.tema}</p>
                </div>
              ),
            },
            { key: "grupo", header: "Grupo", muted: true },
            {
              key: "resumen",
              header: "Asistencia",
              align: "right",
              render: (row) => (
                <span>
                  <b style={{ fontVariantNumeric: "tabular-nums" }}>{row.resumen.pct}%</b>
                  <p className={ui.cellMuted}>
                    {row.resumen.presentes}/{row.resumen.total}
                  </p>
                </span>
              ),
            },
            {
              key: "estado",
              header: "Estado",
              render: (row) => <Pill tone={tonoEstado(row.estado)}>{row.estado}</Pill>,
            },
            {
              key: "__accion",
              header: "",
              align: "right",
              render: (row) => (
                <div>
                  <button
                    type="button"
                    className={ui.linkBtn}
                    onClick={() => setActiva(row.id)}
                  >
                    {row.estado === "Abierta" ? "Marcar" : "Detalle"}
                  </button>
                  {transicionesDesde(row.estado)
                    .filter((to) => to !== "Abierta" || row.estado !== "Programada")
                    .slice(0, 1)
                    .map((to) => (
                      <button
                        key={to}
                        type="button"
                        className={ui.linkBtn}
                        style={{ marginLeft: 10 }}
                        onClick={() => transitionSession(row.id, to, "docente")}
                      >
                        {to === "Cerrada" ? <Lock aria-hidden="true" /> : <Play aria-hidden="true" />}
                        {to}
                      </button>
                    ))}
                </div>
              ),
            },
          ]}
          rows={sesiones}
        />
      )}

      {detalle && resumenActivo ? (
        <ChartCard
          title={`${detalle.asignatura} · ${detalle.grupo}`}
          sub={`${detalle.fecha} · ${detalle.horaInicio} a ${detalle.horaFin}`}
          actions={<Pill tone={tonoEstado(detalle.estado)}>{detalle.estado}</Pill>}
        >
          <div className={ui.kpiGrid}>
            <StatsCard label="Registrados" value={resumenActivo.total} tone="accent" />
            <StatsCard label="Presentes" value={resumenActivo.presentes} tone="teal" />
            <StatsCard label="Ausentes" value={resumenActivo.ausentes} tone="warn" />
            <StatsCard label="Asistencia" value={`${resumenActivo.pct}%`} tone="info" />
          </div>

          {detalle.estado !== "Abierta" ? (
            <Notice tone="warn" icon={Lock}>
              La sesión está en estado {detalle.estado}. Solo en estado Abierta se puede marcar la
              asistencia de los estudiantes.
            </Notice>
          ) : null}

          <Meter
            value={resumenActivo.presentes}
            max={Math.max(1, resumenActivo.total)}
            tone={resumenActivo.pct >= 80 ? undefined : "warn"}
          />

          {registros.length === 0 ? (
            <p className={ui.cellMuted}>
              Esta sesión aún no tiene registros. Ciérrala para que el representante pueda validar.
            </p>
          ) : (
            <DataTable
              columns={[
                {
                  key: "nombre",
                  header: "Estudiante",
                  render: (row) => (
                    <div>
                      <b style={{ fontSize: 13.5 }}>{row.estudiante?.nombre ?? row.estudianteId}</b>
                      <p className={ui.cellMuted}>
                        {row.estudiante?.identificacion}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "estado",
                  header: "Registro",
                  render: (row) => (
                    <Pill tone={row.estado === "Presente" ? "ok" : row.estado === "Ausente" ? "danger" : "neutral"}>
                      {row.estado}
                    </Pill>
                  ),
                },
                { key: "hora", header: "Hora", muted: true, nowrap: true },
                {
                  key: "__marcar",
                  header: "",
                  align: "right",
                  render: (row) =>
                    detalle.estado === "Abierta" && row.estado !== "Presente" ? (
                      <button
                        type="button"
                        className={ui.linkBtn}
                        onClick={() =>
                          registerStudent(
                            activa,
                            {
                              estudianteId: row.estudianteId,
                              estado: "Presente",
                              hora: new Date().toTimeString().slice(0, 5),
                            },
                            "docente",
                          )
                        }
                      >
                        <CheckCircle2 aria-hidden="true" />
                        Marcar presente
                      </button>
                    ) : null,
                },
              ]}
              rows={registros}
            />
          )}
        </ChartCard>
      ) : null}
    </>
  );
}
