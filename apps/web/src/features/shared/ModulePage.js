/* Envoltura de página de módulo: título, descripción y motor CRUD.
   Evita repetir PageHead + CrudModule en cada ruta. */

"use client";

import { PageHead } from "./PageHead";
import { CrudModule } from "./CrudModule";

export function ModulePage({ config, eyebrow, title, sub, crumbs, extraActions, dependents }) {
  return (
    <>
      <PageHead
        eyebrow={eyebrow ?? "Administración"}
        crumbs={crumbs}
        title={title ?? config.title}
        sub={sub}
      />
      <CrudModule config={config} extraActions={extraActions} dependents={dependents} />
    </>
  );
}
