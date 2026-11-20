import RoleGate from "@/components/RoleGate";
import ReviewDesk from "@/components/ReviewDesk";
import { lots } from "@/data/lots";
import { nextRoutes } from "@/lib/routes";

export default function ReviewPage() {
  return (
    <RoleGate need="reviewer">
      <ReviewDesk lots={lots} routes={nextRoutes} />
    </RoleGate>
  );
}
