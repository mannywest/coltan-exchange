import LotListing from "@/components/LotListing";
import { lots } from "@/data/lots";
import { nextRoutes } from "@/lib/routes";

export default function Home() {
  return <LotListing lots={lots} routes={nextRoutes} />;
}
