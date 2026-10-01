/* Cabecera de página del panel. Reemplaza PageHeader con soporte de
   migas, acciones y eyebrow de ficha. */

import { ChevronRight } from "lucide-react";
import { ui } from "@/components/ui";
import styles from "./RoleShell.module.css";

export function PageHead({ title, sub, eyebrow, actions, crumbs = [] }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        {crumbs.length > 0 ? (
          <nav
            aria-label="Ruta"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              color: "var(--text-4)",
              marginBottom: 6,
            }}
          >
            {crumbs.map((crumb, index) => (
              <span key={crumb} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                {index > 0 ? <ChevronRight aria-hidden="true" style={{ width: 11, height: 11 }} /> : null}
                {crumb}
              </span>
            ))}
          </nav>
        ) : eyebrow ? (
          <p className={ui.eyebrow} style={{ marginBottom: 6 }}>
            {eyebrow}
          </p>
        ) : null}
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {sub ? (
          <p style={{ fontSize: 14, color: "var(--text-3)", marginTop: 5 }}>{sub}</p>
        ) : null}
      </div>
      {actions ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
      ) : null}
    </header>
  );
}

/* Rejilla estándar de dos columnas con columna lateral prioritaria. */
export function SplitGrid({ main, side }) {
  return (
    <div className={styles.splitResponsive}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        {main}
      </div>
      <aside style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        {side}
      </aside>
    </div>
  );
}

export function AutoGrid({ min = 300, children, gap = 18 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}
