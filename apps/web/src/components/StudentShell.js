"use client";

import Link from "next/link";
import {
  ChevronDown,
  ClipboardList,
  Home,
  LogOut,
  PenLine,
  Settings,
  User,
} from "lucide-react";
import { useStudent } from "@/prototype/StudentContext";
import StudentNotifications from "./StudentNotifications";
import styles from "./StudentShell.module.css";

const navItems = [
  { key: "inicio", label: "Inicio", icon: Home, href: "/estudiante" },
  { key: "asistencias", label: "Mis asistencias", icon: ClipboardList, href: "/estudiante/asistencias" },
  { key: "firma", label: "Mi firma", icon: PenLine, href: "/estudiante/firma" },
  { key: "perfil", label: "Mi perfil", icon: User, href: "/estudiante/perfil" },
];

/* Estructura del panel del estudiante: navegación simple y rol visible. */
export default function StudentShell({ active, children }) {
  const { profile } = useStudent();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegación del estudiante">
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            UTCH
          </span>
          <span className={styles.product}>
            <strong>Asistencia</strong>
            <small>Panel del estudiante</small>
          </span>
        </div>

        <span className={styles.rolePill}>Estudiante</span>

        <nav className={styles.nav}>
          <p className={styles.navLabel}>Menú</p>
          {navItems.map(({ key, label, icon: Icon, href }) => (
            <Link
              key={key}
              href={href}
              className={`${styles.navItem} ${active === key ? styles.active : ""}`}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sideFoot}>
          <Link
            href="/estudiante/perfil"
            className={`${styles.navItem} ${active === "config" ? styles.active : ""}`}
          >
            <Settings aria-hidden="true" />
            <span>Configuración</span>
          </Link>
          <div className={styles.user}>
            <span className={styles.avatar} aria-hidden="true">
              {profile.initials}
            </span>
            <span className={styles.userText}>
              <strong>{profile.name}</strong>
              <small>{profile.group}</small>
              <small>{profile.period}</small>
            </span>
            <button
              type="button"
              className={styles.logout}
              aria-label="Cerrar sesión"
            >
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarSpacer} aria-hidden="true" />
          <StudentNotifications />
          <Link href="/estudiante/perfil" className={styles.topbarUser}>
            <span className={styles.avatar} aria-hidden="true">
              {profile.initials}
            </span>
            <span className={styles.topbarName}>{profile.name}</span>
            <ChevronDown aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.mobileBar}>
          <span className={styles.mark} aria-hidden="true">
            UTCH
          </span>
          <span className={styles.product}>
            <strong>Asistencia</strong>
            <small>Estudiante</small>
          </span>
          <span className={styles.mobileActions}>
            <StudentNotifications />
            <span className={styles.avatar} aria-hidden="true">
              {profile.initials}
            </span>
          </span>
        </div>

        <nav className={styles.mobileNav} aria-label="Navegación del estudiante">
          {navItems.map(({ key, label, icon: Icon, href }) => (
            <Link
              key={key}
              href={href}
              className={`${styles.navItem} ${active === key ? styles.active : ""}`}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
