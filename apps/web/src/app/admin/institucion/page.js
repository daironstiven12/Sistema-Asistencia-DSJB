/* Institución: gestión del registro institucional. Permite visualizar,
   crear, editar, activar y desactivar. Al guardar, las estadísticas del
   dashboard se actualizan porque leen la misma colección. */

"use client";

import { Building2, Globe, MapPin, Phone } from "lucide-react";
import { Card, CardHead, Notice, Pill, ui } from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { CrudModule } from "@/features/shared/CrudModule";
import { institucionesConfig } from "@/features/admin/modules/catalog";

export default function InstitucionPage() {
  const { db } = useAcademy();
  const activa = db.instituciones.find((i) => i.estado === "Activo") ?? db.instituciones[0];

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Institución"
        sub="Datos legales y de contacto que aparecen en actas y reportes."
      />

      {activa ? (
        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Institución activa</h2>
              <p className={ui.cellMuted}>Registro vigente en la plataforma.</p>
            </div>
            <Pill tone="ok">{activa.estado}</Pill>
          </CardHead>
          <dl className={ui.defList}>
            <div>
              <dt>Nombre</dt>
              <dd>{activa.nombre}</dd>
            </div>
            <div>
              <dt>Sigla</dt>
              <dd>{activa.sigla}</dd>
            </div>
            <div>
              <dt>NIT</dt>
              <dd>{activa.nit}</dd>
            </div>
            <div>
              <dt>Rector</dt>
              <dd>{activa.rector}</dd>
            </div>
          </dl>
          <ul className={ui.alertList} style={{ marginTop: 12 }}>
            <li>
              <MapPin aria-hidden="true" />
              <span>{activa.ubicacion}</span>
            </li>
            <li>
              <Phone aria-hidden="true" />
              <span>{activa.telefono}</span>
            </li>
            <li>
              <Globe aria-hidden="true" />
              <span>{activa.sitioWeb}</span>
            </li>
          </ul>
        </Card>
      ) : (
        <Notice tone="warn" icon={Building2}>
          No hay ninguna institución registrada. Crea la primera para que actas y reportes tengan
          encabezado institucional.
        </Notice>
      )}

      <CrudModule
        config={institucionesConfig}
        intro="Gestiona el registro institucional. Los cambios quedan registrados en la auditoría y se
        reflejan de inmediato en las estadísticas."
      />
    </>
  );
}
