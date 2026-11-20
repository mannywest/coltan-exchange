import RoleGate from "@/components/RoleGate";
import MineRegistry from "@/components/MineRegistry";
import { nextRoutes } from "@/lib/routes";

export default function RegistryPage() {
  return (
    <RoleGate need="reviewer">
      <MineRegistry routes={nextRoutes} />
    </RoleGate>
  );
}
