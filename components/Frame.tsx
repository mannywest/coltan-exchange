"use client";

import type { ReactNode } from "react";
import type { Routes } from "@/lib/routes";
import { LangSwitch, ROLES, useLang, useRole, useT } from "./I18n";
import { pendingFor, useStore } from "@/lib/dealStore";
import Tour, { RestartButton } from "./Tour";
import Assistant from "./Assistant";

export default function Frame({ routes, children }: { routes: Routes; children: ReactNode }) {
  const t = useT();
  const { lang } = useLang();
  const { role, setRole } = useRole();
  const store = useStore();
  const waiting = pendingFor(store, store.who);
  const nav: [string, string][] =
    role === "reviewer"
      ? [[routes.backoffice, "Back office"], [routes.review, "Reviewer desk"], [routes.registry, "Mine registry"], [routes.lots, "Lots"], [routes.demand, "Demand board"]]
      : role === "seller"
        ? [[routes.lots, "Lots"], [routes.sell, "List a lot"], [routes.demand, "Demand board"], [routes.deals, "Deals"], [routes.onboarding, "Get cleared"]]
        : [[routes.lots, "Lots"], [routes.deals, "My deals"], [routes.demand, "Demand board"], [routes.onboarding, "Get cleared"]];
  return (
    <>
      <div className="demo-bar" role="note">
        <span>{t("Demo data. Every lot, name, number and price on this site is invented.")}</span>
        <RestartButton routes={routes} />
      </div>
      <header className="top">
        <a className="wordmark" href={routes.home}>
          Plerosis
        </a>
        <span className="product">{t("Coltan Exchange")}</span>
        <LangSwitch />
        <label className="role">
          <span>{t("Demo view")}</span>
          <select aria-label={t("Demo view: choose who you are")} value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {t(r.label)}
              </option>
            ))}
          </select>
        </label>
        <nav className="topnav" aria-label="Main">
          {[[routes.home, "Home"] as [string, string], ...nav].map(([h, l]) => (
            <a key={l} href={h}>
              {t(l)}
              {l === "Back office" && waiting > 0 && (
                <span className="nav-badge" aria-label={t("{n} waiting for you", { n: waiting })}>
                  {waiting}
                </span>
              )}
            </a>
          ))}
        </nav>
      </header>
      {lang !== "en" && (
        <p className="lang-note" role="note">
          {t(
            "The interface is translated. Lot evidence and case notes stay in English in this demo. The real product translates them with AI and keeps the original beside the translation."
          )}
        </p>
      )}
      <main className="page">{children}</main>
      <Tour routes={routes} />
      <Assistant routes={routes} />
      <footer className="foot">
        <p>{t("Prepared by Plerosis with AI assistance")}</p>
        <p>{t("Demo only. Not an offer to trade.")}</p>
      </footer>
    </>
  );
}
