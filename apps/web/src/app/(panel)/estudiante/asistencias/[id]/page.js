import StudentShell from "@/components/StudentShell";
import MiAsistenciaDetail from "./MiAsistenciaDetail";

export const metadata = {
  title: "Mi asistencia | Estudiante",
  description: "Detalle del registro de asistencia del estudiante.",
};

export default async function MiAsistenciaPage({ params }) {
  const { id } = await params;
  return (
    <StudentShell active="asistencias">
      <MiAsistenciaDetail id={id} />
    </StudentShell>
  );
}
