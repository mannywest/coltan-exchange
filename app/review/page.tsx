import ReviewDesk from "@/components/ReviewDesk";
import { lots } from "@/data/lots";
import { nextRoutes } from "@/lib/routes";

export default function ReviewPage() {
  return <ReviewDesk lots={lots} routes={nextRoutes} />;
}
