import { Lock } from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import StudentShell from "@/components/StudentShell";
import { studentProfile } from "@/prototype/StudentContext";
import styles from "./page.module.css";

export const metadata = {
  title: "Mi perfil | Estudiante",
  description: "Datos básicos del estudiante.",
};

const rows = [
  ["Nombre completo", studentProfile.name],
  ["Número de identificación", studentProfile.idNumber],
  ["Correo institucional", studentProfile.email],
  ["Programa", studentProfile.program],
  ["Nivel", studentProfile.level],
  ["Grupo", studentProfile.group],
  ["Período académico", studentProfile.period],
];

/* Perfil de solo lectura: el grupo y el período los administra el sistema. */
export default function PerfilPage() {
  return (
    <StudentShell active="perfil">
      <div className={styles.content}>
        <StudentHeader
          title="Mi perfil"
          subtitle="Información básica de tu cuenta."
        />

        <dl className={styles.card}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles.row}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <p className={styles.locked}>
          <Lock aria-hidden="true" />
          El grupo, el programa y el período los administra el sistema. No
          puedes modificarlos desde aquí.
        </p>
      </div>
    </StudentShell>
  );
}
