import { Suspense } from "react";
import RegistrarContent from "./RegistrarContent";

export const metadata = {
  title: "Registrar asistencia | Estudiante",
  description: "Registra tu asistencia con QR o código manual.",
};

export default function RegistrarPage() {
  return (
    <Suspense>
      <RegistrarContent />
    </Suspense>
  );
}
