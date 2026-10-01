"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import { formatShortDate } from "@/lib/attendanceFlow";
import { useAttendance } from "@/prototype/AttendanceContext";
import { useStudent } from "@/prototype/StudentContext";
import styles from "./page.module.css";

function myStatus(record, key) {
  const entry = record.students.find((s) => s.key === key);
  if (!entry) return null;
  if (entry.status === "Presente") return "Presente";
  if (
    record.status === "Cerrada" ||
    record.status === "Validada" ||
    record.status === "Firmada"
  ) {
    return "No asistió";
  }
  return "Pendiente";
}

/* Historial propio del estudiante con búsqueda y filtro simples. */
export default function MisAsistencias() {
  const { records } = useAttendance();
  const { profile } = useStudent();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [filter, setFilter] = useState("");

  const mine = useMemo(
    () =>
      records
        .map((record) => ({ record, status: myStatus(record, profile.key) }))
        .filter((item) => item.status !== null),
    [records, profile.key],
  );

  const subjects = useMemo(
    () => Array.from(new Set(mine.map((m) => m.record.subject))).sort(),
    [mine],
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return mine.filter(({ record, status }) => {
      if (text && !record.subject.toLowerCase().includes(text)) return false;
      if (subject && record.subject !== subject) return false;
      if (filter && status !== filter) return false;
      return true;
    });
  }, [mine, query, subject, filter]);

  return (
    <div className={styles.content}>
      <StudentHeader
        title="Mis asistencias"
        subtitle="Solamente tus propios registros."
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por asignatura"
            aria-label="Buscar por asignatura"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por asignatura"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Todas</option>
          {subjects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="Presente">Presente</option>
          <option value="No asistió">No asistió</option>
          <option value="Pendiente">Pendiente</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Asignatura</th>
              <th scope="col">Grupo</th>
              <th scope="col">Fecha</th>
              <th scope="col">Hora</th>
              <th scope="col">Estado</th>
              <th scope="col">Registro</th>
              <th scope="col">
                <span className={styles.srOnly}>Detalle</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ record, status }) => {
              const entry = record.students.find((s) => s.key === profile.key);
              return (
                <tr key={record.id}>
                  <td data-label="Asignatura">{record.subject}</td>
                  <td data-label="Grupo">{record.group}</td>
                  <td data-label="Fecha">
                    {record.dateISO
                      ? formatShortDate(record.dateISO)
                      : record.date}
                  </td>
                  <td data-label="Hora">{record.startTime}</td>
                  <td data-label="Estado">
                    <span
                      className={`${styles.pill} ${
                        status === "Presente"
                          ? styles.pillPresent
                          : status === "No asistió"
                            ? styles.pillMissed
                            : styles.pillPending
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td data-label="Registro">
                    {status === "Presente" && entry?.time ? entry.time : "—"}
                  </td>
                  <td data-label="Detalle">
                    <Link
                      href={`/estudiante/asistencias/${record.id}`}
                      className={styles.viewBtn}
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty} role="status">
          No encontramos registros con estos filtros.
        </p>
      )}
    </div>
  );
}
