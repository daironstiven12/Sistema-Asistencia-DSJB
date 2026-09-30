import AppShell from "@/components/AppShell";
import InicioContent from "./InicioContent";

export const metadata = {
  title: "Inicio | Asistencia",
  description: "Panel del representante: grupos, asistencias y acciones.",
};

export default function InicioPage() {
  return (
    <AppShell active="inicio">
      <InicioContent />
    </AppShell>
  );
}
