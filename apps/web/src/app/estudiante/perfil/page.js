/* Mi perfil: solo lectura con datos reales (sesión + GET /users/:id).
   El grupo, el programa y el período los administra el sistema. */

"use client";

import { useEffect, useState } from "react";
import { Lock, UserRound } from "lucide-react";
import { EmptyState, ui } from "@/components/ui";
import { PageHead } from "@/features/shared/PageHead";
import { estudianteApi } from "@/services/api/estudiante";
import { leerSesion } from "@/services/api/auth";
import { ApiError } from "@/services/api/http";

function fechaCorta(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let viva = true;
    const t = setTimeout(() => {
      const actual = leerSesion();
      if (!viva) return;
      setSesion(actual?.user ?? null);
      estudianteApi
        .miPerfil()
        .then((data) => {
          if (viva) setPerfil(data);
        })
        .catch((e) => {
          if (viva) {
            setError(
              e instanceof ApiError
                ? e.message
                : "No se pudo cargar tu perfil. Intenta nuevamente.",
            );
          }
        })
        .finally(() => {
          if (viva) setCargando(false);
        });
    }, 0);
    return () => {
      viva = false;
      clearTimeout(t);
    };
  }, []);

  const filas = perfil
    ? [
        ["Usuario", perfil.username ?? "—"],
        ["Correo institucional", sesion?.email ?? perfil.email ?? "—"],
        ["Rol", (perfil.roles ?? []).join(", ") || "—"],
        ["Estado", perfil.status ?? "—"],
        ["Último acceso", fechaCorta(perfil.lastLoginAt)],
      ]
    : [];

  return (
    <>
      <PageHead
        eyebrow="Estudiante"
        title="Mi perfil"
        sub="Información básica de tu cuenta."
      />

      {cargando ? (
        <p role="status">Cargando tu perfil…</p>
      ) : error ? (
        <EmptyState icon={UserRound} title="No se pudo cargar tu perfil" text={error} />
      ) : (
        <>
          <dl className={ui.card} style={{ maxWidth: 640 }}>
            {filas.map(([label, value]) => (
              <div key={label} className={ui.defRow}>
                <span>{label}</span>
                <b style={{ overflowWrap: "anywhere" }}>{value}</b>
              </div>
            ))}
          </dl>

          <p className={ui.cellMuted}>
            <Lock aria-hidden="true" /> El grupo, el programa y el período los
            administra el sistema. No puedes modificarlos desde aquí.
          </p>
        </>
      )}
    </>
  );
}
