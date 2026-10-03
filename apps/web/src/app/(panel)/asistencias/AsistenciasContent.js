"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { useMySessions } from "./useSessionsApi";
import styles from "./page.module.css";

/* Lista de mis asistencias desde la API real (sin mock). */
export default function AsistenciasContent() {
  const { filas, cargando, error, recargar } = useMySessions();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");

  const subjects = useMemo(
    () => Array.from(new Set(filas.map((r) => r.subject))).sort(),
    [filas],
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return filas.filter((item) => {
      if (text && !`${item.subject} ${item.group}`.toLowerCase().includes(text)) {
        return false;
      }
      if (subject && item.subject !== subject) return false;
      if (status && item.status !== status) return false;
      if (date) {
        const [y, m, d] = date.split("-");
        if (item.date !== `${d}/${m}/${y}`) return false;
      }
      return true;
    });
  }, [filas, query, subject, status, date]);

  return (
    <div className={styles.content}>
      <div className={styles.head}>
        <PageHeader
          title="Asistencias"
          subtitle="Sesiones de tu grupo asignado."
        />
        <Link href="/asistencias/nueva" className={styles.btnPrimary}>
          <Plus aria-hidden="true" />
          Nueva asistencia
        </Link>
      </div>

      {error ? (
        <p className={styles.empty} role="alert">
          {error}{" "}
          <button type="button" className={styles.btnSecondary} onClick={recargar}>
            Reintentar
          </button>
        </p>
      ) : null}

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por asignatura o grupo"
            aria-label="Buscar por asignatura o grupo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por asignatura"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Todas las asignaturas</option>
          {subjects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="Borrador">Borrador</option>
          <option value="Abierta">Abierta</option>
          <option value="Cerrada">Cerrada</option>
          <option value="Firmada">Firmada</option>
        </select>
        <input
          type="date"
          aria-label="Filtrar por fecha"
          className={styles.dateInput}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {cargando ? (
        <p className={styles.empty} role="status">
          Cargando asistencias…
        </p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty} role="status">
          {filas.length === 0
            ? "Aún no tienes asistencias. Crea la primera."
            : "No encontramos asistencias con estos filtros."}
        </p>
      ) : (
        <div className={styles.list}>
          {filtered.map((item) => (
            <article key={item.id} className={styles.row}>
              <span className={styles.rowIcon} aria-hidden="true">
                <BookOpen />
              </span>
              <div className={styles.rowText}>
                <strong>{item.subject}</strong>
                <small>
                  {item.group} · {item.date} · {item.startTime}
                  {item.endTime ? ` - ${item.endTime}` : ""}
                  {item.status === "Abierta" && item.code ? ` · Código ${item.code}` : ""}
                </small>
              </div>
              <StatusBadge status={item.status} />
              <Link
                href={`/asistencias/${item.id}`}
                className={styles.btnSecondary}
              >
                Gestionar
              </Link>
            </article>
          ))}
        </div>
      )}

      <p className={styles.count}>
        Mostrando {filtered.length} de {filas.length} asistencias
      </p>
    </div>
  );
}
