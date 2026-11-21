import Deals from "@/components/Deals";
import { lots } from "@/data/lots";
import { nextRoutes } from "@/lib/routes";

export default function DealsPage() {
  return <Deals lots={lots} routes={nextRoutes} />;
}
