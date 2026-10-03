/* Facultades conectadas a la API real.
   Ya no utilizan el mock para sus operaciones: los datos provienen de
   /academic/faculties con JWT y las instituciones del selector de
   /academic/institutions. */

"use client";

import { PageHead } from "@/features/shared/PageHead";
import FacultadesManager from "./FacultadesManager";

export default function FacultadesPage() {
  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Facultades"
        sub="Unidades académicas que agrupan programas y docentes."
      />
      <FacultadesManager />
    </>
  );
}
