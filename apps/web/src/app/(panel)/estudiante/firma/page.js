import StudentShell from "@/components/StudentShell";
import FirmaContent from "./FirmaContent";

export const metadata = {
  title: "Mi firma | Estudiante",
  description: "Gestiona tu firma para el registro de asistencia.",
};

export default function FirmaPage() {
  return (
    <StudentShell active="firma">
      <FirmaContent />
    </StudentShell>
  );
}
