/* Institución conectada a la API real.
   Ya no utiliza el mock (AcademyProvider/CrudModule) para esta entidad:
   los datos provienen de /academic/institutions con JWT. */

"use client";

import { PageHead } from "@/features/shared/PageHead";
import InstitutionsManager from "./InstitutionsManager";

export default function InstitucionPage() {
  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Institución"
        sub="Datos institucionales registrados en la plataforma."
      />
      <InstitutionsManager />
    </>
  );
}
