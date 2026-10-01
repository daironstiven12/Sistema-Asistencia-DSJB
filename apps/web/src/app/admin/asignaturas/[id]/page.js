import AsignaturaDetail from "./AsignaturaDetail";

export function generateStaticParams() {
  return [
    { id: "asg-001" },
    { id: "asg-002" },
    { id: "asg-003" },
    { id: "asg-004" },
    { id: "asg-005" },
    { id: "asg-006" },
    { id: "asg-007" },
  ];
}

export const metadata = { title: "Asignatura" };

export default async function AsignaturaDetailPage({ params }) {
  const { id } = await params;
  return <AsignaturaDetail id={id} />;
}
