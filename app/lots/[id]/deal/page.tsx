import { notFound } from "next/navigation";
import { lots, getLot } from "@/data/lots";
import DealTracker from "@/components/DealTracker";
import { nextRoutes } from "@/lib/routes";

export function generateStaticParams() {
  return lots.map((l) => ({ id: l.slug }));
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = getLot(id);
  if (!lot) notFound();
  return <DealTracker lot={lot} routes={nextRoutes} />;
}
