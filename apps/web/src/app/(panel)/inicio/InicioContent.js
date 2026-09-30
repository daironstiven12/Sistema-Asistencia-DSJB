"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  Eye,
  History,
  Info,
  Lock,
  Plus,
  QrCode,
  Users,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { useAttendance } from "@/prototype/AttendanceContext";
import { isActiveRecord } from "@/lib/attendanceFlow";
import { activeAssignment, quickActions } from "@/data/representante";
import styles from "./page.module.css";

const actionIcons = {
  prepare: Plus,
  groups: Users,
  history: History,
};

const actionHrefs = {
  prepare: "/asistencias/nueva",
  groups: "/grupos",
  history: "/historial",
};

/* Panel del representante: opera sobre un único grupo del período activo. */
export default function InicioContent() {
  const { records } = useAttendance();
  const current = records.filter((r) =>
    isActiveRecord(r, activeAssignment),
  );

  const openList = current.filter((r) => r.status === "Abierta");
  const pendingList = current.filter(
    (r) => r.status === "Borrador" || r.status === "Programada",
  );
  const upcoming = pendingList;
  const active = openList[0] ?? pendingList[0] ?? current[0] ?? null;

  const summary = [
    {
      key: "group",
      icon: Users,
      label: "Grupo asignado",
      value: activeAssignment.group,
      foot: `${activeAssignment.students} estudiantes`,
      tone: "neutral",
    },
    {
      key: "today",
      icon: CalendarDays,
      label: "Asistencias de hoy",
      value: String(openList.length + pendingList.length),
      foot: `${openList.length} abierta · ${pendingList.length} pendientes`,
      tone: "blue",
    },
    {
      key: "open",
      icon: QrCode,
      label: "Asistencias abiertas",
      value: String(openList.length),
      foot: openList.length ? "En curso ahora" : "Sin asistencias abiertas",
      tone: "accent",
    },
    {
      key: "pending",
      icon: Clock,
      label: "Asistencias pendientes",
      value: String(pendingList.length),
      foot: "Borrador o programadas",
      tone: "warn",
    },
  ];

  const presentCount = active
    ? active.students.filter((s) => s.status === "Presente").length
    : 0;
  const progress = active?.students.length
    ? Math.round((presentCount / active.students.length) * 100)
    : 0;

  return (
    <div className={styles.content}>
      <PageHeader
        title="Inicio"
        subtitle="Gestiona las asistencias de tu grupo."
      />
      <p className={styles.context}>
        Período académico {activeAssignment.period} · Grupo{" "}
        {activeAssignment.group}
      </p>

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

      {active && (
        <section aria-labelledby="active-title">
          <h2 id="active-title" className={styles.sectionTitle}>
            Asistencia activa
          </h2>
          <article className={styles.activeCard}>
            <div className={styles.activeHead}>
              <h3 className={styles.activeSubject}>{active.subject}</h3>
              <StatusBadge status={active.status} />
            </div>

            <dl className={styles.meta}>
              <div className={styles.metaItem}>
                <dt>
                  <Users aria-hidden="true" />
                  Grupo
                </dt>
                <dd>{active.group}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>
                  <CalendarDays aria-hidden="true" />
                  Fecha
                </dt>
                <dd>{active.date}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>
                  <Clock aria-hidden="true" />
                  Hora
                </dt>
                <dd>
                  {active.startTime}
                  {active.endTime ? ` - ${active.endTime}` : ""}
                </dd>
              </div>
            </dl>

            <div className={styles.progressRow}>
              <div className={styles.progressTrack}>
                <i
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <b className={styles.progressText}>
                {presentCount} / {active.students.length} estudiantes
              </b>
            </div>

            <div className={styles.actions}>
              <Link
                href={`/asistencias/${active.id}`}
                className={styles.btnPrimary}
              >
                <Eye aria-hidden="true" />
                Ver asistencia
              </Link>
              <Link
                href={`/asistencias/${active.id}`}
                className={styles.btnDangerGhost}
              >
                <Lock aria-hidden="true" />
                Cerrar asistencia
              </Link>
            </div>
          </article>
        </section>
      )}

      <section aria-labelledby="upcoming-title">
        <div className={styles.sectionHead}>
          <h2 id="upcoming-title" className={styles.sectionTitle}>
            Próximas asistencias
          </h2>
          <Link href="/asistencias" className={styles.linkBtn}>
            Ver todas
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.list}>
          {upcoming.map((item) => (
            <article key={item.id} className={styles.row}>
              <span className={styles.rowIcon} aria-hidden="true">
                <BookOpen />
              </span>
              <div className={styles.rowText}>
                <strong>{item.subject}</strong>
                <small>
                  {item.group} · {item.date} · {item.startTime}
                  {item.endTime ? ` - ${item.endTime}` : ""}
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
      </section>

      <div className={styles.twoCol}>
        <section aria-labelledby="quick-title">
          <h2 id="quick-title" className={styles.sectionTitle}>
            Acciones rápidas
          </h2>
          <div className={styles.quick}>
            {quickActions.map((action) => {
              const Icon = actionIcons[action.key];
              return (
                <Link
                  key={action.key}
                  href={actionHrefs[action.key]}
                  className={styles.quickBtn}
                >
                  <span className={styles.quickIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <span className={styles.quickText}>
                    <strong>{action.label}</strong>
                    <small>{action.hint}</small>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="role-title">
          <h2 id="role-title" className={styles.sectionTitle}>
            Tu rol
          </h2>
          <div className={styles.roleNote}>
            <Info aria-hidden="true" />
            <div>
              <strong>Representante de grupo</strong>
              <p>
                Operas únicamente sobre el grupo {activeAssignment.group} del
                período {activeAssignment.period}. Puedes preparar, abrir,
                compartir y cerrar sus asistencias.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
