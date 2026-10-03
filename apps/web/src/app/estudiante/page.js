/* Inicio del estudiante: saludo real, tarjeta compacta de registro y
   tarjeta de historial con estado vacío honesto (sin endpoint personal). */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ClipboardCheck, FileClock, History, KeyRound } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { PageHead } from "@/features/shared/PageHead";
import { leerSesion } from "@/services/api/auth";
import styles from "./estudiante-home.module.css";

export default function EstudianteHome() {
  const router = useRouter();
  const { user } = leerSesion();
  const nombre = user?.username ?? "estudiante";
  const [codigo, setCodigo] = useState("");

  /* Misma acción que el CTA actual: ir al registro. Si hay código, viaja
     como query para pre-rellenar el formulario de registro. */
  function onSubmit(event) {
    event.preventDefault();
    const limpio = codigo.trim().toUpperCase();
    router.push(
      limpio ? `/estudiante/registro?code=${encodeURIComponent(limpio)}` : "/estudiante/registro",
    );
  }

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <PageHead
            eyebrow="Estudiante"
            title={`Hola, ${nombre}`}
            sub="Registra tu asistencia con el código de tu representante."
          />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.heroImg}
          src="/referencias/estudiante-dashboard.png"
          alt="Estudiante registrando asistencia"
          width={1781}
          height={883}
          loading="eager"
        />
      </div>

      <section className={styles.card} aria-label="Registrar asistencia">
        <span className={styles.icon} aria-hidden="true">
          <ClipboardCheck />
        </span>
        <div className={styles.cardText}>
          <strong>Registrar asistencia</strong>
          <small>Ingresa el código de la sesión abierta para registrar tu asistencia.</small>
        </div>
        <form className={styles.codeForm} onSubmit={onSubmit}>
          <label className={styles.codeField}>
            <KeyRound aria-hidden="true" />
            <input
              type="text"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              placeholder="ASIS-XXXXXXXX"
              autoComplete="off"
              spellCheck={false}
              aria-label="Código de asistencia"
            />
          </label>
          <button type="submit" className={styles.cta}>
            Registrar asistencia
          </button>
        </form>
      </section>

      <section className={styles.historyCard} aria-label="Historial de asistencias">
        <div className={styles.historyHead}>
          <span className={styles.icon} aria-hidden="true">
            <History />
          </span>
          <div className={styles.cardText}>
            <strong>Historial de asistencias</strong>
            <small>Aquí podrás ver todas las asistencias que has registrado.</small>
          </div>
          <span className={styles.filterChip} aria-hidden="true">
            Más recientes
            <ChevronDown />
          </span>
        </div>
        <div className={styles.emptyWrap}>
          <EmptyState icon={FileClock} title="Sin registros todavía">
            <p>Tu historial aparecerá aquí cuando registres una asistencia.</p>
          </EmptyState>
        </div>
      </section>
    </div>
  );
}
