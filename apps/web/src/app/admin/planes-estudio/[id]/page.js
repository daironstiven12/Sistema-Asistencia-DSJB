import PlanDetail from "./PlanDetail";

export function generateStaticParams() {
  return [{ id: "pla-001" }, { id: "pla-002" }];
}

export const metadata = { title: "Plan de estudio" };

export default async function PlanDetailPage({ params }) {
  const { id } = await params;
  return <PlanDetail id={id} />;
}
