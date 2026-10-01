import RoleShell from "@/features/shared/RoleShell";
import { AcademyProvider } from "@/features/shared/AcademyProvider";

export const metadata = {
  title: "Estudiante",
  description: "Panel del estudiante: materias y registro de asistencia.",
};

export default function EstudianteLayout({ children }) {
  return (
    <AcademyProvider>
      <RoleShell role="estudiante" title="Estudiante">
        {children}
      </RoleShell>
    </AcademyProvider>
  );
}
