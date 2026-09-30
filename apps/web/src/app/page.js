import LoginForm from "@/components/LoginForm";
import LoginIntro from "@/components/LoginIntro";
import styles from "./page.module.css";

const trustItems = ["Seguro", "Confiable", "Siempre disponible"];

export default function Home() {
  return (
    <main className={styles.login}>
      <div className={styles.decor} aria-hidden="true">
        <i className={styles.arc} />
        <i className={styles.blob} />
        <i className={styles.dotsLeft} />
        <i className={styles.dotsRight} />
      </div>

      <div className={styles.inner}>
        <div className={styles.topbar}>
          <span className={styles.brand}>
            <span className={styles.mark} aria-hidden="true">
              UTCH
            </span>
            <span className={styles.product}>
              <strong>Asistencia</strong>
              <small>Plataforma académica</small>
            </span>
          </span>
          <p className={styles.trust}>
            {trustItems.map((item, index) => (
              <span key={item} className={styles.trustItem}>
                {index > 0 && <i className={styles.sep} aria-hidden="true" />}
                {item}
                {index === trustItems.length - 1 && (
                  <i className={styles.underline} aria-hidden="true" />
                )}
              </span>
            ))}
          </p>
        </div>

        <div className={styles.grid}>
          <LoginIntro />
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
