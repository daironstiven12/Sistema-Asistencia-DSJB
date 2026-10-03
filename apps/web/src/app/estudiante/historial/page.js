/* Mi historial: pendiente de endpoint exclusivo del estudiante.
   Hoy el backend solo expone historial para REPRESENTANTE/ADMINISTRADOR y
   listados por sesión con esa misma restricción; no se inventa ningún dato. */

"use client";

import Link from "next/link";
import { History, ListChecks } from "lucide-react";
import { EmptyState, Notice, ui } from "@/components/ui";
import { PageHead } from "@/features/shared/PageHead";

export default function MiHistorialPage() {
  return (
    <>
      <PageHead
        eyebrow="Estudiante"
        title="Mi historial"
        sub="Tus registros de asistencia, sesión por sesión."
      />

      <EmptyState icon={History} title="Historial en camino">
        <p className={ui.cellMuted}>
          Estamos preparando la consulta de tus asistencias con los datos
          reales del sistema. Mientras tanto, registra tu asistencia con el
          código de tu representante.
        </p>
        <div className={ui.emptyActions}>
          <Link href="/estudiante/registro" className={ui.btnPrimary}>
            <ListChecks aria-hidden="true" />
            Registrar asistencia
          </Link>
        </div>
      </EmptyState>

      <Notice tone="info">
        Verás aquí cada asistencia que registres: asignatura, fecha, horario
        y método de registro.
      </Notice>
    </>
  );
}
