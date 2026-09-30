import AppShell from "@/components/AppShell";
import ReportesContent from "./ReportesContent";

export const metadata = {
  title: "Reportes | Asistencia",
  description: "Resumen visual de la asistencia de los grupos asignados.",
};

export default function ReportesPage() {
  return (
    <AppShell active="reportes">
      <ReportesContent />
    </AppShell>
  );
}
