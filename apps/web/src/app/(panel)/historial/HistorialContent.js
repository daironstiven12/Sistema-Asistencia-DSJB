"use client";

import Link from "next/link";
import { Eye, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { useAttendance } from "@/prototype/AttendanceContext";
import { isActiveRecord } from "@/lib/attendanceFlow";
import { activeAssignment } from "@/data/representante";
import styles from "./page.module.css";

/* Historial del estado del prototipo: incluye lo creado en la sesión. */
export default function HistorialContent() {
  const { records } = useAttendance();

  return (
    <div className={styles.content}>
      <PageHeader
        title="Historial"
        subtitle="Consulta las asistencias creadas durante la sesión y las anteriores."
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por asignatura"
            aria-label="Buscar por asignatura"
          />
        </div>
        <input
          type="date"
          aria-label="Filtrar por fecha"
          className={styles.input}
        />
        <select aria-label="Filtrar por asignatura" defaultValue="">
          <option value="">Todas las asignaturas</option>
          <option>Sistemas Operativos</option>
          <option>Redes de Computadores</option>
          <option>Bases de Datos</option>
          <option>Ruteo y Switcheo</option>
        </select>
        <select aria-label="Filtrar por estado" defaultValue="">
          <option value="">Todos los estados</option>
          <option>Borrador</option>
          <option>Programada</option>
          <option>Abierta</option>
          <option>Cerrada</option>
          <option>Validada</option>
          <option>Firmada</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Asignatura</th>
              <th scope="col">Grupo</th>
              <th scope="col">Fecha</th>
              <th scope="col">Estado</th>
              <th scope="col">Estudiantes</th>
              <th scope="col">Firmas</th>
              <th scope="col">Acta</th>
              <th scope="col">
                <span className={styles.srOnly}>Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => {
              const present = row.students.filter(
                (s) => s.status === "Presente",
              ).length;
              return (
                <tr key={row.id}>
                  <td data-label="Asignatura">{row.subject}</td>
                  <td data-label="Grupo">{row.group}</td>
                  <td data-label="Fecha">{row.date}</td>
                  <td data-label="Estado">
                    <StatusBadge status={row.status} />
                    {!isActiveRecord(row, activeAssignment) && (
                      <span className={styles.histTag}>Histórica</span>
                    )}
                  </td>
                  <td data-label="Estudiantes">
                    {row.students.length
                      ? `${present} / ${row.students.length}`
                      : "—"}
                  </td>
                  <td data-label="Firmas">
                    {row.repSignature || row.teacherSignature ? (
                      <span className={styles.signs}>
                        {row.repSignature && (
                          <span className={styles.signOk}>Rep.</span>
                        )}
                        {row.teacherSignature && (
                          <span className={styles.signOk}>Doc.</span>
                        )}
                      </span>
                    ) : (
                      <span className={styles.signNone}>Sin firmas</span>
                    )}
                  </td>
                  <td data-label="Acta">
                    {row.status === "Firmada" ? (
                      <Link
                        href={`/asistencias/${row.id}/acta`}
                        className={styles.actaLink}
                      >
                        Ver acta
                      </Link>
                    ) : (
                      <span className={styles.signNone}>—</span>
                    )}
                  </td>
                  <td data-label="Acción">
                    <Link
                      href={`/asistencias/${row.id}`}
                      className={styles.viewBtn}
                    >
                      <Eye aria-hidden="true" />
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.count}>
        Mostrando {records.length} de {records.length} registros
      </p>
    </div>
  );
}
