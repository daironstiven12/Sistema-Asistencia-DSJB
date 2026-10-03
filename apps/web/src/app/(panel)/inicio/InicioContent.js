"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  FileClock,
  History,
  Lock,
  Plus,
  QrCode,
  Radio,
  ShieldCheck,
  UsersRound,
  Zap,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { useMySessions } from "../asistencias/useSessionsApi";
import { attendanceApi } from "@/services/api/attendance";
import styles from "./page.module.css";

const actionIcons = {
  prepare: Plus,
  groups: UsersRound,
  history: History,
};

const ACCIONES = [
  {
    key: "prepare",
    label: "Preparar asistencia",
    hint: "Programa una sesión para tu grupo",
    href: "/asistencias/nueva",
  },
  {
    key: "groups",
    label: "Ver mi grupo",
    hint: "Grupo asignado",
    href: "/grupos",
  },
  {
    key: "history",
    label: "Ver historial",
    hint: "Actividad reciente de asistencias",
    href: "/historial",
  },
];

/* Panel del representante: sesiones y ofertas reales de la API.
   La lógica de estados NO se toca: solo ABIERTA es "activa". */
export default function InicioContent() {
  const { filas, cargando } = useMySessions();
  const [registrados, setRegistrados] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const current = filas;
  const openList = current.filter((r) => r.status === "Abierta");
  const pendingList = current.filter((r) => r.status === "Borrador");
  const upcoming = pendingList;
  /* Solo una sesión ABIERTA puede ser "activa". Nunca Borrador, Cerrada,
     Firmada ni ninguna otra: sin Abierta no hay tarjeta activa. */
  const active = openList[0] ?? null;

  const activeId = active?.id ?? null;

  useEffect(() => {
    if (!activeId) return undefined;
    let viva = true;
    attendanceApi
      .records(activeId)
      .catch(() => [])
      .then((rows) => {
        if (viva) setRegistrados(Array.isArray(rows) ? rows : []);
      });
    return () => {
      viva = false;
    };
  }, [activeId]);

  useEffect(() => {
    let viva = true;
    attendanceApi
      .listOfferings()
      .catch(() => [])
      .then((rows) => {
        if (viva) setOfertas(Array.isArray(rows) ? rows : []);
      });
    return () => {
      viva = false;
    };
  }, []);

  /* Grupo/período reales: de las ofertas asignadas; respaldo en sesiones. */
  const grupoAsignado =
    ofertas.find((o) => o.group)?.group ??
    current.find((r) => r.group && r.group !== "—")?.group ??
    null;
  const periodoAsignado =
    ofertas.find((o) => o.period)?.period ??
    current.find((r) => r.period)?.period ??
    null;

  const summary = [
    {
      key: "group",
      icon: UsersRound,
      label: "Grupo asignado",
      value: grupoAsignado ?? "—",
      foot: periodoAsignado ?? "Sin período detectado",
      tone: "blue",
    },
    {
      key: "today",
      icon: CalendarDays,
      label: "Asistencias de hoy",
      value: String(openList.length + pendingList.length),
      foot: `${openList.length} abierta · ${pendingList.length} pendientes`,
      tone: "purple",
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
      icon: Clock3,
      label: "Asistencias pendientes",
      value: String(pendingList.length),
      foot: "Borrador o programadas",
      tone: "warn",
    },
  ];

  const presentCount = registrados.length;

  return (
    <div className={styles.content}>
      <PageHeader
        title="Inicio"
        subtitle="Gestiona las asistencias de tu grupo."
      />
      {grupoAsignado && periodoAsignado ? (
        <p className={styles.context}>
          <BookOpen aria-hidden="true" />
          Período académico {periodoAsignado} · Grupo {grupoAsignado}
        </p>
      ) : null}

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

      {cargando && !active ? (
        <p role="status">Cargando asistencias…</p>
      ) : null}
      {active ? (
        <section aria-labelledby="active-title">
          <h2 id="active-title" className={styles.sectionTitle}>
            <Radio aria-hidden="true" />
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
                  <UsersRound aria-hidden="true" />
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
                  <Clock3 aria-hidden="true" />
                  Hora
                </dt>
                <dd>
                  {active.startTime}
                  {active.endTime ? ` - ${active.endTime}` : ""}
                </dd>
              </div>
            </dl>

            <div className={styles.progressRow}>
              <b className={styles.progressText}>
                {presentCount} registrado{presentCount === 1 ? "" : "s"}
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
      ) : null}
      {!active && !cargando ? (
        <section aria-labelledby="active-title">
          <h2 id="active-title" className={styles.sectionTitle}>
            <Radio aria-hidden="true" />
            Asistencia activa
          </h2>
          <article className={styles.emptyActive}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <FileClock />
            </span>
            <h3>No tienes una asistencia abierta</h3>
            <p>Aquí aparecerá la asistencia que tengas abierta para registrar estudiantes.</p>
            <Link href="/asistencias/nueva" className={styles.btnPrimary}>
              <Plus aria-hidden="true" />
              Preparar asistencia
            </Link>
          </article>
        </section>
      ) : null}

      <div className={styles.twoCol}>
        <section aria-labelledby="upcoming-title">
          <div className={styles.sectionHead}>
            <h2 id="upcoming-title" className={styles.sectionTitle}>
              <CalendarDays aria-hidden="true" />
              Próximas asistencias
            </h2>
            <Link href="/asistencias" className={styles.linkBtn}>
              Ver todas
              <ChevronRight aria-hidden="true" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className={styles.emptyList} role="status">
              No tienes próximas asistencias programadas.
            </p>
          ) : (
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
                    aria-label={`Gestionar ${item.subject}`}
                  >
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className={styles.sideCol}>
          <section aria-labelledby="quick-title">
            <h2 id="quick-title" className={styles.sectionTitle}>
              <Zap aria-hidden="true" />
              Acciones rápidas
            </h2>
            <div className={styles.quick}>
              {ACCIONES.map((action) => {
                const Icon = actionIcons[action.key];
                return (
                  <Link
                    key={action.key}
                    href={action.href}
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
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>Representante de grupo</strong>
                <p>
                  {grupoAsignado && periodoAsignado ? (
                    <>
                      Operas únicamente sobre el grupo {grupoAsignado} del
                      período {periodoAsignado}.
                    </>
                  ) : (
                    <>Operas únicamente sobre tu grupo asignado del período académico.</>
                  )}{" "}
                  Puedes preparar, abrir, compartir y cerrar sus asistencias.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
