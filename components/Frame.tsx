"use client";

import type { ReactNode } from "react";
import type { Routes } from "@/lib/routes";
import { LangSwitch, useLang, useT } from "./I18n";

export default function Frame({ routes, children }: { routes: Routes; children: ReactNode }) {
  const t = useT();
  const { lang } = useLang();
  return (
    <>
      <div className="demo-bar" role="note">
        {t("Demo data. Every lot, name, number and price on this site is invented.")}
      </div>
      <header className="top">
        <a className="wordmark" href={routes.lots}>
          Plerosis
        </a>
        <span className="product">{t("Coltan Exchange")}</span>
        <LangSwitch />
        <nav className="topnav" aria-label="Main">
          <a href={routes.lots}>{t("Lots")}</a>
          <a href={routes.sell}>{t("List a lot")}</a>
          <a href={routes.registry}>{t("Mine registry")}</a>
          <a href={routes.review}>{t("Reviewer desk")}</a>
          <a href={routes.onboarding}>{t("Get cleared")}</a>
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
