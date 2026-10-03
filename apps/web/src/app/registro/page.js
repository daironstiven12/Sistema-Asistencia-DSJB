import RegisterForm from "@/components/RegisterForm";
import styles from "./page.module.css";

export const metadata = {
  title: "Crear cuenta de estudiante | Asistencia UTCH",
  description: "Registro de cuenta de estudiante con correo institucional.",
};

export default function RegistroPage() {
  return (
    <main className={styles.login}>
      <div className={styles.decor} aria-hidden="true">
        <i className={styles.arc} />
        <i className={styles.blob} />
        <i className={styles.dotsLeft} />
        <i className={styles.dotsRight} />
      </div>

      <div className={styles.inner}>
        <RegisterForm />
      </div>
    </main>
  );
}
