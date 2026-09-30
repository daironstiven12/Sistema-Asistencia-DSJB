import Link from "next/link";
import {
  BarChart3,
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { representative } from "@/data/representante";
import styles from "./AppShell.module.css";

const navItems = [
  { key: "inicio", label: "Inicio", icon: LayoutDashboard, href: "/inicio" },
  { key: "asistencias", label: "Asistencias", icon: ClipboardList, href: "/asistencias" },
  { key: "grupos", label: "Grupos", icon: Users, href: "/grupos" },
  { key: "historial", label: "Historial", icon: History, href: "/historial" },
  { key: "reportes", label: "Reportes", icon: BarChart3, href: "/reportes" },
];

/* Estructura de la aplicación: sidebar en desktop, barra superior y
   navegación horizontal en móvil. `active` indica la sección actual. */
export default function AppShell({ active, children }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegación principal">
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            UTCH
          </span>
          <span className={styles.product}>
            <strong>Asistencia</strong>
            <small>Gestión académica</small>
          </span>
        </div>

        <span className={styles.rolePill}>Representante</span>

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
            href="/configuracion"
            className={`${styles.navItem} ${active === "configuracion" ? styles.active : ""}`}
            aria-current={active === "configuracion" ? "page" : undefined}
          >
            <Settings aria-hidden="true" />
            <span>Configuración</span>
          </Link>
          <div className={styles.user}>
            <span className={styles.avatar} aria-hidden="true">
              {representative.initials}
            </span>
            <span className={styles.userText}>
              <strong>{representative.name}</strong>
              <small>{representative.role}</small>
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
        <div className={styles.mobileBar}>
          <span className={styles.mark} aria-hidden="true">
            UTCH
          </span>
          <span className={styles.product}>
            <strong>Asistencia</strong>
            <small>Representante</small>
          </span>
          <span className={styles.mobileActions}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Notificaciones"
            >
              <Bell aria-hidden="true" />
              <i className={styles.alert} aria-hidden="true" />
            </button>
            <span className={styles.avatar} aria-hidden="true">
              {representative.initials}
            </span>
          </span>
        </div>

        <nav className={styles.mobileNav} aria-label="Navegación principal">
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
          <Link
            href="/configuracion"
            className={`${styles.navItem} ${active === "configuracion" ? styles.active : ""}`}
            aria-current={active === "configuracion" ? "page" : undefined}
          >
            <Settings aria-hidden="true" />
            <span>Configuración</span>
          </Link>
        </nav>

        {children}
      </div>
    </div>
  );
}
