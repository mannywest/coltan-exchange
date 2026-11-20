"use client";

import type { CSSProperties } from "react";
import type { Routes } from "@/lib/routes";
import { href } from "@/lib/routes";
import { GLOSSARY } from "@/lib/glossary";
import { GRADE_COLOUR, GRADE_LABEL } from "@/lib/ui";
import { CROSS_META, computeGrade, type Lot } from "@/lib/grade";
import { SamplePhoto } from "./HomeArt";
import { SAMPLES, sampleSrc } from "@/lib/samples";
import { useRole, useT, type Role } from "./I18n";

const ORDER = { A: 0, B: 1, C: 2, Blocked: 3 } as const;

export default function Home({ routes, lots }: { routes: Routes; lots: Lot[] }) {
  const t = useT();
  const { setRole } = useRole();

  const live = lots
    .map((lot) => ({ lot, grade: computeGrade(lot).grade }))
    .filter((r) => r.lot.review.status === "approved" && r.grade !== "Blocked");
  const featured = [...live].sort((a, b) => ORDER[a.grade] - ORDER[b.grade]).slice(0, 4);

  const problems = [
    ["Origin is hard to prove", "Paperwork and tags can be faked, so buyers cannot tell where a lot really came from."],
    ["Assays are disputed", "Buyer and seller labs often disagree, and there is no neutral way to settle it."],
    ["Payment needs trust", "Money moves before the goods are tested, so one side always carries the risk."],
  ];
  const stages = [
    ["Reserve", "Pick an approved lot and hold it. Nothing is paid."],
    ["Sign terms", "Quantity, grade basis, delivery and price are locked."],
    ["Provisional payment", "80% goes into escrow. A named person approves the release."],
    ["Assay on arrival", "A lab tests the ore. A neutral umpire lab settles disputes."],
    ["Final payment", "The balance is settled on the tested grade."],
    ["Evidence pack", "A record your bank or auditor can check on its own."],
  ];
  const refuse = [
    "No clients in sanctioned countries.",
    "AI never approves a lot, releases money or changes a mine tier.",
    "The platform never trades for itself or holds client money.",
    "No lot is called guaranteed clean. Evidence makes false origin harder, and suspicious lots are flagged.",
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
  const faqs = [
    ["Is this a real exchange?", "No. This is a demo with invented lots, names and prices. It shows how the real product would work."],
    ["Does a Grade A mean the ore is conflict-free?", "No. A grade shows how strong the evidence is. It makes false origin harder and flags suspicious lots, but it does not guarantee origin."],
    ["Who decides if a lot is listed?", "A named reviewer. The rules set the limits and AI only drafts a summary."],
    ["Who holds the money?", "A regulated escrow partner, not the platform. A named person approves every release."],
  ];

  return (
    <div className="home">
      <header className="home-hero">
        <div className="home-hero-copy">
          <h1>{t("A neutral exchange for tantalum ore, where every lot comes with its evidence")}</h1>
          <p>
            {t("Buyers and sellers trade lots that have been tested, tracked and checked for signs of false origin. Rules set the grade. People approve. AI never decides.")}
          </p>
          <div className="home-cta">
            <a className="btn" href={routes.lots}>
              {t("Browse the lots")}
            </a>
            <a className="btn btn-quiet" href={routes.onboarding}>
              {t("Get cleared")}
            </a>
          </div>
          <dl className="home-stats">
            <div>
              <dt>{live.length}</dt>
              <dd>{t("lots on the exchange")}</dd>
            </div>
            <div>
              <dt>{CROSS_META.length}</dt>
              <dd>{t("origin checks on every lot")}</dd>
            </div>
            <div>
              <dt>0</dt>
              <dd>{t("approvals made by AI")}</dd>
            </div>
          </dl>
        </div>
        <figure className="hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sampleSrc("manganotantalite")} alt={SAMPLES.manganotantalite.alt} />
          <div className="hero-cert" aria-hidden="true">
            <small>{t("Certificate of evidence")}</small>
            <b>A</b>
          </div>
          <figcaption>{t("Illustrative sample, not a real lot.")}</figcaption>
        </figure>
      </header>

      <section aria-labelledby="h-feat">
        <h2 id="h-feat">{t("Lots on the exchange")}</h2>
        <ul className="feat">
          {featured.map(({ lot, grade }) => (
            <li key={lot.slug} style={{ "--grade": GRADE_COLOUR[grade] } as CSSProperties}>
              <a href={href(routes.lot, lot.slug)}>
                <SamplePhoto grade={grade} seed={Number(lot.number) || 1} />
                <span className="feat-body">
                  <span className="feat-grade">
                    <b>{grade}</b> {t(GRADE_LABEL[grade])}
                  </span>
                  <strong>
                    {t("Lot")} {lot.number}
                  </strong>
                  <span>{t("{n} tonnes, {b}% Ta2O5 basis", { n: lot.tonnes, b: lot.basisTa2O5 })}</span>
                  <span className="feat-price">
                    USD {lot.priceUsdPerLb} <small>{t("per lb")}</small>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="credits">
          {t("Illustrative sample photos, not real lots.")} {SAMPLES.tantalite.credit} {SAMPLES.manganotantalite.credit}
        </p>
        <p className="home-more">
          <a href={routes.lots}>{t("See all lots")}</a>
        </p>
      </section>

      <section aria-labelledby="h-prob">
        <h2 id="h-prob">{t("The problem this fixes")}</h2>
        <ul className="problems">
          {problems.map(([h, p]) => (
            <li key={h}>
              <h3>{t(h)}</h3>
              <p>{t(p)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-how">
        <h2 id="h-how">{t("How a trade works")}</h2>
        <ol className="how">
          {stages.map(([h, p]) => (
            <li key={h}>
              <h3>{t(h)}</h3>
              <p>{t(p)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="h-grades">
        <h2 id="h-grades">{t("What the Trust Grade means")}</h2>
        <p className="home-note">{t("The grade says how strong the evidence is. It does not guarantee origin.")}</p>
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

      <section aria-labelledby="h-checks">
        <h2 id="h-checks">{t("Seven checks look for false origin")}</h2>
        <p className="home-note">{t("None proves origin alone. Together they make it harder to fake.")}</p>
        <ul className="checks7">
          {CROSS_META.map((m) => (
            <li key={m.id}>
              <h3>{t(m.label)}</h3>
              <p>{t(m.what)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-refuse">
        <h2 id="h-refuse">{t("What this platform will not do")}</h2>
        <ul className="refuse">
          {refuse.map((r) => (
            <li key={r}>{t(r)}</li>
          ))}
        </ul>
      </section>

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

      <section aria-labelledby="h-faq">
        <h2 id="h-faq">{t("Common questions")}</h2>
        <div className="faq">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{t(q)}</summary>
              <p>{t(a)}</p>
            </details>
          ))}
        </div>
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
