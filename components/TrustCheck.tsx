import type { CSSProperties } from "react";
import {
  CROSS_META,
  CROSS_WORD,
  STATUS_WORD,
  computeGrade,
  crossSummary,
  evidencePack,
  type Lot,
} from "@/lib/grade";
import { GRADE_COLOUR, GRADE_INK } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import Mark from "./Mark";

export default function TrustCheck({ lot, routes }: { lot: Lot; routes: Routes }) {
  const g = computeGrade(lot);
  const c = crossSummary(lot);
  const pack = evidencePack(lot);
  const blocked = g.grade === "Blocked";

  const parts = [`${c.passed} of ${c.total} origin checks passed.`];
  if (c.look) parts.push(`${c.look} need a closer look.`);
  if (c.notRun) parts.push(`${c.notRun} not run.`);
  if (c.failed) parts.push(`${c.failed} failed.`);

  return (
    <div
      className="lot"
      style={{ "--grade": GRADE_COLOUR[g.grade], "--grade-ink": GRADE_INK[g.grade] } as CSSProperties}
    >
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href={routes.lots}>All lots</a>
        <span aria-hidden="true">/</span>
        <a href={href(routes.lot, lot.slug)}>Lot {lot.number}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Trust check</span>
      </nav>

      <div className="lot-grid">
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
            <h1>Trust check</h1>
            <p className="reason">
              <strong>{parts[0]}</strong> {parts.slice(1).join(" ")}
            </p>
            <p className="rules">
              Seven independent checks look for signs of false origin. None proves origin alone.
              Together they make it harder to fake.
            </p>
          </div>
        </header>

        <aside className="rail" aria-label="Evidence pack">
          <h2>Evidence pack</h2>
          <p className="pack-intro">What your bank or auditor would receive with this lot.</p>
          <ul className="pack">
            {pack.map((p) => (
              <li key={p.label}>
                <Mark status={p.status} />
                <span>{p.label}</span>
                <span className={`word word-${p.status}`}>
                  {p.status === "verified" ? "Included" : p.status === "partial" ? "Incomplete" : "Not available"}
                </span>
              </li>
            ))}
          </ul>
          <div className="reserve">
            <button type="button" className="btn" disabled>
              Export for your bank
            </button>
            <p className="reserve-note">
              Not connected in this demo. The real pack would be a signed file your bank can check
              on its own.
            </p>
          </div>
          <p className="back">
            <a href={href(routes.lot, lot.slug)}>Back to lot {lot.number}</a>
          </p>
        </aside>

        <div className="body">
          <article
            className="sheet"
            aria-label={`Origin cross-check report for lot ${lot.number}`}
          >
            <header className="sheet-head">
              <div>
                <h2 className="sheet-title">Origin cross-check report</h2>
                <p>
                  Lot {lot.number}. Reference XC-{lot.number} (demo). Run by the platform rules
                  engine, not by AI.
                </p>
              </div>
              <div className="stamp" aria-hidden="true">
                <span className="stamp-main">
                  {c.passed} of {c.total} passed
                </span>
                <span>{blocked ? "Blocked" : `Grade ${g.grade}`}</span>
              </div>
            </header>

            <section className="block" aria-labelledby="h-cross">
              <div className="block-head">
                <h2 id="h-cross">The seven checks</h2>
                <p>{STATUS_WORD.verified} means passed</p>
              </div>
              {/* COMPLIANCE: origin checks flag risk. They never prove origin. */}
              <ul className="ledger">
                {CROSS_META.map((m, i) => {
                  const [status, finding] = lot.cross[i];
                  return (
                    <li key={m.id} style={{ "--i": i } as CSSProperties}>
                      <Mark status={status} />
                      <div className="l-main">
                        <h3>{m.label}</h3>
                        <p className="finding">{finding}</p>
                        <p className="what">{m.what}</p>
                      </div>
                      <p className="l-meta">
                        <span className={`word word-${status}`}>{CROSS_WORD[status]}</span>
                        <span>Platform rules engine</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="limits" aria-labelledby="h-limits-check">
              <h2 id="h-limits-check">What these checks cannot do</h2>
              <p>
                A determined actor who falsifies the pin, photos and paperwork together, especially
                where an armed group controls a mine, may pass every check. A mixed lot can also look
                clean. Passed checks lower the risk. They do not guarantee origin.
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
