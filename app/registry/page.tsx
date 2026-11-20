import MineRegistry from "@/components/MineRegistry";
import { nextRoutes } from "@/lib/routes";

export default function RegistryPage() {
  return <MineRegistry routes={nextRoutes} />;
}
