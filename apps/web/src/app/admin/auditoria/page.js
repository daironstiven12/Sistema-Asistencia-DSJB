/* Auditoría institucional. Solo lectura: los registros los escribe el
   provider en cada mutación. Filtros por usuario, acción, entidad y
   rango de fechas, con exportación a CSV y PDF. */

"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, ScrollText, ShieldCheck } from "lucide-react";
import {
  ChartCard,
  DataTable,
  EmptyState,
  Notice,
  Pill,
  SearchBar,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { descargarCsv, descargarInformePdf } from "@/lib/exportar";

export default function AuditoriaPage() {
  const { db } = useAcademy();
  const [query, setQuery] = useState("");
  const [usuario, setUsuario] = useState("");
  const [accion, setAccion] = useState("");
  const [entidad, setEntidad] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const usuarios = useMemo(() => [...new Set(db.auditLogs.map((l) => l.usuario))], [db.auditLogs]);
  const acciones = useMemo(() => [...new Set(db.auditLogs.map((l) => l.accion))], [db.auditLogs]);
  const entidades = useMemo(() => [...new Set(db.auditLogs.map((l) => l.modulo))], [db.auditLogs]);

  const filas = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return db.auditLogs.filter((log) => {
      if (usuario && log.usuario !== usuario) return false;
      if (accion && log.accion !== accion) return false;
      if (entidad && log.modulo !== entidad) return false;
      if (desde && log.fecha < desde) return false;
      if (hasta && log.fecha > hasta) return false;
      if (!texto) return true;
      return [log.usuario, log.accion, log.entidad, log.descripcion]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [db.auditLogs, query, usuario, accion, entidad, desde, hasta]);

  const exportar = (formato) => {
    const columnas = [
      { key: "fecha", header: "Fecha" },
      { key: "hora", header: "Hora" },
      { key: "usuario", header: "Usuario" },
      { key: "rol", header: "Rol" },
      { key: "accion", header: "Acción" },
      { key: "modulo", header: "Módulo" },
      { key: "entidad", header: "Entidad" },
      { key: "descripcion", header: "Descripción" },
    ];
    if (formato === "csv") {
      descargarCsv({ nombre: "auditoria", columnas, filas });
    } else {
      descargarInformePdf({ titulo: "Auditoría del sistema", sub: `${filas.length} registros`, columnas, filas });
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Auditoría"
        sub="Trazabilidad de cada cambio realizado en el sistema."
        actions={
          <>
            <button type="button" className={ui.btnSecondary} onClick={() => exportar("csv")}>
              <FileSpreadsheet aria-hidden="true" />
              Exportar CSV
            </button>
            <button type="button" className={ui.btnPrimary} onClick={() => exportar("pdf")}>
              <Download aria-hidden="true" />
              Descargar PDF
            </button>
          </>
        }
      />

      <Notice tone="info" icon={ShieldCheck}>
        La auditoría es de solo lectura. Cada alta, edición, cambio de estado y eliminación queda
        registrada con usuario, rol y hora.
      </Notice>

      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar en auditoría"
            ariaLabel="Buscar en auditoría"
          />
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={usuario}
            onChange={(event) => setUsuario(event.target.value)}
            aria-label="Filtrar por usuario"
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={accion}
            onChange={(event) => setAccion(event.target.value)}
            aria-label="Filtrar por acción"
          >
            <option value="">Todas las acciones</option>
            {acciones.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={entidad}
            onChange={(event) => setEntidad(event.target.value)}
            aria-label="Filtrar por módulo"
          >
            <option value="">Todos los módulos</option>
            {entidades.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className={ui.filterGroup}>
            <span className={ui.filterLabel}>Desde</span>
            <input
              type="date"
              className={ui.input}
              style={{ width: "auto", minHeight: 36, height: 36 }}
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
              aria-label="Desde"
            />
          </span>
          <span className={ui.filterGroup}>
            <span className={ui.filterLabel}>Hasta</span>
            <input
              type="date"
              className={ui.input}
              style={{ width: "auto", minHeight: 36, height: 36 }}
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
              aria-label="Hasta"
            />
          </span>
        </div>
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {filas.length} de {db.auditLogs.length}
        </span>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={ScrollText} title="Sin registros" text="No hay coincidencias para los filtros aplicados." />
      ) : (
        <DataTable
          columns={[
            { key: "fecha", header: "Fecha", muted: true, nowrap: true },
            { key: "hora", header: "Hora", muted: true, nowrap: true },
            {
              key: "usuario",
              header: "Usuario",
              render: (row) => (
                <div>
                  <b style={{ fontSize: 13.5 }}>{row.usuario}</b>
                  <p className={ui.cellMuted}>{row.rol}</p>
                </div>
              ),
            },
            { key: "modulo", header: "Módulo" },
            {
              key: "accion",
              header: "Acción",
              render: (row) => <Pill tone="info">{row.accion}</Pill>,
            },
            { key: "entidad", header: "Entidad", muted: true },
            {
              key: "descripcion",
              header: "Descripción",
              grow: true,
              muted: true,
            },
          ]}
          rows={filas}
        />
      )}

      <ChartCard title="Resumen por módulo" sub="Distribución de los registros">
        {resumen(db.auditLogs).map((row) => (
          <div key={row.modulo} className={ui.defRow}>
            <span>{row.modulo}</span>
            <div className={ui.defBar}>
              <i style={{ width: `${row.pct}%` }} />
            </div>
            <b>{row.total}</b>
          </div>
        ))}
      </ChartCard>
    </>
  );
}

function resumen(logs) {
  const mapa = new Map();
  logs.forEach((log) => {
    mapa.set(log.modulo, (mapa.get(log.modulo) ?? 0) + 1);
  });
  const maximo = Math.max(1, ...mapa.values());
  return Array.from(mapa.entries())
    .map(([modulo, total]) => ({ modulo, total, pct: Math.round((total / maximo) * 100) }))
    .sort((a, b) => b.total - a.total);
}
