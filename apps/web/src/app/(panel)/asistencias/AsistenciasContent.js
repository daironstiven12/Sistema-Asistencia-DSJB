"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { useAttendance } from "@/prototype/AttendanceContext";
import { isActiveRecord } from "@/lib/attendanceFlow";
import { activeAssignment } from "@/data/representante";
import styles from "./page.module.css";

/* Lista del grupo y período activos con filtros funcionales. */
export default function AsistenciasContent() {
  const { records } = useAttendance();
  const current = records.filter((r) => isActiveRecord(r, activeAssignment));
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");

  const subjects = useMemo(
    () => Array.from(new Set(current.map((r) => r.subject))).sort(),
    [current],
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return current.filter((item) => {
      if (
        text &&
        !`${item.subject} ${item.group}`.toLowerCase().includes(text)
      ) {
        return false;
      }
      if (subject && item.subject !== subject) return false;
      if (status && item.status !== status) return false;
      if (date && item.dateISO !== date) return false;
      return true;
    });
  }, [current, query, subject, status, date]);

  return (
    <div className={styles.content}>
      <div className={styles.head}>
        <PageHeader
          title="Asistencias"
          subtitle={`Grupo ${activeAssignment.group} · Período ${activeAssignment.period}.`}
        />
        <Link href="/asistencias/nueva" className={styles.btnPrimary}>
          <Plus aria-hidden="true" />
          Nueva asistencia
        </Link>
      </div>

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
          <option value="Programada">Programada</option>
          <option value="Abierta">Abierta</option>
          <option value="Cerrada">Cerrada</option>
          <option value="Validada">Validada</option>
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

      {filtered.length === 0 ? (
        <p className={styles.empty} role="status">
          No encontramos asistencias con estos filtros.
        </p>
      ) : (
        <div className={styles.list}>
          {filtered.map((item) => {
            const present = item.students.filter(
              (s) => s.status === "Presente",
            ).length;
            return (
              <article key={item.id} className={styles.row}>
                <span className={styles.rowIcon} aria-hidden="true">
                  <BookOpen />
                </span>
                <div className={styles.rowText}>
                  <strong>{item.subject}</strong>
                  <small>
                    {item.group} · {item.date} · {item.startTime}
                    {item.endTime ? ` - ${item.endTime}` : ""} ·{" "}
                    {item.students.length
                      ? `${present} / ${item.students.length} estudiantes`
                      : "Sin lista de estudiantes"}
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
            );
          })}
        </div>
      )}

      <p className={styles.count}>
        Mostrando {filtered.length} de {current.length} asistencias
      </p>
    </div>
  );
}
