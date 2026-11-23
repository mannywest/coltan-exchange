"use client";

import { useEffect, useRef, useState } from "react";
import type { Routes } from "@/lib/routes";
import { href } from "@/lib/routes";
import { useRole, useT, type Role } from "./I18n";

// First-visit chooser: who do you want to be? Each choice sets the demo view and opens the right first screen.
// COMPLIANCE: the choice is a demo viewpoint, not a login. In the real product, who you are comes from sign-in and screening.
export default function Welcome({ routes }: { routes: Routes }) {
  const t = useT();
  const { setRole } = useRole();
  const [show, setShow] = useState(false);
  const first = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    let seen = "1";
    try {
      seen = window.sessionStorage.getItem("cx-welcome") ?? "";
    } catch {}
    const h = window.location.hash;
    const p = window.location.pathname;
    const home = h === "#home" || (h === "" && (p === "/" || window.location.protocol === "file:" || p.endsWith("index.html")));
    // Reads the browser's session once after loading, so it cannot run during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(seen !== "1" && home);
  }, []);
  useEffect(() => {
    if (!show) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  function close() {
    try {
      window.sessionStorage.setItem("cx-welcome", "1");
    } catch {}
    setShow(false);
  }
  if (!show) return null;
  const pick: { role: Role; title: string; story: string; to: string }[] = [
    { role: "buyer", title: "I want to buy coltan", story: "Find a lot, check the evidence, reserve it, and follow the deal to the end.", to: href(routes.lot, "lot-0417") },
    { role: "seller", title: "I want to sell coltan", story: "List a lot from a field message, countersign deals and attach shipping documents.", to: routes.deals },
    { role: "reviewer", title: "I work in the back office", story: "Check evidence and sign the approvals that move money. Nothing releases without two named people.", to: routes.backoffice },
  ];
  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="wel-h">
      <div className="welcome-card">
        <h2 id="wel-h">{t("Welcome. Who do you want to be?")}</h2>
        <p>{t("This is a demo of a coltan exchange built for checks and named approvals. Pick a point of view. You can switch at any time, and a Next step bar will guide you.")}</p>
        <div className="welcome-roles">
          {pick.map((r, i) => (
            <a key={r.role} ref={i === 0 ? first : undefined} className="welcome-role" href={r.to} onClick={() => { setRole(r.role); close(); }}>
              <b>{t(r.title)}</b>
              <span>{t(r.story)}</span>
            </a>
          ))}
        </div>
        <button type="button" className="btn btn-quiet" onClick={close}>{t("Just let me look around")}</button>
      </div>
    </div>
  );
}
