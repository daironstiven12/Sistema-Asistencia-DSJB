"use client";

import { useState } from "react";
import { Bell, CheckCircle2, TriangleAlert } from "lucide-react";
import { useAttendance } from "@/prototype/AttendanceContext";
import { useStudent } from "@/prototype/StudentContext";
import { buildNotifications } from "@/lib/studentNotifications";
import styles from "./StudentNotifications.module.css";

/* Campana con panel mock. Abrir el panel marca todo como visto. */
export default function StudentNotifications() {
  const { records } = useAttendance();
  const { profile, signature, seenCount, markSeen } = useStudent();
  const [open, setOpen] = useState(false);

  const items = buildNotifications(records, profile.key, !!signature);
  const unread = Math.max(0, items.length - seenCount);

  function toggle() {
    if (!open) markSeen(items.length);
    setOpen((value) => !value);
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.bell}
        aria-label={
          unread > 0
            ? `Notificaciones (${unread} sin leer)`
            : "Notificaciones"
        }
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell aria-hidden="true" />
        {unread > 0 && (
          <i className={styles.dot} aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className={styles.layer}>
          <div
            className={styles.backdrop}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            className={styles.panel}
            role="dialog"
            aria-label="Notificaciones"
          >
            <p className={styles.panelTitle}>Notificaciones</p>
            {items.length === 0 ? (
              <p className={styles.empty}>No tienes notificaciones.</p>
            ) : (
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    {item.kind === "ok" ? (
                      <CheckCircle2
                        className={styles.iconOk}
                        aria-hidden="true"
                      />
                    ) : (
                      <TriangleAlert
                        className={styles.iconWarn}
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <strong>{item.title}</strong>
                      {item.detail && <small>{item.detail}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
