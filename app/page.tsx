import Home from "@/components/Home";
import { nextRoutes } from "@/lib/routes";

export default function HomePage() {
  return <Home routes={nextRoutes} />;
}
