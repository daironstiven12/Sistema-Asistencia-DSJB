import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, History, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { activeAssignment, pastAssignments } from "@/data/representante";
import styles from "./page.module.css";

export const metadata = {
  title: "Mi grupo | Asistencia",
  description: "Grupo asignado al representante en el período activo.",
};

/* Un único grupo operativo más las asignaciones anteriores informativas. */
export default function GruposPage() {
  return (
    <AppShell active="grupos">
      <div className={styles.content}>
        <PageHeader
          title="Mi grupo"
          subtitle={`Asignación operativa del período ${activeAssignment.period}.`}
        />

        <section aria-labelledby="current-title">
          <h2 id="current-title" className={styles.sectionTitle}>
            Mi grupo
          </h2>
          <article className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.groupMark} aria-hidden="true">
                {activeAssignment.group}
              </span>
              <span className={styles.students}>
                <Users aria-hidden="true" />
                {activeAssignment.students} estudiantes
              </span>
            </div>
            <dl className={styles.meta}>
              <div className={styles.metaItem}>
                <dt>Período académico</dt>
                <dd>{activeAssignment.period}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Programa</dt>
                <dd>{activeAssignment.program}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Nivel</dt>
                <dd>{activeAssignment.level}</dd>
              </div>
            </dl>
            <p className={styles.label}>Asignaturas del grupo</p>
            <ul className={styles.subjects}>
              {activeAssignment.subjects.map((subject) => (
                <li key={subject}>
                  <BookOpen aria-hidden="true" />
                  {subject}
                </li>
              ))}
            </ul>
            <p className={styles.next}>
              <CalendarClock aria-hidden="true" />
              Próxima: {activeAssignment.next}
            </p>
            <Link href="/asistencias" className={styles.btnPrimary}>
              Ver grupo
              <ArrowRight aria-hidden="true" />
            </Link>
          </article>
        </section>

        <section aria-labelledby="past-title">
          <h2 id="past-title" className={styles.sectionTitle}>
            Asignaciones anteriores
          </h2>
          <p className={styles.pastNote}>
            Al finalizar un período pierdes el acceso operativo a ese grupo:
            no puedes gestionar asistencias ni modificar registros.
          </p>
          <div className={styles.pastList}>
            {pastAssignments.map((item) => (
              <article key={`${item.period}-${item.group}`} className={styles.pastCard}>
                <div>
                  <strong>
                    {item.period} · Grupo {item.group}
                  </strong>
                  <small>{item.status}</small>
                </div>
                <Link href="/historial" className={styles.btnSecondary}>
                  <History aria-hidden="true" />
                  Ver historial
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
