import RoleGate from "@/components/RoleGate";
import BackOffice from "@/components/BackOffice";
import { lots } from "@/data/lots";
import { nextRoutes } from "@/lib/routes";

export default function BackOfficePage() {
  return (
    <RoleGate need="reviewer">
      <BackOffice lots={lots} routes={nextRoutes} />
    </RoleGate>
  );
}
