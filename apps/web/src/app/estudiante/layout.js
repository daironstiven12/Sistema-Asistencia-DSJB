import RoleShell from "@/features/shared/RoleShell";
import { AcademyProvider } from "@/features/shared/AcademyProvider";
import { AttendanceProvider } from "@/prototype/AttendanceContext";
import { StudentProvider } from "@/prototype/StudentContext";

export const metadata = {
  title: "Estudiante",
  description: "Panel del estudiante: materias, firma y registro de asistencia.",
};

export default function EstudianteLayout({ children }) {
  return (
    <AcademyProvider>
      <AttendanceProvider>
        <StudentProvider>
          <RoleShell role="estudiante" title="Estudiante">
            {children}
          </RoleShell>
        </StudentProvider>
      </AttendanceProvider>
    </AcademyProvider>
  );
}
