"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { NAV_BY_ROLE, ROLE_META } from "./roleConfig";
import { useTheme } from "@/lib/theme";
import styles from "./RoleShell.module.css";

export default function RoleShell({
  role,
  active,
  title,
  breadcrumb,
  actions,
  children,
  showThemeToggle = true,
}) {
  const pathname = usePathname() ?? "";
  const meta = ROLE_META[role];
  const nav = NAV_BY_ROLE[role];
  const themeApi = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  /* La sección activa se deriva de la ruta, no de cada página. */
  const currentKey =
    active ??
    nav
      .flatMap((group) => group.items)
      .filter((item) =>
        item.href === meta.home
          ? pathname === meta.home
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.key;

  const currentLabel = nav
    .flatMap((group) => group.items)
    .find((item) => item.key === currentKey)?.label;

  return (
    <div className={styles.ren}>
      {menuOpen ? (
        <div
          className={styles.scrim}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
        aria-label="Navegación principal"
      >
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            UTCH
          </span>
          <span className={styles.product}>
            <strong>Asistencia</strong>
            <small>Plataforma académica</small>
          </span>
        </div>

        <span className={styles.rolePill}>{meta.label}</span>

        <nav className={styles.scroll}>
          {nav.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <p className={styles.navLabel}>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentKey === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className={styles.navBadge}>{item.badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.foot}>
          <div className={styles.user}>
            <span className={styles.avatar} aria-hidden="true">
              {meta.persona.iniciales}
            </span>
            <span className={styles.userText}>
              <strong>{meta.persona.nombre}</strong>
              <small>{meta.persona.descripcion}</small>
            </span>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Cerrar sesión"
              style={{ marginLeft: "auto" }}
            >
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.mobileBar}
            aria-label="Abrir navegación"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          <nav className={styles.crumbs} aria-label="Ruta">
            <span>{meta.label}</span>
            <ChevronRight aria-hidden="true" />
            <strong>{breadcrumb ?? currentLabel ?? title}</strong>
          </nav>

          <span className={styles.spacer} />

          {showThemeToggle ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={themeApi.toggle}
              aria-label={themeApi.theme === "dark" ? "Usar tema claro" : "Usar tema oscuro"}
            >
              {themeApi.theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
          ) : null}

          <button type="button" className={styles.iconBtn} aria-label="Notificaciones">
            <Bell aria-hidden="true" />
            <i className={styles.alert} aria-hidden="true" />
          </button>
        </header>

        <main className={styles.content}>
          {actions ? actions : null}
          {children}
        </main>
      </div>
    </div>
  );
}
