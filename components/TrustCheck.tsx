"use client";

import type { CSSProperties } from "react";
import {
  CROSS_META,
  CROSS_WORD,
  computeGrade,
  crossSummary,
  evidencePack,
  type Lot,
} from "@/lib/grade";
import { GRADE_COLOUR, GRADE_INK } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import Mark from "./Mark";
import { useT } from "./I18n";

export default function TrustCheck({ lot, routes }: { lot: Lot; routes: Routes }) {
  const t = useT();
  const g = computeGrade(lot);
  const c = crossSummary(lot);
  const pack = evidencePack(lot);
  const blocked = g.grade === "Blocked";

  const parts = [t("{n} of {m} origin checks passed.", { n: c.passed, m: c.total })];
  if (c.look) parts.push(t("{n} need a closer look.", { n: c.look }));
  if (c.notRun) parts.push(t("{n} not run.", { n: c.notRun }));
  if (c.failed) parts.push(t("{n} failed.", { n: c.failed }));

  return (
    <div
      className="lot"
      style={{ "--grade": GRADE_COLOUR[g.grade], "--grade-ink": GRADE_INK[g.grade] } as CSSProperties}
    >
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href={routes.lots}>{t("All lots")}</a>
        <span aria-hidden="true">/</span>
        <a href={href(routes.lot, lot.slug)}>{t("Lot")} {lot.number}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("Trust check")}</span>
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
            <p className="lot-id">{t("Lot")} {lot.number}</p>
            <h1>{t("Trust check")}</h1>
            <p className="reason">
              <strong>{parts[0]}</strong> {parts.slice(1).join(" ")}
            </p>
            <p className="rules">
              {t("Seven independent checks look for signs of false origin. None proves origin alone. Together they make it harder to fake.")}
            </p>
          </div>
        </header>

        <aside className="rail" aria-label="Evidence pack">
          <h2>{t("Evidence pack")}</h2>
          <p className="pack-intro">{t("What your bank or auditor would receive with this lot.")}</p>
          <ul className="pack">
            {pack.map((p) => (
              <li key={p.label}>
                <Mark status={p.status} />
                <span>{t(p.label)}</span>
                <span className={`word word-${p.status}`}>
                  {p.status === "verified" ? t("Included") : p.status === "partial" ? t("Incomplete") : t("Not available")}
                </span>
              </li>
            ))}
          </ul>
          <div className="reserve">
            <button type="button" className="btn" disabled>
              {t("Export for your bank")}
            </button>
            <p className="reserve-note">
              {t("Not connected in this demo. The real pack would be a signed file your bank can check on its own.")}
            </p>
          </div>
          <p className="back">
            <a href={href(routes.lot, lot.slug)}>{t("Back to lot {n}", { n: lot.number })}</a>
          </p>
        </aside>

        <div className="body">
          <article
            className="sheet"
            aria-label={`Origin cross-check report for lot ${lot.number}`}
          >
            <header className="sheet-head">
              <div>
                <h2 className="sheet-title">{t("Origin cross-check report")}</h2>
                <p>
                  {t("Lot {n}. Reference XC-{n} (demo). Run by the platform rules engine, not by AI.", { n: lot.number })}
                </p>
              </div>
              <div className="stamp" aria-hidden="true">
                <span className="stamp-main">
                  {t("{n} of {m} passed", { n: c.passed, m: c.total })}
                </span>
                <span>{blocked ? t("Blocked") : `${t("Grade")} ${g.grade}`}</span>
              </div>
            </header>

            <section className="block" aria-labelledby="h-cross">
              <div className="block-head">
                <h2 id="h-cross">{t("The seven checks")}</h2>
                <p>{t("Passed means no concern found")}</p>
              </div>
              {/* COMPLIANCE: origin checks flag risk. They never prove origin. */}
              <ul className="ledger">
                {CROSS_META.map((m, i) => {
                  const [status, finding] = lot.cross[i];
                  return (
                    <li key={m.id} style={{ "--i": i } as CSSProperties}>
                      <Mark status={status} />
                      <div className="l-main">
                        <h3>{t(m.label)}</h3>
                        <p className="finding">{finding}</p>
                        <p className="what">{t(m.what)}</p>
                      </div>
                      <p className="l-meta">
                        <span className={`word word-${status}`}>{t(CROSS_WORD[status])}</span>
                        <span>{t("Platform rules engine")}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="limits" aria-labelledby="h-limits-check">
              <h2 id="h-limits-check">{t("What these checks cannot do")}</h2>
              <p>
                {t("A determined actor who falsifies the pin, photos and paperwork together, especially where an armed group controls a mine, may pass every check. A mixed lot can also look clean. Passed checks lower the risk. They do not guarantee origin.")}
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
