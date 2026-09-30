import AppShell from "@/components/AppShell";
import AsistenciasContent from "./AsistenciasContent";

export const metadata = {
  title: "Asistencias | Asistencia",
  description: "Asistencias de los grupos asignados al representante.",
};

export default function AsistenciasPage() {
  return (
    <AppShell active="asistencias">
      <AsistenciasContent />
    </AppShell>
  );
}
