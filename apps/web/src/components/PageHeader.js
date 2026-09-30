import { Bell } from "lucide-react";
import { representative } from "@/data/representante";
import styles from "./PageHeader.module.css";

/* Encabezado de la sección: título, descripción y zona de usuario. */
export default function PageHeader({ title, subtitle }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
      </div>
      <div className={styles.right}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Notificaciones"
        >
          <Bell aria-hidden="true" />
          <i className={styles.alert} aria-hidden="true" />
        </button>
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.userText}>
          <strong>{representative.name}</strong>
          <small>{representative.role}</small>
        </span>
        <span className={styles.avatar} aria-hidden="true">
          {representative.initials}
        </span>
      </div>
    </header>
  );
}
