"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAttendance } from "@/prototype/AttendanceContext";
import { useStudent } from "@/prototype/StudentContext";
import styles from "./page.module.css";

function SignatureView({ signature }) {
  if (!signature) return null;
  if (signature.kind === "typed") {
    return <span className={styles.sigTyped}>{signature.data}</span>;
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={signature.data} alt="Firma del estudiante" className={styles.sigImg} />
  );
}

/* Detalle de solo lectura del registro propio. Sin edición. */
export default function MiAsistenciaDetail({ id }) {
  const { getRecord } = useAttendance();
  const { profile } = useStudent();
  const record = getRecord(id);
  const entry = record?.students.find((s) => s.key === profile.key) ?? null;

  const present = entry?.status === "Presente";
  const closed =
    record?.status === "Cerrada" ||
    record?.status === "Validada" ||
    record?.status === "Firmada";

  return (
    <div className={styles.content}>
      <Link href="/estudiante/asistencias" className={styles.backLink}>
        <ArrowLeft aria-hidden="true" />
        Mis asistencias
      </Link>

      {!record || !entry ? (
        <p className={styles.empty}>Registro no encontrado.</p>
      ) : (
        <section className={styles.card} aria-label="Detalle de mi asistencia">
          <h1 className={styles.subject}>{record.subject}</h1>
          <p className={styles.meta}>
            {record.group} · {record.date} · {record.startTime}
            {record.endTime ? ` - ${record.endTime}` : ""} · Período{" "}
            {record.period}
          </p>

          <div className={styles.statusRow}>
            <span>Estado</span>
            {present ? (
              <span className={`${styles.pill} ${styles.pillPresent}`}>
                PRESENTE
              </span>
            ) : closed ? (
              <span className={`${styles.pill} ${styles.pillMissed}`}>
                NO ASISTIÓ
              </span>
            ) : (
              <span className={`${styles.pill} ${styles.pillPending}`}>
                PENDIENTE
              </span>
            )}
          </div>

          {present ? (
            <dl className={styles.details}>
              <div>
                <dt>Hora de registro</dt>
                <dd>{entry.time}</dd>
              </div>
              <div>
                <dt>Método</dt>
                <dd>{entry.method ?? "Registro previo"}</dd>
              </div>
              <div>
                <dt>Firma</dt>
                <dd>
                  {entry.sig ? (
                    <SignatureView signature={entry.sig} />
                  ) : (
                    <span className={styles.noSig}>Sin firma configurada</span>
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className={styles.missedBox}>
              {closed
                ? "No asististe a esta clase."
                : "Aún puedes registrar tu asistencia mientras la sesión esté abierta."}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
