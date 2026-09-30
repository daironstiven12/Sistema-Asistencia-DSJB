import { Bell, Lock, SlidersHorizontal, User } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import styles from "./page.module.css";

export const metadata = {
  title: "Configuración | Asistencia",
  description: "Preferencias visuales de la cuenta del representante.",
};

const sections = [
  {
    icon: User,
    title: "Perfil",
    text: "Nombre, correo institucional y grupo asignado.",
    control: (
      <div className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">
          JP
        </span>
        <div>
          <strong>Jeanpier Polanco</strong>
          <small>jeanpier.polanco@utch.edu.co</small>
        </div>
      </div>
    ),
  },
  {
    icon: SlidersHorizontal,
    title: "Preferencias",
    text: "Idioma y formato de fecha y hora.",
    control: (
      <div className={styles.row}>
        <select aria-label="Idioma" defaultValue="es">
          <option value="es">Español</option>
        </select>
        <select aria-label="Formato de hora" defaultValue="12h">
          <option value="12h">12 horas</option>
          <option value="24h">24 horas</option>
        </select>
      </div>
    ),
  },
  {
    icon: Bell,
    title: "Notificaciones",
    text: "Avisos sobre asistencias programadas y cierres.",
    control: (
      <div className={styles.checks}>
        <label className={styles.check}>
          <input type="checkbox" defaultChecked />
          Recordatorio antes de abrir
        </label>
        <label className={styles.check}>
          <input type="checkbox" defaultChecked />
          Confirmación de cierre
        </label>
        <label className={styles.check}>
          <input type="checkbox" />
          Resumen semanal
        </label>
      </div>
    ),
  },
  {
    icon: Lock,
    title: "Seguridad",
    text: "Sesión actual y verificación en dos pasos.",
    control: (
      <div className={styles.checks}>
        <label className={styles.check}>
          <input type="checkbox" defaultChecked />
          Verificación en dos pasos
        </label>
        <button type="button" className={styles.btnSecondary}>
          Cambiar contraseña
        </button>
      </div>
    ),
  },
];

/* Configuración visual. Sin cambios reales. */
export default function ConfiguracionPage() {
  return (
    <AppShell active="configuracion">
      <div className={styles.content}>
        <PageHeader
          title="Configuración"
          subtitle="Preferencias de tu cuenta de representante."
        />

        <div className={styles.grid}>
          {sections.map(({ icon: Icon, title, text, control }) => (
            <section key={title} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <h2 className={styles.cardTitle}>{title}</h2>
                  <p className={styles.cardSub}>{text}</p>
                </div>
              </div>
              {control}
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
