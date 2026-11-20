import RoleGate from "@/components/RoleGate";
import SellForm from "@/components/SellForm";
import { nextRoutes } from "@/lib/routes";

export default function SellPage() {
  return (
    <RoleGate need="seller">
      <SellForm routes={nextRoutes} />
    </RoleGate>
  );
}
