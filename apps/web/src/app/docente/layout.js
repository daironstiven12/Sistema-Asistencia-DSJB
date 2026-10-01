import RoleShell from "@/features/shared/RoleShell";
import { AcademyProvider } from "@/features/shared/AcademyProvider";

export const metadata = {
  title: "Docente",
  description: "Panel docente: clases asignadas y registro de asistencia.",
};

export default function DocenteLayout({ children }) {
  return (
    <AcademyProvider>
      <RoleShell role="docente" title="Docente">
        {children}
      </RoleShell>
    </AcademyProvider>
  );
}
