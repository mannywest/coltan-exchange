import DemandBoard from "@/components/DemandBoard";
import { nextRoutes } from "@/lib/routes";

export default function DemandPage() {
  return <DemandBoard routes={nextRoutes} />;
}
