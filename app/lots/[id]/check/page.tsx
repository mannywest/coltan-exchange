import { notFound } from "next/navigation";
import { lots, getLot } from "@/data/lots";
import TrustCheck from "@/components/TrustCheck";
import { nextRoutes } from "@/lib/routes";

export function generateStaticParams() {
  return lots.map((l) => ({ id: l.slug }));
}

export default async function CheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = getLot(id);
  if (!lot) notFound();
  return <TrustCheck lot={lot} routes={nextRoutes} />;
}
