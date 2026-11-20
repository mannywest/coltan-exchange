import { redirect } from "next/navigation";

// The listing page comes next. Until the first screen is approved, go straight to a lot.
export default function Home() {
  redirect("/lots/lot-0417");
}
