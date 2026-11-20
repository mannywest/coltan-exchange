"use client";

import type { Routes } from "@/lib/routes";
import { GLOSSARY } from "@/lib/glossary";
import { GRADE_LABEL } from "@/lib/ui";
import { useRole, useT, type Role } from "./I18n";

export default function Home({ routes }: { routes: Routes }) {
  const t = useT();
  const { setRole } = useRole();
  const steps = [
    ["Get cleared", "Every buyer, seller, transporter and exporter is screened first. Sanctioned countries are refused."],
    ["See the evidence", "Each lot carries a Trust Grade built from tests, sealed custody and origin cross-checks."],
    ["Reserve and sign", "Terms are locked before anyone commits. A named reviewer approves each lot first."],
    ["Test, then pay", "A lab confirms the grade on arrival. A named person releases payment through escrow."],
  ];
  const roles: { id: Role; title: string; text: string; to: string; cta: string }[] = [
    { id: "buyer", title: "I want to buy", text: "Browse approved lots, read the evidence and reserve one.", to: routes.onboarding, cta: "Get cleared to buy" },
    { id: "seller", title: "I want to sell", text: "Record a lot the way the field team does and send it for review.", to: routes.onboarding, cta: "Get cleared to sell" },
    { id: "reviewer", title: "I review lots", text: "Decide the lots the rules cannot clear alone, and manage mine tiers.", to: routes.review, cta: "Open the reviewer desk" },
  ];
  const grades = ["A", "B", "C", "Blocked"] as const;
  const gradeNote: Record<(typeof grades)[number], string> = {
    A: "All six checks verified, and the mine is Verified.",
    B: "Four or five checks verified, none failed.",
    C: "Anything else. Look closely before you trade.",
    Blocked: "A hard rule failed, such as a sanctions match. It cannot be reserved.",
  };
  return (
    <div className="home">
      <header className="home-hero">
        <h1>{t("A neutral exchange for tantalum ore, where every lot comes with its evidence")}</h1>
        <p>
          {t("Buyers and sellers trade lots that have been tested, tracked and checked for signs of false origin. Rules set the grade. People approve. AI never decides.")}
        </p>
        <a className="btn" href={routes.lots}>
          {t("Browse the lots")}
        </a>
      </header>

      <section aria-labelledby="h-roles">
        <h2 id="h-roles">{t("Who are you?")}</h2>
        <div className="roles">
          {roles.map((r) => (
            <article key={r.id} className="role-card">
              <h3>{t(r.title)}</h3>
              <p>{t(r.text)}</p>
              <a className="btn btn-quiet" href={r.to} onClick={() => setRole(r.id)}>
                {t(r.cta)}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="h-how">
        <h2 id="h-how">{t("How it works")}</h2>
        <ol className="how">
          {steps.map(([h, p]) => (
            <li key={h}>
              <h3>{t(h)}</h3>
              <p>{t(p)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="h-grades">
        <h2 id="h-grades">{t("What the Trust Grade means")}</h2>
        <p className="home-note">
          {t("The grade says how strong the evidence is. It does not guarantee origin.")}
        </p>
        <ul className="grade-key">
          {grades.map((g) => (
            <li key={g} className={`gk gk-${g.toLowerCase()}`}>
              <span className="gk-letter">{g === "Blocked" ? t("Blocked") : g}</span>
              <span>
                <strong>{t(GRADE_LABEL[g])}</strong>
                <small>{t(gradeNote[g])}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-gloss">
        <h2 id="h-gloss">{t("Terms in plain words")}</h2>
        <dl className="gloss">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt>{t(g.term)}</dt>
              <dd>{t(g.meaning)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
