import styles from "./StatCard.module.css";

const tones = {
  neutral: styles.toneNeutral,
  blue: styles.toneBlue,
  accent: styles.toneAccent,
  warn: styles.toneWarn,
  purple: styles.tonePurple,
};

/* Tarjeta de resumen con icono, valor y texto secundario. */
export default function StatCard({ icon: Icon, label, value, foot, tone }) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.iconBox} ${tones[tone] ?? styles.toneNeutral}`}>
          <Icon aria-hidden="true" />
        </span>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.foot}>{foot}</div>
    </article>
  );
}
