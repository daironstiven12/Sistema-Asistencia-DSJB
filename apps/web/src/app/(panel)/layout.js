import { AttendanceProvider } from "@/prototype/AttendanceContext";
import { StudentProvider } from "@/prototype/StudentContext";

/* Grupo de rutas del panel: provee el estado del prototipo a todas
   las pantallas. Ambos roles comparten el mismo estado mock. */
export default function PanelLayout({ children }) {
  return (
    <AttendanceProvider>
      <StudentProvider>{children}</StudentProvider>
    </AttendanceProvider>
  );
}
