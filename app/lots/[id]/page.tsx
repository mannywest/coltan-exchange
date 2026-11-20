import { notFound } from "next/navigation";
import { lots, getLot } from "@/data/lots";
import LotView from "@/components/LotView";
import { nextRoutes } from "@/lib/routes";

export function generateStaticParams() {
  return lots.map((l) => ({ id: l.slug }));
}

export default async function LotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = getLot(id);
  if (!lot) notFound();
  return <LotView lot={lot} routes={nextRoutes} />;
}
