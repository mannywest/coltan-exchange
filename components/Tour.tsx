"use client";

import { useEffect, useState } from "react";
import type { Routes } from "@/lib/routes";
import { resetAll, useStore } from "@/lib/dealStore";
import { resetDemand } from "@/lib/demand";
import { dealStage } from "@/lib/approvals";
import { useRole, useT } from "./I18n";

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

// The step checklist for the demo. The "Next step" bar (DemoGuide) says what to do next. This only shows progress.
// It never approves, signs or releases anything.
export default function Tour({ routes }: { routes: Routes }) {
  const t = useT();
  const s = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.sessionStorage.getItem("cx-tour");
    } catch {}
    // Starts as a small button on every screen. The Next step bar does the guiding.
    setOpen(saved === "open");
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
      <p className="tour-tell">{t("The Next step bar at the top tells you who acts next and takes you there.")}</p>
      <RestartButton routes={routes} className="restart restart-quiet" />
    </aside>
  );
}
