import { AttendanceProvider } from "@/prototype/AttendanceContext";

/* Grupo de rutas del panel: provee el estado del prototipo a todas
   las pantallas del representante. No altera las URLs. */
export default function PanelLayout({ children }) {
  return <AttendanceProvider>{children}</AttendanceProvider>;
}
