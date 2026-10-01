/* Vistas cliente de los módulos de administración.

   Las páginas en `app/admin/*` son componentes de servidor: solo
   declaran metadatos y delegan. Aquí viven las configs, que contienen
   funciones de render y por tanto no pueden cruzar el límite de RSC. */

"use client";

import { ModulePage } from "@/features/shared/ModulePage";
import {
  asignaturasConfig,
  facultadesConfig,
  periodosConfig,
  planesConfig,
  programasConfig,
} from "./modules/catalog";
import { gruposConfig, usuariosConfig } from "./modules/poblacion";

export function FacultadesView() {
  return (
    <ModulePage
      config={facultadesConfig}
      sub="Unidades académicas que agrupan programas y docentes."
    />
  );
}

export function ProgramasView() {
  return (
    <ModulePage
      config={programasConfig}
      sub="Programas académicos ofrecidos por la institución y su facultad."
    />
  );
}

export function PlanesView() {
  return (
    <ModulePage
      config={planesConfig}
      sub="Estructura curricular de cada programa, con sus niveles y créditos."
    />
  );
}

export function AsignaturasView() {
  return (
    <ModulePage
      config={asignaturasConfig}
      sub="Catálogo de asignaturas con créditos, intensidad y tipo."
    />
  );
}

export function PeriodosView() {
  return (
    <ModulePage
      config={periodosConfig}
      sub="Ciclos académicos que delimitan la vigencia de grupos y sesiones."
    />
  );
}

export function UsuariosView() {
  return (
    <ModulePage
      config={usuariosConfig}
      sub="Cuentas de acceso y rol asignado a cada persona."
    />
  );
}

export function GruposView() {
  return (
    <ModulePage
      config={gruposConfig}
      sub="Grupos por programa, nivel y periodo con su matrícula."
    />
  );
}
