import ActaContent from "./ActaContent";

export const metadata = {
  title: "Acta de asistencia | Asistencia",
  description: "Documento oficial de registro de asistencia a clases.",
};

/* Acta mock: el contenido lee el estado del prototipo. */
export default async function ActaPage({ params }) {
  const { id } = await params;
  return <ActaContent id={id} />;
}
