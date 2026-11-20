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

const GRADE_COLOUR = {
  A: "var(--verified)",
  B: "var(--amber)",
  C: "var(--copper)",
  Blocked: "var(--blocked)",
} as const;

// Darker versions of the grade colours that pass contrast on the paper sheet.
const GRADE_INK = {
  A: "#006b5a",
  B: "#7a5a0a",
  C: "#b04a1e",
  Blocked: "#b3262b",
} as const;

const TIERS: Tier[] = ["Blocked", "Unverified", "Watch", "Verified"];

function Mark({ status }: { status: Status }) {
  return (
    <svg
      className={`mark mark-${status}`}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <circle className="mark-ring" cx="10" cy="10" r="8.5" />
      {status === "verified" && <path className="tick" d="M5.8 10.4l2.9 2.9 5.5-6" />}
      {status === "partial" && <path className="half" d="M10 1.5a8.5 8.5 0 0 1 0 17z" />}
      {status === "failed" && <path className="cross" d="M6.5 6.5l7 7M13.5 6.5l-7 7" />}
    </svg>
  );
}

export default function LotView({
  lot,
  homeHref = "/",
}: {
  lot: Lot;
  homeHref?: string;
}) {
  const g = computeGrade(lot);
  const colour = GRADE_COLOUR[g.grade];
  const blocked = g.grade === "Blocked";
  const estimate = fieldEstimate(lot);
  const spread = assaySpread(lot);

  const blockedReason = blocked
    ? "This lot cannot be reserved. It failed a hard compliance rule."
    : lot.review.status !== "approved"
      ? "This lot is waiting for a reviewer's approval."
      : undefined;

  return (
    <div className="lot" style={{ "--grade": colour } as CSSProperties}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href={homeHref}>All lots</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Lot {lot.number}</span>
      </nav>

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
            <p className="lot-id">Lot {lot.number}</p>
            <h1>
              {lot.tonnes} tonnes of tantalum ore, {lot.basisTa2O5}% Ta2O5 basis
            </h1>
            <p className="reason">
              <strong>{blocked ? "Blocked." : `Trust Grade ${g.grade}.`}</strong>{" "}
              {g.reasons[0]}
            </p>
            <details className="rules">
              <summary>How the grade is decided</summary>
              {/* COMPLIANCE: grade rules are fixed and published. People, not AI, approve lots. */}
              <ul>
                <li>Blocked: the mine is Blocked, or a party failed sanctions screening.</li>
                <li>A: all six checks verified and the mine tier is Verified.</li>
                <li>B: four or five checks verified and none failed.</li>
                <li>C: anything else.</li>
              </ul>
              <p>
                A rules engine sets the grade from the evidence. AI can summarise and flag, but it
                never sets a grade, approves a lot or changes a mine tier.
              </p>
            </details>
          </div>
        </header>

        {/* Locked terms and reserve */}
        <aside className="rail" aria-label="Locked terms">
          <h2>Locked terms</h2>
          <dl className="terms">
            <div>
              <dt>Quantity</dt>
              <dd>{lot.tonnes} tonnes</dd>
            </div>
            <div>
              <dt>Grade basis</dt>
              <dd>{lot.basisTa2O5}% Ta2O5</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{lot.incoterm}</dd>
            </div>
            <div className="terms-price">
              <dt>Price</dt>
              <dd>
                USD {lot.priceUsdPerLb}
                <span> per lb Ta2O5</span>
              </dd>
            </div>
            <div>
              <dt>Seller</dt>
              <dd>
                {lot.sellerAlias}
                <span> Name shown once both sides are cleared</span>
              </dd>
            </div>
          </dl>
          <ReservePanel
            lotNumber={lot.number}
            holdHours={lot.holdHours}
            blockedReason={blockedReason}
          />
          <div className="review">
            <p>
              <strong>
                {lot.review.status === "approved"
                  ? "Approved"
                  : lot.review.status === "rejected"
                    ? "Rejected"
                    : "Waiting for approval"}
              </strong>{" "}
              by {lot.review.by}, {fmtDate(lot.review.at)}
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
              <h2 className="sheet-title">Certificate of evidence</h2>
              <p>
                Lot {lot.number}. Reference CE-{lot.number} (demo). Issued {fmtDate(lot.review.at)}.
              </p>
            </div>
            <div className="stamp" aria-hidden="true">
              <span className="stamp-main">
                {blocked ? "Blocked" : `Trust Grade ${g.grade}`}
              </span>
              <span>
                {lot.review.status === "approved"
                  ? "Approved"
                  : lot.review.status === "rejected"
                    ? "Rejected"
                    : "Pending"}{" "}
                {fmtDate(lot.review.at)}
              </span>
            </div>
          </header>
          {/* Evidence ledger */}
          <section className="block" aria-labelledby="h-evidence">
            <div className="block-head">
              <h2 id="h-evidence">What backs this grade</h2>
              <p>{g.verified} of 6 checks verified</p>
            </div>
            <ul className="ledger">
              {CHECK_ORDER.map((k, i) => {
                const e = lot.evidence[k];
                return (
                  <li key={k} style={{ "--i": i } as CSSProperties}>
                    <Mark status={e.status} />
                    <div className="l-main">
                      <h3>{CHECK_LABELS[k]}</h3>
                      <p>{e.detail}</p>
                    </div>
                    <p className="l-meta">
                      <span className={`word word-${e.status}`}>{STATUS_WORD[e.status]}</span>
                      <span>{e.source}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Assay */}
          <section className="block" aria-labelledby="h-assay">
            <div className="block-head">
              <h2 id="h-assay">Assay</h2>
              <p>Ta2O5 content, percent</p>
            </div>
            <table className="assay">
              <caption className="sr-only">
                Ta2O5 results by source for lot {lot.number}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col" className="num">Result</th>
                  <th scope="col">What it is</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Field handheld</th>
                  <td className="num">{estimate.toFixed(1)}</td>
                  <td>
                    Estimate: Ta reading {lot.assay.fieldTa.toFixed(1)}% x {lot.assay.factor}. A
                    handheld cannot give a true Ta2O5 figure.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Seller&apos;s lab</th>
                  <td className="num">
                    {lot.assay.sellerLab !== null ? lot.assay.sellerLab.toFixed(1) : "None"}
                  </td>
                  <td>
                    {lot.assay.sellerLab !== null
                      ? "Lab result on the seller's third of the sample."
                      : "No lab result on file."}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Independent lab</th>
                  <td className="num">
                    {lot.assay.independentLab !== null
                      ? lot.assay.independentLab.toFixed(1)
                      : "Due"}
                  </td>
                  <td>
                    {lot.assay.independentLab !== null
                      ? "Neutral lab, sealed sample from the inspector's split."
                      : "Not received yet."}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Umpire lab</th>
                  <td className="num">Sealed</td>
                  <td>Held back. Opened only if the buyer&apos;s result and the others disagree.</td>
                </tr>
              </tbody>
            </table>
            <p className="assay-note">
              {spread !== null
                ? `Gap between the two lab results: ${spread.toFixed(1)} points. ${lot.assay.toleranceCheck}`
                : lot.assay.toleranceCheck}{" "}
              Demo rule: if results sit within 0.5 points, the average is used; if not, the umpire
              lab decides.
            </p>
          </section>

          {/* Custody */}
          <section className="block" aria-labelledby="h-custody">
            <div className="block-head">
              <h2 id="h-custody">Custody log</h2>
              <p>{lot.custody.length} handovers recorded</p>
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
                        <strong>Flag.</strong> {c.flag}
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
              <h2 id="h-mine">Mine and counterparties</h2>
              <p>Screened {fmtDate(lot.lastScreened)}</p>
            </div>
            <div className="duo">
              <div>
                <h3 className="sub">{lot.mine.name}</h3>
                {/* COMPLIANCE: buyers see the tier and an evidence summary, never coordinates. */}
                <ol className="tiers" aria-label="Mine risk tier">
                  {TIERS.map((t) => (
                    <li
                      key={t}
                      className={`tier tier-${t.toLowerCase()}${t === lot.mine.tier ? " is-current" : ""}`}
                      aria-current={t === lot.mine.tier ? "true" : undefined}
                    >
                      {t}
                    </li>
                  ))}
                </ol>
                <p className="tier-note">{TIER_NOTES[lot.mine.tier]}</p>
                <p className="withheld">
                  Exact location and route stay hidden. They can put miners and field staff at risk.
                </p>
              </div>
              <div>
                <h3 className="sub">Screening</h3>
                {/* COMPLIANCE: sanctions and adverse-media screening of every party. */}
                <ul className="screens">
                  {lot.screening.map((s) => (
                    <li key={s.party}>
                      <Mark status={s.status} />
                      <div>
                        <p className="s-party">{s.party}</p>
                        <p className="s-note">
                          <span className={`word word-${s.status}`}>{STATUS_WORD[s.status]}.</span>{" "}
                          {s.note}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Honest limits */}
          <section className="limits" aria-labelledby="h-limits">
            <h2 id="h-limits">What this grade does not mean</h2>
            {/* COMPLIANCE: never claim origin is guaranteed. State the limits plainly. */}
            <p>
              A good grade means the evidence is independent, consistent, and nothing suspicious
              was flagged. It makes origin claims harder to fake. It does not guarantee origin: a
              determined actor who falsifies the site, photos and paperwork together may not be
              caught, and a mixed lot can look clean.
            </p>
          </section>
         </article>
        </div>
      </div>
    </div>
  );
}
