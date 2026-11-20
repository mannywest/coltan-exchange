import SellForm from "@/components/SellForm";
import { nextRoutes } from "@/lib/routes";

export default function SellPage() {
  return <SellForm routes={nextRoutes} />;
}
