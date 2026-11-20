import { notFound } from "next/navigation";
import { lots, getLot } from "@/data/lots";
import LotView from "@/components/LotView";

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
  return <LotView lot={lot} />;
}
