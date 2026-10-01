import styles from "./ui.module.css";

/* Etiqueta compacta de estado. `tone` mapea a la semántica global. */
const TONES = {
  ok: styles.toneOk,
  info: styles.toneInfo,
  warn: styles.toneWarn,
  danger: styles.toneDanger,
  teal: styles.toneTeal,
  neutral: styles.toneNeutral,
  solid: styles.pillSolid,
};

export function Pill({ tone = "neutral", dot = false, children }) {
  return (
    <span className={`${styles.pill} ${TONES[tone] ?? TONES.neutral}`}>
      {dot ? <i aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function Card({ flush = false, className = "", children, ...rest }) {
  return (
    <section
      className={`${styles.card} ${flush ? styles.cardFlush : ""} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardHead({ title, sub, actions }) {
  return (
    <div className={styles.cardHead}>
      <div>
        <h2 className={styles.cardTitle}>{title}</h2>
        {sub ? <p className={styles.cardSub}>{sub}</p> : null}
      </div>
      {actions ? <div className={styles.toolbarSpacer}>{actions}</div> : null}
    </div>
  );
}

/* Encabezado de ficha: código mono + rótulo + filete. */
export function RecordHeader({ code, title, sub, eyebrow }) {
  return (
    <>
      <div className={styles.dialogHead}>
        <div>
          {code ? <span className={styles.recordCode}>{code}</span> : null}
          <h2 style={{ marginTop: code ? 8 : 0 }}>{title}</h2>
          {sub ? <p className={styles.dialogSub}>{sub}</p> : null}
        </div>
      </div>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <hr className={styles.ruleStrong} />
    </>
  );
}

export function FieldGrid({ cells }) {
  return (
    <dl className={styles.fieldGrid}>
      {cells.map(({ label, value }) => (
        <div key={label} className={styles.fieldCell}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone = "ok", icon: Icon, children }) {
  const map = {
    ok: styles.noticeOk,
    error: styles.noticeError,
    info: styles.noticeInfo,
    warn: styles.noticeWarn,
  };
  return (
    <p className={map[tone] ?? styles.noticeOk} role="status">
      {Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </p>
  );
}

export function Meter({ value, max = 100, tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const toneClass =
    tone === "warn"
      ? styles.meterFillWarn
      : tone === "danger"
        ? styles.meterFillDanger
        : "";
  return (
    <div
      className={styles.meter}
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i className={`${styles.meterFill} ${toneClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function VisuallyHidden({ children }) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}

export const ui = styles;
