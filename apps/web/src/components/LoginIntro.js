import { BarChart3, ShieldCheck, Users } from "lucide-react";
import styles from "./LoginIntro.module.css";

const features = [
  {
    icon: Users,
    title: "Registro ágil y seguro",
    text: "Por QR, código o firma",
  },
  {
    icon: BarChart3,
    title: "Seguimiento en tiempo real",
    text: "Control y reportes verificados",
  },
  {
    icon: ShieldCheck,
    title: "Gestión por roles",
    text: "Representantes, docentes y administración",
  },
];

/* Zona izquierda del login: identidad y propuesta de valor. */
export default function LoginIntro() {
  return (
    <section className={styles.intro} aria-label="Presentación de la plataforma">
      <i className={styles.dash} aria-hidden="true" />
      <h1 className={styles.title}>Gestión de asistencia académica</h1>
      <p className={styles.lead}>
        Una plataforma moderna para el registro, control y seguimiento de
        asistencias en la Universidad Tecnológica del Chocó.
      </p>
      <ul className={styles.features}>
        {features.map(({ icon: Icon, title, text }) => (
          <li key={title} className={styles.feature}>
            <span className={styles.featureIcon} aria-hidden="true">
              <Icon />
            </span>
            <span className={styles.featureText}>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
