import { Suspense } from "react";
import StudentShell from "@/components/StudentShell";
import RegistrarContent from "./RegistrarContent";

export const metadata = {
  title: "Registrar asistencia | Estudiante",
  description: "Registra tu asistencia con QR o código manual.",
};

export default function RegistrarPage() {
  return (
    <StudentShell active="registrar">
      <Suspense>
        <RegistrarContent />
      </Suspense>
    </StudentShell>
  );
}
