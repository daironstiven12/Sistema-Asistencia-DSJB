import { Users } from "lucide-react";
import styles from "./StudentHeader.module.css";

/* Encabezado del estudiante: título, subtítulo y contexto opcional. */
export default function StudentHeader({ title, subtitle, context }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
      </div>
      {context && (
        <span className={styles.contextPill}>
          <Users aria-hidden="true" />
          {context}
        </span>
      )}
    </header>
  );
}
