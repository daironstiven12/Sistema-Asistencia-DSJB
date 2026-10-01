"use client";

import RoleShell from "@/features/shared/RoleShell";
import { AcademyProvider } from "@/features/shared/AcademyProvider";

/* Shell del panel administrativo: tema claro, sin selector de rol. */
export default function AdminShell({ children }) {
  return (
    <AcademyProvider>
      <RoleShell role="admin" title="Administrador">
        {children}
      </RoleShell>
    </AcademyProvider>
  );
}
