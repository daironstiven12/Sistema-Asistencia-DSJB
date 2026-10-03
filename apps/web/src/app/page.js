import LoginForm from "@/components/LoginForm";
import styles from "./page.module.css";

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
        <LoginForm />
      </div>
    </main>
  );
}
