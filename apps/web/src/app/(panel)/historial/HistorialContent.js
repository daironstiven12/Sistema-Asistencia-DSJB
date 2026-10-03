"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { attendanceApi } from "@/services/api/attendance";
import { ApiError } from "@/services/api/http";
import { defectoPorEstado, mensajeAmigable } from "@/lib/errorAmigable";
import styles from "./page.module.css";

/* Historial real: filtros y paginación en el backend
   (GET /attendance/history). Sin mocks ni filtrado en React. */

const ESTADOS = [
  { code: "", label: "Todos" },
  { code: "BORRADOR", label: "Borrador" },
  { code: "ABIERTA", label: "Abierta" },
  { code: "CERRADA", label: "Cerrada" },
  { code: "FIRMADA", label: "Firmada" },
];

const PAGE_SIZES = [10, 20, 50];

function rangoPaginas(actual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, actual - 1, actual, actual + 1, total - 1, total]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

export default function HistorialContent() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [courseOfferingId, setCourseOfferingId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ofertas, setOfertas] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const viva = useRef(true);

  useEffect(() => {
    viva.current = true;
    const t = setTimeout(() => {
      attendanceApi
        .listOfferings()
        .catch(() => [])
        .then((rows) => {
          if (viva.current) setOfertas(Array.isArray(rows) ? rows : []);
        });
    }, 0);
    return () => {
      viva.current = false;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const cargar = useCallback(async () => {
    if (!viva.current) return;
    setCargando(true);
    setError(null);
    try {
      const data = await attendanceApi.history({
        page,
        pageSize,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        courseOfferingId: courseOfferingId || undefined,
        search: searchDebounced || undefined,
      });
      if (!viva.current) return;
      setItems(data.items);
      setPagination(data.pagination);
    } catch (e) {
      if (!viva.current) return;
      setError(
        mensajeAmigable(
          e,
          e instanceof ApiError ? defectoPorEstado(e) : "No se pudo cargar el historial.",
        ),
      );
    } finally {
      if (viva.current) setCargando(false);
    }
  }, [page, pageSize, status, dateFrom, dateTo, courseOfferingId, searchDebounced]);

  useEffect(() => {
    viva.current = true;
    const t = setTimeout(() => {
      void cargar();
    }, 0);
    return () => {
      viva.current = false;
      clearTimeout(t);
    };
  }, [cargar]);

  function cambiarFiltro(fn) {
    return (valor) => {
      fn(valor);
      setPage(1);
    };
  }

  function limpiarFiltros() {
    setSearch("");
    setSearchDebounced("");
    setStatus("");
    setCourseOfferingId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const hayFiltros =
    searchDebounced !== "" ||
    status !== "" ||
    courseOfferingId !== "" ||
    dateFrom !== "" ||
    dateTo !== "";
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 0;
  const desde = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, totalItems);

  return (
    <div className={styles.content}>
      <PageHeader
        title="Historial"
        subtitle="Consulta y revisa las asistencias de tu grupo."
      />

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar asignatura, código o grupo..."
              aria-label="Buscar asignatura, código o grupo"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(e) => cambiarFiltro(setStatus)(e.target.value)}
          >
            {ESTADOS.map((e) => (
              <option key={e.code || "todos"} value={e.code}>
                {e.code === "" ? "Estado: Todos" : e.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por asignatura"
            value={courseOfferingId}
            onChange={(e) => cambiarFiltro(setCourseOfferingId)(e.target.value)}
          >
            <option value="">Asignatura: Todas</option>
            {ofertas.map((o) => (
              <option key={o.courseOfferingId} value={o.courseOfferingId}>
                {o.subject}
                {o.subjectCode ? ` (${o.subjectCode})` : ""}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="Fecha desde"
            title="Fecha desde"
            className={styles.input}
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => cambiarFiltro(setDateFrom)(e.target.value)}
          />
          <input
            type="date"
            aria-label="Fecha hasta"
            title="Fecha hasta"
            className={styles.input}
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => cambiarFiltro(setDateTo)(e.target.value)}
          />
          <button
            type="button"
            className={styles.clearBtn}
            onClick={limpiarFiltros}
            disabled={!hayFiltros && page === 1}
          >
            Limpiar filtros
          </button>
        </div>

        {error ? (
          <p className={styles.errorBox} role="alert">
            {error}{" "}
            <button type="button" className={styles.viewBtn} onClick={cargar}>
              Reintentar
            </button>
          </p>
        ) : cargando ? (
          <div className={styles.tableWrap} aria-hidden="true">
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyBox} role="status">
            <strong>No encontramos asistencias</strong>
            <p>Prueba cambiando los filtros o el rango de fechas.</p>
            <button type="button" className={styles.viewBtn} onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Asignatura</th>
                    <th scope="col">Grupo</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Horario</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Registrados</th>
                    <th scope="col">
                      <span className={styles.srOnly}>Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Asignatura">
                        <strong>{row.subject}</strong>
                        {row.subjectCode ? (
                          <small className={styles.sub}>{row.subjectCode}</small>
                        ) : null}
                      </td>
                      <td data-label="Grupo">{row.group}</td>
                      <td data-label="Fecha">{row.date}</td>
                      <td data-label="Horario">
                        {row.startTime}
                        {row.endTime ? ` – ${row.endTime}` : ""}
                      </td>
                      <td data-label="Estado">
                        <StatusBadge status={row.status} />
                      </td>
                      <td data-label="Registrados">{row.recordsCount}</td>
                      <td data-label="Acción">
                        <Link
                          href={`/asistencias/${row.id}`}
                          className={styles.viewBtn}
                          aria-label={`Ver asistencia ${row.subject}`}
                        >
                          <Eye aria-hidden="true" />
                          Ver asistencia
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pager}>
              <p className={styles.count} role="status">
                Mostrando {desde}–{hasta} de {totalItems} asistencia{totalItems === 1 ? "" : "s"}
              </p>
              <div className={styles.pagerControls}>
                <select
                  aria-label="Elementos por página"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} / página
                    </option>
                  ))}
                </select>
                <div className={styles.pages} role="navigation" aria-label="Paginación">
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={!pagination?.hasPreviousPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft aria-hidden="true" />
                    Anterior
                  </button>
                  {rangoPaginas(page, totalPages).map((n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} className={styles.ellipsis} aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        className={`${styles.pageBtn} ${n === page ? styles.pageActual : ""}`}
                        aria-label={`Página ${n}`}
                        aria-current={n === page ? "page" : undefined}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={!pagination?.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Página siguiente"
                  >
                    Siguiente
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
}
