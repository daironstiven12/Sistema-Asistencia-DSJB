import AttendanceDetail from "@/components/AttendanceDetail";
import { attendances } from "@/data/asistencias";

export function generateStaticParams() {
  return attendances.map((item) => ({ id: item.id }));
}

/* Página de detalle mock: el contenido lee el estado del prototipo. */
export default async function AsistenciaDetailPage({ params }) {
  const { id } = await params;
  return <AttendanceDetail id={id} />;
}
