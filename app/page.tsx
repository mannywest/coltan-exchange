import Home from "@/components/Home";
import { lots } from "@/data/lots";
import { nextRoutes } from "@/lib/routes";

export default function HomePage() {
  return <Home routes={nextRoutes} lots={lots} />;
}
