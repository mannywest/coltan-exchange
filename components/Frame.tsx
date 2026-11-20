"use client";

import type { ReactNode } from "react";
import type { Routes } from "@/lib/routes";
import { LangSwitch, ROLES, useLang, useRole, useT } from "./I18n";

export default function Frame({ routes, children }: { routes: Routes; children: ReactNode }) {
  const t = useT();
  const { lang } = useLang();
  const { role, setRole } = useRole();
  const nav: [string, string][] =
    role === "reviewer"
      ? [[routes.review, "Reviewer desk"], [routes.registry, "Mine registry"], [routes.lots, "Lots"]]
      : role === "seller"
        ? [[routes.onboarding, "Get cleared"], [routes.sell, "List a lot"], [routes.lots, "Lots"]]
        : [[routes.onboarding, "Get cleared"], [routes.lots, "Lots"]];
  return (
    <>
      <div className="demo-bar" role="note">
        {t("Demo data. Every lot, name, number and price on this site is invented.")}
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
      <footer className="foot">
        <p>{t("Prepared by Plerosis with AI assistance")}</p>
        <p>{t("Demo only. Not an offer to trade.")}</p>
      </footer>
    </>
  );
}
