"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import styles from "./LoginForm.module.css";

/* Tarjeta de inicio de sesión. Solo visual: sin autenticación real. */
export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className={styles.card} aria-label="Formulario de inicio de sesión">
      <div className={styles.head}>
        <span className={styles.mark} aria-hidden="true">
          UTCH
        </span>
        <span className={styles.product}>
          <strong>Asistencia</strong>
          <small>Plataforma académica</small>
        </span>
      </div>

      <h2 className={styles.title}>Iniciar sesión</h2>
      <p className={styles.sub}>
        Ingresa con tu correo institucional para continuar.
      </p>

      <form className={styles.fields} onSubmit={(event) => event.preventDefault()}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Correo institucional
          </label>
          <div className={styles.inputWrap}>
            <Mail className={styles.inputIcon} aria-hidden="true" />
            <input
              className={`${styles.input} ${styles.withIcon}`}
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="nombre@utch.edu.co"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Contraseña
          </label>
          <div className={styles.inputWrap}>
            <Lock className={styles.inputIcon} aria-hidden="true" />
            <input
              className={`${styles.input} ${styles.withIcon} ${styles.withAffix}`}
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.affix}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className={styles.rememberRow}>
          <label className={styles.check}>
            <input type="checkbox" name="remember" defaultChecked />
            Recordarme
          </label>
          <button type="button" className={styles.link}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          className={styles.button}
        >
          Iniciar sesión
          <ArrowRight aria-hidden="true" />
        </button>
      </form>

      <p className={styles.secure}>
        <ShieldCheck aria-hidden="true" />
        <span>
          Acceso para usuarios autorizados.
          <br />
          Nunca compartas tus credenciales institucionales.
        </span>
      </p>
    </section>
  );
}
