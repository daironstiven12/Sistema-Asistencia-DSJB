"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  Keyboard,
  QrCode,
  ScanLine,
  X,
} from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import { useAttendance } from "@/prototype/AttendanceContext";
import { activeAssignment } from "@/data/representante";
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

function CodeModal({ onClose }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(event) {
    event.preventDefault();
    router.push(`/estudiante/registrar?codigo=${encodeURIComponent(value.trim())}`);
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-modal-title"
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 id="code-modal-title">Ingresar código</h2>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit} className={styles.codeForm}>
          <label htmlFor="home-code">Código de asistencia</label>
          <input
            id="home-code"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="ASIS-7A-2026"
            autoComplete="off"
          />
          <button type="submit" className={styles.btnPrimary}>
            <Keyboard aria-hidden="true" />
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}

/* Inicio del estudiante: registro, recientes y contexto del grupo. */
export default function EstudianteHome() {
  const { records } = useAttendance();
  const { profile } = useStudent();
  const [codeOpen, setCodeOpen] = useState(false);

  const mine = records
    .map((record) => ({ record, status: myStatus(record, profile.key) }))
    .filter((item) => item.status !== null)
    .slice(0, 3);

  return (
    <div className={styles.content}>
      <StudentHeader
        title={`Hola, ${profile.name.split(" ")[0]}`}
        subtitle="Registra tu asistencia y consulta tus registros."
        context={`Grupo ${activeAssignment.group} · Período ${activeAssignment.period}`}
      />

      <section className={styles.hero} aria-labelledby="register-title">
        <div className={styles.heroText}>
          <p className={styles.overline}>Registrar asistencia</p>
          <h2 id="register-title">Registra tu asistencia</h2>
          <p>
            Utiliza el código proporcionado por tu representante o escanea el
            código QR.
          </p>
        </div>
        <div className={styles.methods}>
          <article className={styles.methodQr}>
            <span className={styles.methodIconQr} aria-hidden="true">
              <QrCode />
            </span>
            <h3>Escanear QR</h3>
            <p>Abre la cámara o simula el escaneo del código QR.</p>
            <Link
              href="/estudiante/registrar?metodo=qr"
              className={styles.btnPrimary}
            >
              <ScanLine aria-hidden="true" />
              Escanear QR
            </Link>
          </article>
          <article className={styles.methodCode}>
            <span className={styles.methodIconCode} aria-hidden="true">
              <Keyboard />
            </span>
            <h3>Ingresar código</h3>
            <p>Introduce el código de asistencia proporcionado por tu representante.</p>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setCodeOpen(true)}
            >
              <Keyboard aria-hidden="true" />
              Ingresar código
            </button>
          </article>
        </div>
      </section>

      <section className={styles.recents} aria-labelledby="recent-title">
        <div className={styles.recentsHead}>
          <span className={styles.recentsIcon} aria-hidden="true">
            <ClipboardList />
          </span>
          <div>
            <h2 id="recent-title">Mis asistencias recientes</h2>
            <p>Aquí puedes consultar tus últimos registros.</p>
          </div>
          <Link href="/estudiante/asistencias" className={styles.linkBtn}>
            Ver todas
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Asignatura</th>
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
              {mine.map(({ record, status }) => {
                const entry = record.students.find(
                  (s) => s.key === profile.key,
                );
                return (
                  <tr key={record.id}>
                    <td data-label="Asignatura">
                      <strong>{record.subject}</strong>
                      <small>{record.group}</small>
                    </td>
                    <td data-label="Fecha">{record.date}</td>
                    <td data-label="Hora">
                      {record.startTime}
                      {record.endTime ? ` - ${record.endTime}` : ""}
                    </td>
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
                        className={styles.rowLink}
                        aria-label={`Ver detalle de ${record.subject}`}
                      >
                        <ChevronRight aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {codeOpen && <CodeModal onClose={() => setCodeOpen(false)} />}
    </div>
  );
}
