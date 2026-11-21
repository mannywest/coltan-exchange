"use client";

import type { Routes } from "@/lib/routes";
import { useState } from "react";
import type { Status } from "@/lib/grade";
import Mark from "./Mark";
import { useRole, useT } from "./I18n";
import Term from "./Term";

// DEMO RULES ONLY. Real screening runs against live UK, US, EU and UN lists through a regulated provider.
// COMPLIANCE: platform rule, no clients in sanctioned countries.
const COUNTRIES = [
  "United Kingdom",
  "China",
  "Hong Kong",
  "United Arab Emirates",
  "Democratic Republic of the Congo",
  "Rwanda",
  "Kazakhstan",
  "Cuba",
  "Iran",
  "North Korea",
  "Syria",
];
const SANCTIONED = ["Cuba", "Iran", "North Korea", "Syria"];
const ENHANCED = ["China", "Hong Kong", "United Arab Emirates", "Democratic Republic of the Congo", "Rwanda"];
const ROLES = ["Buyer", "Seller", "Transporter", "Exporter"];
const DOCS = ["Company registration", "Directors' ID", "Proof of address", "Source of funds"];

type Owner = { name: string; pct: string };
type Check = { label: string; status: Status; note: string };

export default function Onboarding({ routes }: { routes?: Routes }) {
  const t = useT();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("Buyer");
  const [country, setCountry] = useState("United Kingdom");
  const [owners, setOwners] = useState<Owner[]>([{ name: "", pct: "" }]);
  const [docs, setDocs] = useState<boolean[]>([false, false, false, false]);
  const [sent, setSent] = useState(false);
  const { setCleared } = useRole();

  const named = owners.filter((o) => o.name.trim());
  const total = owners.reduce((a, o) => a + (Number(o.pct) || 0), 0);
  const listed = [company, ...owners.map((o) => o.name)].some((n) => /designated/i.test(n));
  const docCount = docs.filter(Boolean).length;

  const checks: Check[] = [
    {
      label: t("Country"),
      status: SANCTIONED.includes(country) ? "failed" : ENHANCED.includes(country) ? "partial" : "verified",
      note: SANCTIONED.includes(country)
        ? t("Platform rule: no clients in sanctioned countries.")
        : ENHANCED.includes(country)
          ? t("Not sanctioned countrywide, but enhanced checks apply on this trade route.")
          : t("No country-level concern."),
    },
    {
      label: t("Sanctions and media screening"),
      status: !company.trim() ? "missing" : listed ? "failed" : "verified",
      note: listed ? t("A name matches a designated party (demo data).") : company.trim() ? t("No list or media matches (demo rules).") : t("Enter the company name."),
    },
    {
      label: t("Beneficial owners"),
      status: named.length === 0 ? "missing" : total === 100 ? "verified" : "partial",
      note: named.length === 0 ? t("Add at least one owner.") : total === 100 ? t("Ownership is fully disclosed.") : t("{p}% of ownership is not disclosed.", { p: 100 - total }),
    },
    {
      label: t("Documents"),
      status: docCount === 4 ? "verified" : docCount > 0 ? "partial" : "missing",
      note: t("{n} of 4 documents provided.", { n: docCount }),
    },
  ];

  const failed = checks.some((c) => c.status === "failed");
  const clear = checks.every((c) => c.status === "verified");
  const outcome = failed ? "cannot" : clear ? "cleared" : checks.some((c) => c.status === "missing") ? "incomplete" : "review";
  const WORD = {
    cannot: t("Cannot onboard"),
    cleared: t("Cleared"),
    incomplete: t("Incomplete"),
    review: t("Needs review"),
  } as const;
  const COLOUR = { cannot: "var(--blocked)", cleared: "var(--verified)", incomplete: "var(--faint)", review: "var(--amber)" } as const;

  function setOwner(i: number, patch: Partial<Owner>) {
    setOwners((o) => o.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  if (sent) {
    return (
      <section className="review-desk">
        <h1>{t("Get cleared")}</h1>
        <div className="case" role="status" style={{ marginTop: 32, maxWidth: 640 }}>
          <p className="reserved-title">{t("Submitted (demo)")}</p>
          <p style={{ marginTop: 8 }}>
            {t("A named reviewer confirms every result before {company} can reserve or list a lot. Nothing is saved in this demo.", { company: company || "—" })}
          </p>
          <div className="home-cta" style={{ marginTop: 16 }}>
            {routes && (
              <a className="btn" href={routes.lots} onClick={() => setCleared(true)}>
                {t("Demo: continue as cleared and browse lots")}
              </a>
            )}
            <button type="button" className="btn btn-quiet" onClick={() => setSent(false)}>
              {t("Edit details")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="lot">
      <div className="lot-grid">
        <header className="hero hero-plain">
          <div className="hero-copy">
            <h1>{t("Get cleared")}</h1>
            <p className="reason">
              {t("In the real product, every buyer, seller, transporter and exporter is screened and cleared by a named Compliance officer before they can sign terms. In this demo the screening is simulated and does not block you.")}
            </p>
            <p className="rules">
              {t("Try the name Demo Designated Holdings, or the country Iran, to see a hard block.")}
            </p>
          </div>
        </header>

        <form
          className="body"
          id="onboard-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (outcome !== "cannot" && company.trim()) setSent(true);
          }}
        >
          <section className="block" aria-labelledby="h-co">
            <div className="block-head">
              <h2 id="h-co">{t("Company")}</h2>
            </div>
            <div className="fields">
              <label className="field wide">
                <span>{t("Company name")}</span>
                <input value={company} onChange={(e) => setCompany(e.target.value)} />
              </label>
              <label className="field">
                <span>{t("Role on the exchange")}</span>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(r)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t("Country of registration")}</span>
                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="block" aria-labelledby="h-own">
            <div className="block-head">
              <h2 id="h-own"><Term k="Beneficial owner">{t("Beneficial owners")}</Term></h2>
              <p>{t("{p}% disclosed", { p: Math.min(total, 100) })}</p>
            </div>
            <div className="owners">
              {owners.map((o, i) => (
                <div className="owner-row" key={i}>
                  <label className="field">
                    <span>{t("Owner name")}</span>
                    <input value={o.name} onChange={(e) => setOwner(i, { name: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>{t("Share (%)")}</span>
                    <input inputMode="decimal" value={o.pct} onChange={(e) => setOwner(i, { pct: e.target.value })} />
                  </label>
                  {owners.length > 1 && (
                    <button type="button" className="btn btn-quiet" onClick={() => setOwners((x) => x.filter((_, j) => j !== i))}>
                      {t("Remove")}
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-quiet" style={{ width: "auto" }} onClick={() => setOwners((x) => [...x, { name: "", pct: "" }])}>
                {t("Add an owner")}
              </button>
            </div>
          </section>

          <section className="block" aria-labelledby="h-docs">
            <div className="block-head">
              <h2 id="h-docs">{t("Documents")}</h2>
              <p>{t("{n} of 4 provided", { n: docCount })}</p>
            </div>
            <ul className="doclist">
              {DOCS.map((d, i) => (
                <li key={d}>
                  <label className="check-row">
                    <input type="checkbox" checked={docs[i]} onChange={(e) => setDocs((x) => x.map((v, j) => (j === i ? e.target.checked : v)))} />
                    <span>{t(d)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="reserve-note">{t("Demo: ticking a box stands in for uploading the document.")}</p>
          </section>
        </form>

        <aside className="rail" aria-label={t("Screening result")} style={{ "--grade": COLOUR[outcome] } as React.CSSProperties}>
          <h2>{t("Screening result")}</h2>
          <p className="outcome-word">{WORD[outcome]}</p>
          <ul className="pack">
            {checks.map((c) => (
              <li key={c.label}>
                <Mark status={c.status} />
                <span>
                  {c.label}
                  <small className="item-note">{c.note}</small>
                </span>
                <span />
              </li>
            ))}
          </ul>
          <div className="reserve">
            <button type="submit" form="onboard-form" className="btn" disabled={outcome === "cannot" || !company.trim()}>
              {t("Submit for review")}
            </button>
            <p className="reserve-note">
              {t("Rules set the result. A named reviewer confirms it. AI never clears or blocks anyone.")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
