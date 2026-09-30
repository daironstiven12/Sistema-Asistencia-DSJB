"use client";

import { CalendarDays, ClipboardCheck, TrendingUp, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAttendance } from "@/prototype/AttendanceContext";
import { isActiveRecord } from "@/lib/attendanceFlow";
import { activeAssignment } from "@/data/representante";
import styles from "./page.module.css";

/* Reportes calculados del grupo y período activos. */
export default function ReportesContent() {
  const { records } = useAttendance();
  const current = records.filter((r) => isActiveRecord(r, activeAssignment));

  let present = 0;
  let absent = 0;
  let pending = 0;
  const subjects = new Set();

  current.forEach((rec) => {
    subjects.add(rec.subject);
    rec.students.forEach((s) => {
      if (s.status === "Presente") present += 1;
      else if (s.status === "Ausente") absent += 1;
      else pending += 1;
    });
  });

  const total = present + absent + pending;
  const average = total ? Math.round((present / total) * 100) : 0;
  const closed = current.filter((r) => r.status === "Cerrada").length;

  const summary = [
    {
      key: "total",
      icon: CalendarDays,
      label: "Total de asistencias",
      value: String(current.length),
      foot: `${closed} cerradas`,
      tone: "neutral",
    },
    {
      key: "avg",
      icon: TrendingUp,
      label: "Porcentaje de asistencia",
      value: `${average}%`,
      foot: `${present} presentes de ${total}`,
      tone: "accent",
    },
    {
      key: "present",
      icon: Users,
      label: "Presentes",
      value: String(present),
      foot: `${absent} ausentes · ${pending} pendientes`,
      tone: "blue",
    },
    {
      key: "subjects",
      icon: ClipboardCheck,
      label: "Asignaturas",
      value: String(subjects.size),
      foot: `Grupo ${activeAssignment.group}`,
      tone: "neutral",
    },
  ];

  const bySubject = Array.from(subjects).map((subject) => {
    let p = 0;
    let t = 0;
    current
      .filter((r) => r.subject === subject)
      .forEach((r) =>
        r.students.forEach((s) => {
          t += 1;
          if (s.status === "Presente") p += 1;
        }),
      );
    return { subject, value: t ? Math.round((p / t) * 100) : 0 };
  });

  return (
    <div className={styles.content}>
      <PageHeader
        title="Reportes"
        subtitle={`Calculados con los datos del grupo ${activeAssignment.group} · Período ${activeAssignment.period}.`}
      />

      <div className={styles.stats}>
        {summary.map((item) => (
          <StatCard
            key={item.key}
            icon={item.icon}
            label={item.label}
            value={item.value}
            foot={item.foot}
            tone={item.tone}
          />
        ))}
      </div>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="avg-title">
          <h2 id="avg-title" className={styles.cardTitle}>
            Distribución de registros
          </h2>
          <p className={styles.cardSub}>Sobre {total} registros mock</p>
          <div className={styles.donutWrap}>
            <div
              className={styles.donut}
              style={{
                background: `conic-gradient(var(--accent) 0 ${average}%, var(--surface-3) ${average}% 100%)`,
              }}
              role="img"
              aria-label={`Promedio de asistencia del ${average} por ciento`}
            >
              <span className={styles.donutValue}>{average}%</span>
            </div>
            <ul className={styles.legend}>
              <li>
                <i className={styles.swatchPresent} aria-hidden="true" />
                Presentes · {present}
              </li>
              <li>
                <i className={styles.swatchAbsent} aria-hidden="true" />
                Ausentes · {absent}
              </li>
              <li>
                <i className={styles.swatchPending} aria-hidden="true" />
                Pendientes · {pending}
              </li>
            </ul>
          </div>
        </section>

        <section
          className={styles.card}
          aria-labelledby="subject-title"
        >
          <h2 id="subject-title" className={styles.cardTitle}>
            Asistencia por asignatura
          </h2>
          <p className={styles.cardSub}>Promedio de la sesión · Grupo {activeAssignment.group}</p>
          <div className={styles.hbars}>
            {bySubject.map((row) => (
              <div key={row.subject} className={styles.hbar}>
                <span className={styles.hbarLabel}>{row.subject}</span>
                <div className={styles.hbarTrack}>
                  <i
                    className={styles.hbarFill}
                    style={{ width: `${row.value}%` }}
                  />
                </div>
                <b className={styles.hbarValue}>{row.value}%</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
