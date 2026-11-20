"use client";

import type { ReactNode } from "react";
import { useRole, useT, type Role } from "./I18n";

// Staff and seller screens ask for the matching demo view.
// COMPLIANCE: in the real product this is login and permissions, not a switch.
export default function RoleGate({ need, children }: { need: Role; children: ReactNode }) {
  const t = useT();
  const { role, setRole } = useRole();
  if (role === need) return <>{children}</>;
  return (
    <section className="gate">
      <h1>{need === "reviewer" ? t("This screen is for reviewers") : t("This screen is for sellers")}</h1>
      <p>
        {need === "reviewer"
          ? t("Buyers and sellers do not see the reviewer desk or the mine registry. In the real product, login decides this.")
          : t("Only cleared sellers can list a lot. In the real product, login decides this.")}
      </p>
      <button type="button" className="btn" onClick={() => setRole(need)}>
        {need === "reviewer" ? t("View as a reviewer (demo)") : t("View as a seller (demo)")}
      </button>
    </section>
  );
}
