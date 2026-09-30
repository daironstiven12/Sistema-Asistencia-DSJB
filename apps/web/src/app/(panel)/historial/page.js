import AppShell from "@/components/AppShell";
import HistorialContent from "./HistorialContent";

export const metadata = {
  title: "Historial | Asistencia",
  description: "Asistencias creadas y anteriores de los grupos asignados.",
};

export default function HistorialPage() {
  return (
    <AppShell active="historial">
      <HistorialContent />
    </AppShell>
  );
}
