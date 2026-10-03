import DetalleSesion from "./DetalleSesion";

/* Detalle conectado a la API real. Sin generateStaticParams: los ids
   provienen del backend, no del mock. */
export default async function AsistenciaDetailPage({ params }) {
  const { id } = await params;
  return <DetalleSesion id={id} />;
}
