import AdminShell from "./AdminShell";

export const metadata = {
  title: "Administración",
  description: "Panel administrativo de la plataforma de asistencia.",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
