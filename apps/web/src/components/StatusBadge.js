import styles from "./StatusBadge.module.css";

const tones = {
  Borrador: styles.draft,
  Programada: styles.scheduled,
  Abierta: styles.open,
  Cerrada: styles.closed,
  Validada: styles.validated,
  Firmada: styles.signed,
  Pendiente: styles.pending,
};

/* Etiqueta de estado del flujo de asistencia. */
export default function StatusBadge({ status }) {
  const tone = tones[status] ?? styles.neutral;
  const pulse = status === "Abierta" ? styles.pulse : "";
  return (
    <span className={`${styles.badge} ${tone}`}>
      <i className={`${styles.dot} ${pulse}`} aria-hidden="true" />
      {status}
    </span>
  );
}
