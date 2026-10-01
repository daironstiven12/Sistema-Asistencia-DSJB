"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkbars } from "./charts";
import styles from "./ui.module.css";

const ICON_TONES = {
  accent: styles.kpiIconAccent,
  info: styles.kpiIconInfo,
  warn: styles.kpiIconWarn,
  danger: styles.kpiIconDanger,
  teal: styles.kpiIconTeal,
};

/* Tarjeta KPI. `trend` es un porcentaje opcional de variación. */
export function StatsCard({
  icon: Icon,
  label,
  value,
  foot,
  tone = "neutral",
  trend,
  trendLabel,
  spark,
  wide = false,
}) {
  const delta =
    typeof trend === "number" ? (trend > 0 ? trend : trend < 0 ? trend : 0) : null;
  const deltaClass =
    delta === null
      ? styles.kpiDeltaFlat
      : delta > 0
        ? styles.kpiDeltaUp
        : delta < 0
          ? styles.kpiDeltaDown
          : styles.kpiDeltaFlat;
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;

  return (
    <article className={`${styles.kpi} ${wide ? styles.kpiWide : ""}`}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiLabel}>{label}</span>
        {Icon ? (
          <span
            className={`${styles.kpiIcon} ${ICON_TONES[tone] ?? ""}`}
            aria-hidden="true"
          >
            <Icon />
          </span>
        ) : null}
      </div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiTop}>
        <span className={styles.kpiFoot}>
          {delta !== null ? (
            <span className={`${styles.kpiDelta} ${deltaClass}`}>
              <DeltaIcon aria-hidden="true" />
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          ) : null}
          {trendLabel ? ` ${trendLabel}` : null}
          {delta === null && !trendLabel ? foot : null}
        </span>
        {spark?.length ? <Sparkbars values={spark} /> : null}
      </div>
    </article>
  );
}

export function StatsGrid({ children, className = "" }) {
  return <div className={`${styles.kpiGrid} ${className}`}>{children}</div>;
}
