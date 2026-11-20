"use client";

import { AssayStrip, AssayLegend, AssayVerdict } from "./HomeArt";
import type { CSSProperties } from "react";
import {
  CHECK_LABELS,
  CHECK_ORDER,
  STATUS_WORD,
  TIER_NOTES,
  assaySpread,
  computeGrade,
  fieldEstimate,
  type Lot,
  type Status,
  type Tier,
} from "@/lib/grade";
import { fmtDate, fmtDateTime } from "@/lib/format";
import ReservePanel from "./ReservePanel";
import LotGuide from "./LotGuide";
import { MIN_TONNES, lotValue } from "@/lib/price";
import { demoHash, short } from "@/lib/chain";
import Mark from "./Mark";
import { useT } from "./I18n";
import PhotoEvidence from "./PhotoEvidence";
import { GRADE_COLOUR, GRADE_INK, GRADE_LABEL } from "@/lib/ui";
import Term from "./Term";
import { href, type Routes } from "@/lib/routes";

const TIERS: Tier[] = ["Blocked", "Unverified", "Watch", "Verified"];

export default function LotView({
  lot,
  routes,
}: {
  lot: Lot;
  routes: Routes; }) {
  const t = useT();
  // Value = tonnes x lb per tonne x Ta2O5 share x price per lb. An estimate on the grade basis until the lab confirms.
  const total = lotValue(lot.tonnes, lot.basisTa2O5, lot.priceUsdPerLb);
  const perTonne = total / lot.tonnes;
  const g = computeGrade(lot);
  const colour = GRADE_COLOUR[g.grade];
  const blocked = g.grade === "Blocked";
  const estimate = fieldEstimate(lot);
  const spread = assaySpread(lot);

  const blockedReason = blocked
    ? t("This lot cannot be reserved. It failed a hard compliance rule.")
    : lot.review.status !== "approved"
      ? t("This lot is waiting for a reviewer's approval.")
      : undefined;

  return (
    <div className="lot" style={{ "--grade": colour } as CSSProperties}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href={routes.lots}>{t("All lots")}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("Lot")} {lot.number}</span>
      </nav>

      <div className="glance" role="region" aria-label={t("At a glance")}>
        <span>
          <strong>USD {lot.priceUsdPerLb}</strong> {t("per lb Ta2O5")}
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => document.getElementById("reserve-panel")?.scrollIntoView({ behavior: "smooth" })}
        >
          {blockedReason ? t("See terms") : t("Reserve this lot")}
        </button>
      </div>

      <div className="lot-grid">
        {/* Grade and headline facts */}
        <header className="hero">
          <div
            className={`grade-letter${blocked ? " is-blocked" : ""}`}
            role="img"
            aria-label={blocked ? "Trust Grade: Blocked" : `Trust Grade ${g.grade}`}
          >
            {g.grade}
          </div>
          <div className="hero-copy">
            <p className="lot-id">{t("Lot")} {lot.number}</p>
            <h1>{t("{n} tonnes of tantalum ore, {b}% Ta2O5 basis", { n: lot.tonnes, b: lot.basisTa2O5 })}</h1>
            <p className="reason">
              <strong>{blocked ? t("Blocked.") : t("Trust Grade {g}.", { g: g.grade })}</strong>{" "}
              <em className="grade-words">{t(GRADE_LABEL[g.grade])}.</em>{" "}
              {t(g.reasonKey, { n: g.verified, list: g.open.map((k) => t(CHECK_LABELS[k]).toLowerCase()).join(", ") })}
            </p>
            <details className="rules">
              <summary>{t("How the grade is decided")}</summary>
              {/* COMPLIANCE: grade rules are fixed and published. People, not AI, approve lots. */}
              <ul>
                <li>{t("Blocked: the mine is Blocked, or a party failed sanctions screening.")}</li>
                <li>{t("A: all six checks verified and the mine tier is Verified.")}</li>
                <li>{t("B: four or five checks verified and none failed.")}</li>
                <li>{t("C: anything else.")}</li>
              </ul>
              <p>
                {t("A rules engine sets the grade from the evidence. AI can summarise and flag, but it never sets a grade, approves a lot or changes a mine tier.")}
              </p>
            </details>
          </div>
        </header>

        {/* Locked terms and reserve */}
        <aside className="rail" id="reserve-panel" aria-label="Locked terms">
          <h2>{t("Locked terms")}</h2>
          <dl className="terms">
            <div>
              <dt>{t("Quantity available")}</dt>
              <dd>{t("{n} tonnes", { n: lot.tonnes })}</dd>
            </div>
            <div>
              <dt><Term k="Grade basis">{t("Grade basis")}</Term></dt>
              <dd>{lot.basisTa2O5}% Ta2O5</dd>
            </div>
            <div>
              <dt>{t("Delivery")} (<Term k="CIF">CIF</Term>)</dt>
              <dd>{lot.incoterm}</dd>
            </div>
            <div className="terms-price">
              <dt>{t("Price")}</dt>
              <dd>
                USD {lot.priceUsdPerLb}
                <span> {t("per lb Ta2O5")}</span>
              </dd>
            </div>
            <div>
              <dt>{t("Estimated total")}</dt>
              <dd>USD {Math.round(total).toLocaleString("en-GB")}</dd>
            </div>
            <div>
              <dt>{t("Seller")}</dt>
              <dd>
                {lot.sellerAlias}
                <span> {t("Name shown once both sides are cleared")}</span>
              </dd>
            </div>
          </dl>
          <ReservePanel
            lotNumber={lot.number}
            holdHours={lot.holdHours}
            blockedReason={blockedReason}
            dealHref={href(routes.deal, lot.slug)}
            quantity={{ tonnes: lot.tonnes, min: Math.min(MIN_TONNES, lot.tonnes), perTonne }}
          />
          <div className="review">
            <p>
              <strong>
                {lot.review.status === "approved"
                  ? t("Approved")
                  : lot.review.status === "rejected"
                    ? t("Rejected")
                    : t("Waiting for approval")}
              </strong>{" "}
             {lot.review.status === "pending"
                ? t("(submitted {d})", { d: fmtDate(lot.review.at) })
                : ` ${t("by {who}, {d}", { who: lot.review.by, d: fmtDate(lot.review.at) })}`}
            </p>
            {lot.review.note && <p className="review-note">{lot.review.note}</p>}
          </div>
        </aside>

        <div className="body">
         <article
          className="sheet"
          aria-label={`Certificate of evidence for lot ${lot.number}`}
          style={{ "--grade-ink": GRADE_INK[g.grade] } as CSSProperties}
         >
          <header className="sheet-head">
            <div>
              <h2 className="sheet-title">{t("Certificate of evidence")}</h2>
              <p>
                {t("Lot {n}. Reference CE-{n} (demo). Issued {d}.", { n: lot.number, d: fmtDate(lot.review.at) })}
              </p>
            </div>
            <div className="stamp" aria-hidden="true">
              <span className="stamp-main">
                {blocked ? t("Blocked") : t("Trust Grade {g}", { g: g.grade })}
              </span>
              <span>
                {lot.review.status === "approved"
                  ? t("Approved")
                  : lot.review.status === "rejected"
                    ? t("Rejected")
                    : t("Pending")}{" "}
                {fmtDate(lot.review.at)}
              </span>
            </div>
          </header>
          {/* Evidence ledger */}
          <section className="block" aria-labelledby="h-evidence">
            <div className="block-head">
              <h2 id="h-evidence">{t("What backs this grade")}</h2>
              <p>{t("{n} of 6 checks verified", { n: g.verified })}</p>
            </div>
            <ul className="ledger">
              {CHECK_ORDER.map((k, i) => {
                const e = lot.evidence[k];
                return (
                  <li key={k} style={{ "--i": i } as CSSProperties}>
                    <Mark status={e.status} />
                    <div className="l-main">
                      <h3>{t(CHECK_LABELS[k])}</h3>
                      <p>{e.detail}</p>
                    </div>
                    <p className="l-meta">
                      <span className={`word word-${e.status}`}>{t(STATUS_WORD[e.status])}</span>
                      <span>{e.source}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="more">
              <a href={href(routes.check, lot.slug)}>{t("Open the full trust check")}</a>
            </p>
          </section>

          {/* Assay */}
          <section className="block" aria-labelledby="h-assay">
            <div className="block-head">
              <h2 id="h-assay"><Term k="Assay">{t("Assay")}</Term></h2>
              <p>{t("Ta2O5 content, percent")}</p>
            </div>
            <p className="assay-intro">
              {t("Three readings of the same lot. Higher means more valuable metal in the ore. The price is set at the selling grade.")}
            </p>
            <AssayStrip lot={lot} grade={g.grade} variant="full" />
            <AssayLegend lot={lot} />
            <p className="assay-verdict-line"><AssayVerdict lot={lot} /></p>
            <table className="assay">
              <caption className="sr-only">
                Ta2O5 results by source for lot {lot.number}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("Source")}</th>
                  <th scope="col" className="num">{t("Result")}</th>
                  <th scope="col">{t("What it is")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{t("Field handheld")}</th>
                  <td className="num">{estimate.toFixed(1)}</td>
                  <td>
                    {t("Estimate: Ta reading {ta}% x {f}. A handheld cannot give a true Ta2O5 figure.", { ta: lot.assay.fieldTa.toFixed(1), f: lot.assay.factor })}
                  </td>
                </tr>
                <tr>
                  <th scope="row">{t("Seller's lab")}</th>
                  <td className="num">
                    {lot.assay.sellerLab !== null ? lot.assay.sellerLab.toFixed(1) : t("None")}
                  </td>
                  <td>
                    {lot.assay.sellerLab !== null
                      ? t("Lab result on the seller's third of the sample.")
                      : t("No lab result on file.")}
                  </td>
                </tr>
                <tr>
                  <th scope="row">{t("Independent lab")}</th>
                  <td className="num">
                    {lot.assay.independentLab !== null
                      ? lot.assay.independentLab.toFixed(1)
                      : t("Due")}
                  </td>
                  <td>
                    {lot.assay.independentLab !== null
                      ? t("Neutral lab, sealed sample from the inspector's split.")
                      : t("Not received yet.")}
                  </td>
                </tr>
                <tr>
                  <th scope="row"><Term k="Umpire lab">{t("Umpire lab")}</Term></th>
                  <td className="num">{t("Sealed")}</td>
                  <td>{t("Held back. Opened only if the buyer's result and the others disagree.")}</td>
                </tr>
              </tbody>
            </table>
            <p className="assay-note">
              {spread !== null
                ? `${t("Gap between the two lab results: {g} points.", { g: spread.toFixed(1) })} ${lot.assay.toleranceCheck}`
                : lot.assay.toleranceCheck}{" "}
              {t("Demo rule: if results sit within 0.5 points, the average is used; if not, the umpire lab decides.")}
            </p>
            <p className="assay-note">
              {t("Certificate fingerprint (demo):")} <code>{short(demoHash(`cert-${lot.number}-${lot.assay.sellerLab}-${lot.assay.independentLab}`, 3))}</code>{" "}
              {t("In a live version this fingerprint would be recorded on a public ledger, so anyone can check the certificate has not been changed. It records no money and no names.")}
            </p>
          </section>

          <PhotoEvidence lot={lot} />

          {/* Custody */}
          <section className="block" aria-labelledby="h-custody">
            <div className="block-head">
              <h2 id="h-custody"><Term k="Custody log">{t("Custody log")}</Term></h2>
              <p>{t("{n} handovers recorded", { n: lot.custody.length })}</p>
            </div>
            <ol className="timeline">
              {lot.custody.map((c) => (
                <li key={c.at} className={c.flag ? "has-flag" : undefined}>
                  <time dateTime={c.at}>{fmtDateTime(c.at)}</time>
                  <div>
                    <h3>{c.action}</h3>
                    <p>
                      {c.place}, {c.by}
                    </p>
                    {c.flag && (
                      <p className="flag">
                        <strong>{t("Flag.")}</strong> {c.flag}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Mine and screening */}
          <section className="block" aria-labelledby="h-mine">
            <div className="block-head">
              <h2 id="h-mine">{t("Mine and counterparties")}</h2>
              <p>{t("Screened {d}", { d: fmtDate(lot.lastScreened) })}</p>
            </div>
            <div className="duo">
              <div>
                <h3 className="sub">{lot.mine.name}</h3>
                {/* COMPLIANCE: buyers see the tier and an evidence summary, never coordinates. */}
                <ol className="tiers" aria-label="Mine risk tier">
                  {TIERS.map((tr) => (
                    <li
                      key={tr}
                      className={`tier tier-${tr.toLowerCase()}${tr === lot.mine.tier ? " is-current" : ""}`}
                      aria-current={tr === lot.mine.tier ? "true" : undefined}
                    >
                      {t(tr)}
                    </li>
                  ))}
                </ol>
                <p className="tier-note">{TIER_NOTES[lot.mine.tier]}</p>
                <p className="withheld">
                  {t("Exact location and route stay hidden. They can put miners and field staff at risk.")}
                </p>
              </div>
              <div>
                <h3 className="sub">{t("Screening")}</h3>
                {/* COMPLIANCE: sanctions and adverse-media screening of every party. */}
                <ul className="screens">
                  {lot.screening.map((s) => (
                    <li key={s.party}>
                      <Mark status={s.status} />
                      <div>
                        <p className="s-party">{t(s.party)}</p>
                        <p className="s-note">
                          <span className={`word word-${s.status}`}>{t(STATUS_WORD[s.status])}.</span>{" "}
                          {s.note}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <LotGuide lot={lot} total={total} />

          {/* Honest limits */}
          <section className="limits" aria-labelledby="h-limits">
            <h2 id="h-limits">{t("What this grade does not mean")}</h2>
            {/* COMPLIANCE: never claim origin is guaranteed. State the limits plainly. */}
            <p>
              {t("A good grade means the evidence is independent, consistent, and nothing suspicious was flagged. It makes origin claims harder to fake. It does not guarantee origin: a determined actor who falsifies the site, photos and paperwork together may not be caught, and a mixed lot can look clean.")}
            </p>
          </section>
         </article>
        </div>
      </div>
    </div>
  );
}
