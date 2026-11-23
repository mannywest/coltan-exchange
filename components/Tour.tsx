"use client";

import { useEffect, useState } from "react";
import type { Routes } from "@/lib/routes";
import { href } from "@/lib/routes";
import { resetAll, useStore } from "@/lib/dealStore";
import { resetDemand } from "@/lib/demand";
import { dealStage } from "@/lib/approvals";
import { useRole, useT, type Role } from "./I18n";

const DEMO_LOT = "lot-0417";
const STEPS = ["Reserve a lot", "Sign the terms", "Pay into escrow", "Shipment and documents", "Assay on arrival", "Final payment", "Evidence pack"];

// A restart button with a second click to confirm, so nobody wipes a live demo by accident.
export function RestartButton({ routes, className }: { routes: Routes; className?: string }) {
  const t = useT();
  const { setRole } = useRole();
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const id = setTimeout(() => setSure(false), 4000);
    return () => clearTimeout(id);
  }, [sure]);
  return (
    <button
      type="button"
      className={className ?? "restart"}
      onClick={() => {
        if (!sure) return setSure(true);
        setSure(false);
        setRole("buyer");
        window.location.href = routes.home;
        // Wipe after leaving the deal page, so an open deal does not re-create itself.
        setTimeout(() => {
          resetAll();
          resetDemand();
        }, 60);
      }}
    >
      {sure ? t("Click again to wipe all demo deals") : t("Restart demo")}
    </button>
  );
}

// A guided path through the demo. It reads the deal state and says what to do next and who to be.
// It only points. It never approves, signs or releases anything.
export default function Tour({ routes }: { routes: Routes }) {
  const t = useT();
  const s = useStore();
  const { setRole } = useRole();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.sessionStorage.getItem("cx-tour");
    } catch {}
    // Open by default on a wide screen the first time; small screens start with the small button.
    setOpen(saved ? saved === "open" : window.innerWidth >= 1000);
    const onOpen = () => setOpen(true);
    window.addEventListener("cx-tour-open", onOpen);
    return () => window.removeEventListener("cx-tour-open", onOpen);
  }, []);
  useEffect(() => {
    try {
      window.sessionStorage.setItem("cx-tour", open ? "open" : "closed");
    } catch {}
  }, [open]);

  const deals = Object.values(s.deals).sort((a, b) => b.at - a.at);
  const d = deals[0];
  const st = d ? dealStage(d, s) : null;
  const current = d && st ? st.step - 1 : 0; // index of the step you are on (0 = reserve)

  let tell = t("Open lot 0417 and press Reserve this lot.");
  let go: { label: string; to: string; role: Role } = { label: t("Open lot 0417"), to: href(routes.lot, DEMO_LOT), role: "buyer" };
  if (d && st) {
    const dealHref = href(routes.deal, d.slug);
    if (st.waitingOn === "Buyer") {
      tell = t("You are the buyer. {d}", { d: st.detail });
      go = { label: t("Open the deal"), to: dealHref, role: "buyer" };
    } else if (st.waitingOn === "Seller") {
      tell = t("Now be the seller. {d}", { d: st.detail });
      go = { label: t("Switch to the seller"), to: routes.deals, role: "seller" };
    } else if (st.waitingOn === "Back office") {
      tell = t("Now be the back office. {d} Money releases need two different people, so sign, switch the person at the top, and sign again.", { d: st.detail });
      go = { label: t("Switch to the back office"), to: routes.backoffice, role: "reviewer" };
    } else if (st.tone === "ok") {
      tell = t("The deal is complete. Open it to see the evidence pack and receipt, or restart to run it again.");
      go = { label: t("Open the deal"), to: dealHref, role: "buyer" };
    } else {
      tell = t("This deal stopped: {d} Restart to try another route.", { d: st.detail });
      go = { label: t("Open the deal"), to: dealHref, role: "buyer" };
    }
  }

  if (!open)
    return (
      <button type="button" className="tour-pill" onClick={() => setOpen(true)} aria-expanded="false">
        {t("Guided demo")}
      </button>
    );

  return (
    <aside className="tour" aria-label={t("Guided demo")}>
      <div className="tour-head">
        <strong>{t("Guided demo")}</strong>
        <button type="button" className="tour-x" onClick={() => setOpen(false)} aria-label={t("Hide the guide")}>
          ×
        </button>
      </div>
      <ol className="tour-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < current || (st?.tone === "ok" && d) ? "is-done" : i === current ? "is-now" : ""}>
            {t(label)}
          </li>
        ))}
      </ol>
      <p className="tour-tell">{tell}</p>
      <a className="btn" href={go.to} onClick={() => setRole(go.role)}>
        {go.label}
      </a>
      <RestartButton routes={routes} className="restart restart-quiet" />
    </aside>
  );
}
