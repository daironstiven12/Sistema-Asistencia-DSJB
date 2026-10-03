"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import styles from "./LoginForm.module.css";
import { authApi } from "@/services/api/auth";
import { ApiError } from "@/services/api/http";

/* Tarjeta de inicio de sesión contra /auth/login. Guarda el JWT en
   localStorage("sa.accessToken") y navega según el rol real. */
export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (cargando) return;
    setError(null);
    if (!correo.trim() || !clave) {
      setError("Ingresa tu correo y tu contraseña.");
      return;
    }
    setCargando(true);
    try {
      const { home } = await authApi.login({ email: correo, password: clave });
      router.push(home);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No se pudo iniciar sesión. Intenta nuevamente.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className={styles.card} aria-label="Formulario de inicio de sesión">
      <div className={styles.head}>
        <span className={styles.mark} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.markLogo} src="/referencias/logo.jpeg" alt="" />
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

      {/* Sin method ni name: el envío es 100% React (onSubmit +
          preventDefault + fetch POST). Sin esos atributos el navegador
          tampoco puede serializar credenciales en un submit nativo. */}
      <form className={styles.fields} onSubmit={onSubmit} noValidate>
        {error ? (
          <p role="alert" style={{ color: "#b42318", fontSize: 13, margin: 0 }}>
            {error}
          </p>
        ) : null}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Correo institucional
          </label>
          <div className={styles.inputWrap}>
            <Mail className={styles.inputIcon} aria-hidden="true" />
            <input
              className={`${styles.input} ${styles.withIcon}`}
              id="email"
              type="email"
              autoComplete="username"
              placeholder="nombre@utch.edu.co"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              disabled={cargando}
              required
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
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={clave}
              onChange={(event) => setClave(event.target.value)}
              disabled={cargando}
              required
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
            <input type="checkbox" defaultChecked />
            Recordarme
          </label>
          <button type="button" className={styles.link}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          className={styles.button}
          disabled={cargando}
        >
          {cargando ? "Verificando…" : "Iniciar sesión"}
          <ArrowRight aria-hidden="true" />
        </button>
      </form>

      <p className={styles.secure} style={{ borderTop: 0, marginTop: 16, paddingTop: 0 }}>
        <span>
          ¿No tienes una cuenta?{" "}
          <Link href="/registro" className={styles.link}>
            Registrarme
          </Link>
        </span>
      </p>

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
