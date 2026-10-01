"use client";

import { useEffect } from "react";
import RoleShell from "@/features/shared/RoleShell";
import { AcademyProvider } from "@/features/shared/AcademyProvider";

/* El panel administrativo es claro: no ofrece selector de rol ni cambio
   de tema. Si otro panel dejó el tema oscuro en <html>, se restablece el
   claro al entrar. */
export default function AdminShell({ children }) {
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
  }, []);

  return (
    <AcademyProvider>
      <RoleShell
        role="admin"
        title="Administrador"
        showThemeToggle={false}
      >
        {children}
      </RoleShell>
    </AcademyProvider>
  );
}
