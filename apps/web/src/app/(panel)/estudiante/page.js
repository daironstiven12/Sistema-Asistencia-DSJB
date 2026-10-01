import StudentShell from "@/components/StudentShell";
import EstudianteHome from "./EstudianteHome";

export const metadata = {
  title: "Inicio | Estudiante",
  description: "Panel del estudiante: registrar y consultar asistencias.",
};

export default function EstudiantePage() {
  return (
    <StudentShell active="inicio">
      <EstudianteHome />
    </StudentShell>
  );
}
