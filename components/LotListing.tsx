"use client";

import { useState, type CSSProperties } from "react";
import { computeGrade, type Grade, type Lot } from "@/lib/grade";
import { GRADE_COLOUR } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import { Meter } from "./Mark";

type Filter = "All" | Grade;
const ORDER: Record<Grade, number> = { A: 0, B: 1, C: 2, Blocked: 3 };

export default function LotListing({ lots, routes }: { lots: Lot[]; routes: Routes }) {
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
      <h1>Lots on the exchange</h1>
      <p className="listing-intro">
        Every lot here was approved by a named reviewer. The letter is its Trust Grade, set by
        fixed rules from the evidence. Open a lot to see what backs it.
      </p>

      <div className="filters">
        <div role="group" aria-label="Filter by Trust Grade" className="chips">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={active === c}
              onClick={() => setFilter(c)}
            >
              {c === "All" ? "All grades" : c === "Blocked" ? "Blocked" : `Grade ${c}`}
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
          <span>Also show lots buyers cannot see (demo view)</span>
        </label>
      </div>

      <p className="count" aria-live="polite">
        Showing {shown.length} of {rows.length} lots
      </p>

      {shown.length === 0 ? (
        <div className="empty">
          <h2>No lots match</h2>
          <p>
            There are no approved Grade {active} lots right now. Try another grade, or show all
            grades.
          </p>
          <button type="button" className="btn btn-quiet" onClick={() => setFilter("All")}>
            Show all grades
          </button>
        </div>
      ) : (
        <ul className="rows">
          {shown.map(({ lot, grade }) => {
            const tag =
              lot.review.status === "pending"
                ? "Waiting for approval"
                : lot.review.status === "rejected"
                  ? "Rejected"
                  : null;
            return (
              <li
                key={lot.slug}
                className={tag ? "is-hidden" : undefined}
                style={{ "--grade": GRADE_COLOUR[grade] } as CSSProperties}
              >
                <a href={href(routes.lot, lot.slug)}>
                  <span className={`row-grade${grade === "Blocked" ? " is-word" : ""}`}>{grade}</span>
                  <span className="row-main">
                    <strong>Lot {lot.number}</strong>
                    <span>
                      {lot.tonnes} tonnes, {lot.basisTa2O5}% Ta2O5 basis
                    </span>
                    <span>{lot.incoterm}</span>
                    {tag && <em>{tag}</em>}
                  </span>
                  <span className="row-evidence">
                    <Meter lot={lot} />
                    <span>{lot.mine.tier} mine</span>
                  </span>
                  <span className="row-price">
                    USD {lot.priceUsdPerLb}
                    <small> per lb</small>
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
