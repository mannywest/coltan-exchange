"use client";

import { useState, type CSSProperties } from "react";
import { computeGrade, type Grade, type Lot } from "@/lib/grade";
import { GRADE_COLOUR } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import { Meter } from "./Mark";
import { GRADE_LABEL } from "@/lib/ui";
import { LotThumb } from "./HomeArt";
import { useT } from "./I18n";

type Filter = "All" | Grade;
const ORDER: Record<Grade, number> = { A: 0, B: 1, C: 2, Blocked: 3 };

export default function LotListing({ lots, routes }: { lots: Lot[]; routes: Routes }) {
  const t = useT();
  const [filter, setFilter] = useState<Filter>("All");
  // COMPLIANCE: buyers only see lots a named reviewer has approved and that are not Blocked.
  // The switch below exists only so the demo can show what buyers do not see.
  const [showHidden, setShowHidden] = useState(false);

  const rows = lots
    .map((lot) => ({ lot, grade: computeGrade(lot).grade }))
    .filter((r) => showHidden || (r.lot.review.status === "approved" && r.grade !== "Blocked"));

  const chips: Filter[] = showHidden ? ["All", "A", "B", "C", "Blocked"] : ["All", "A", "B", "C"];
  const active: Filter = chips.includes(filter) ? filter : "All";
  const count = (f: Filter) => (f === "All" ? rows.length : rows.filter((r) => r.grade === f).length);
  const shown = rows
    .filter((r) => active === "All" || r.grade === active)
    .sort((a, b) => ORDER[a.grade] - ORDER[b.grade] || a.lot.number.localeCompare(b.lot.number));

  return (
    <section className="listing">
      <h1>{t("Lots on the exchange")}</h1>
      <p className="listing-intro">
        {t("Every lot here was approved by a named reviewer. The letter is its Trust Grade, set by fixed rules from the evidence. Open a lot to see what backs it.")}
      </p>

      <div className="filters">
        <div role="group" aria-label={t("Filter by Trust Grade")} className="chips">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={active === c}
              onClick={() => setFilter(c)}
            >
              {c === "All" ? t("All grades") : c === "Blocked" ? t("Blocked") : `${t("Grade")} ${c}`}
              <span>{count(c)}</span>
            </button>
          ))}
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          <span>{t("Also show lots buyers cannot see (demo view)")}</span>
        </label>
      </div>

      <p className="count" aria-live="polite">
        {t("Showing {a} of {b} lots", { a: shown.length, b: rows.length })}
      </p>

      {shown.length === 0 ? (
        <div className="empty">
          <h2>{t("No lots match")}</h2>
          <p>
            {t("There are no approved Grade {g} lots right now. Try another grade, or show all grades.", { g: active })}
          </p>
          <button type="button" className="btn btn-quiet" onClick={() => setFilter("All")}>
            {t("Show all grades")}
          </button>
        </div>
      ) : (
        <ul className="rows">
          {shown.map(({ lot, grade }) => {
            const tag =
              lot.review.status === "pending"
                ? t("Waiting for approval")
                : lot.review.status === "rejected"
                  ? t("Rejected")
                  : null;
            return (
              <li
                key={lot.slug}
                className={tag ? "is-hidden" : undefined}
                style={{ "--grade": GRADE_COLOUR[grade] } as CSSProperties}
              >
                <a href={href(routes.lot, lot.slug)}>
                  <span className="row-thumb">
                    <LotThumb grade={grade} seed={Number(lot.number) || 1} />
                  </span>
                  <span className={`row-grade${grade === "Blocked" ? " is-word" : ""}`}>{grade === "Blocked" ? t("Blocked") : grade}</span>
                  <span className="row-main">
                    <strong>{t("Lot")} {lot.number}</strong>
                    <small className="row-label">{t(GRADE_LABEL[grade])}</small>
                    <span>
                      {t("{n} tonnes, {b}% Ta2O5 basis", { n: lot.tonnes, b: lot.basisTa2O5 })}
                    </span>
                    <span>{lot.incoterm}</span>
                    {tag && <em>{tag}</em>}
                  </span>
                  <span className="row-evidence">
                    <Meter lot={lot} />
                    <span>{t("{tier} mine", { tier: t(lot.mine.tier) })}</span>
                  </span>
                  <span className="row-price">
                    USD {lot.priceUsdPerLb}
                    <small> {t("per lb")}</small>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
