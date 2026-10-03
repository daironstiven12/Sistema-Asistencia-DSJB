"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import modalStyles from "@/components/SessionModal.module.css";
import { ResultModal, SessionModal } from "@/components/SessionModal";
import { authApi } from "@/services/api/auth";
import { ApiError } from "@/services/api/http";
import styles from "@/components/RegisterForm.module.css";

const MIN_CLAVE = 6;

function esEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor ?? "").trim());
}

/* Crear cuenta de estudiante: sin usuario, código, grupo ni firma.
   El registro de cuenta y el registro de asistencia son procesos distintos. */
export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [verClave, setVerClave] = useState(false);
  const [verConfirm, setVerConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [cargando, setCargando] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function validar() {
    if (!form.firstName.trim()) return "Ingresa tu nombre.";
    if (!form.lastName.trim()) return "Ingresa tu apellido.";
    if (!form.email.trim()) return "Ingresa un correo electrónico válido.";
    if (!form.password || !form.confirm) {
      return "Completa todos los campos para crear tu cuenta.";
    }
    if (!esEmail(form.email)) return "Ingresa un correo electrónico válido.";
    if (form.password.length < MIN_CLAVE) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (form.password !== form.confirm) return "Las contraseñas no coinciden.";
    return null;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (cargando) return;
    const fallo = validar();
    if (fallo) {
      setError(fallo);
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await authApi.registerStudent({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      // Auto-login con las credenciales recién registradas: misma lógica y
      // almacenamiento de sesión que el login normal. Si falla, se conserva
      // el flujo anterior (modal hacia el login manual).
      try {
        const { home } = await authApi.login({
          email: form.email,
          password: form.password,
        });
        router.push(home);
        return;
      } catch {
        setModal({ kind: "exito" });
      }
    } catch (e) {
      setModal({
        kind: "error",
        mensaje:
          e instanceof ApiError
            ? e.message
            : "No se pudo crear la cuenta. Intenta nuevamente.",
      });
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className={styles.card} aria-label="Crear cuenta">
      <h2 className={styles.title}>Crear cuenta</h2>
      <p className={styles.sub}>Regístrate para acceder al sistema de asistencia.</p>

      <form className={styles.fields} onSubmit={onSubmit} method="post" noValidate>
        {error ? (
          <p role="alert" style={{ color: "#b42318", fontSize: 13, margin: "0 0 14px" }}>
            {error}
          </p>
        ) : null}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="firstName">
              Nombre
            </label>
            <input
              className={styles.input}
              id="firstName"
              
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              disabled={cargando}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lastName">
              Apellido
            </label>
            <input
              className={styles.input}
              id="lastName"
              
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              disabled={cargando}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label} htmlFor="email">
              Correo institucional
            </label>
            <input
              className={styles.input}
              id="email"
              
              type="email"
              autoComplete="email"
              placeholder="ejemplo@utch.edu.co"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={cargando}
              required
            />
            <p className={styles.help}>Utiliza tu correo institucional.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña
            </label>
            <div className={styles.inputWrap}>
              <input
                className={`${styles.input} ${styles.withAffix}`}
                id="password"
                
                type={verClave ? "text" : "password"}
                autoComplete="new-password"
                placeholder={`Mínimo ${MIN_CLAVE} caracteres`}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                disabled={cargando}
                required
              />
              <button
                type="button"
                className={styles.affix}
                aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={verClave}
                onClick={() => setVerClave((v) => !v)}
              >
                {verClave ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">
              Confirmar contraseña
            </label>
            <div className={styles.inputWrap}>
              <input
                className={`${styles.input} ${styles.withAffix}`}
                id="confirm"
                
                type={verConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                disabled={cargando}
                required
              />
              <button
                type="button"
                className={styles.affix}
                aria-label={verConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
                aria-pressed={verConfirm}
                onClick={() => setVerConfirm((v) => !v)}
              >
                {verConfirm ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className={styles.button} disabled={cargando}>
          {cargando ? "Creando cuenta…" : "Crear cuenta"}
          <ArrowRight aria-hidden="true" />
        </button>
      </form>

      <p className={styles.secure}>
        <span>
          ¿Ya tienes una cuenta?{" "}
          <Link href="/" className={styles.link}>
            Iniciar sesión
          </Link>
        </span>
      </p>

      <SessionModal
        open={modal?.kind === "exito"}
        onClose={() => router.push("/")}
        title="Cuenta creada correctamente"
        tone="success"
        icon={CheckCircle2}
        actions={
          <button
            type="button"
            data-autofocus
            className={modalStyles.btnPrimary}
            onClick={() => router.push("/")}
          >
            Iniciar sesión
          </button>
        }
      >
        <p>Ahora puedes iniciar sesión con tu correo institucional.</p>
      </SessionModal>
      <ResultModal
        open={modal?.kind === "error"}
        onClose={() => setModal(null)}
        tone="error"
        title="No fue posible crear la cuenta"
        message={modal?.mensaje ?? ""}
        actionLabel="Entendido"
        icon={XCircle}
      />
    </section>
  );
}
