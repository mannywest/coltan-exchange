"use client";

import { useEffect, useState } from "react";
import type { Routes } from "@/lib/routes";
import { nextStep } from "@/lib/guide";
import { setWho, useStore } from "@/lib/dealStore";
import { useRole, useT } from "./I18n";

const here = () => (typeof window === "undefined" ? "" : window.location.hash || window.location.pathname);

// A "Next step" bar for the demo. It says whose turn it is and gives one button that switches the demo view and opens the right screen.
// COMPLIANCE: plain rules, not AI. It only moves the viewer. It never signs, approves or releases anything.
export default function DemoGuide({ routes }: { routes: Routes }) {
  const t = useT();
  const s = useStore();
  const { role, setRole } = useRole();
  const [at, setAt] = useState("");
  useEffect(() => {
    const on = () => setAt(here());
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  if (at === "" || at === "#onboarding") return null;
  const step = nextStep(s, role, routes);
  const arrived = at === step.go && role === step.role && (!step.who || s.who === step.who);
  return (
    <aside className={`guide guide-${step.tone}`} aria-label={t("Next step in the demo")}>
      <span className="guide-tag">{t("Next step")}</span>
      <p className="guide-text" role="status">{step.text}</p>
      {!arrived && (
        <a
          className="btn guide-go"
          href={step.go}
          onClick={() => {
            setRole(step.role);
            if (step.who) setWho(step.who);
          }}
        >
          {step.button} <span aria-hidden="true">→</span>
        </a>
      )}
    </aside>
  );
}
