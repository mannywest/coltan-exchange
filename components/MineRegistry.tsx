"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { TIER_NOTES, type Tier } from "@/lib/grade";
import { mines } from "@/data/mines";
import { lots } from "@/data/lots";
import { computeGrade } from "@/lib/grade";
import { href, type Routes } from "@/lib/routes";
import { fmtDate } from "@/lib/format";
import { useT } from "./I18n";

const TIERS: Tier[] = ["Blocked", "Unverified", "Watch", "Verified"];
type Filter = "All" | Tier;
const COLOUR: Record<Tier, string> = {
  Blocked: "var(--blocked)",
  Unverified: "var(--copper)",
  Watch: "var(--amber)",
  Verified: "var(--verified)",
};

// COMPLIANCE: fixed rules for moving a mine between tiers. A named reviewer makes every change,
// it is logged, and AI can flag risk signals but never changes a tier.
const MOVES: Record<Tier, Tier[]> = {
  Blocked: ["Unverified"],
  Unverified: ["Blocked", "Verified"],
  Watch: ["Blocked", "Unverified", "Verified"],
  Verified: ["Watch", "Blocked"],
};

type Entry = { n: number; mine: string; from: Tier; to: Tier; reason: string };

export default function MineRegistry({ routes }: { routes: Routes }) {
  const t = useT();
  const [override, setOverride] = useState<Record<string, Tier>>({});
  const [log, setLog] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState(mines[0].name);
  const [to, setTo] = useState<Tier | "">("");
  const [visit, setVisit] = useState(false);
  const [reason, setReason] = useState("");

  const tierOf = (name: string): Tier => override[name] ?? mines.find((m) => m.name === name)!.tier;
  const count = (f: Filter) => (f === "All" ? mines.length : mines.filter((m) => tierOf(m.name) === f).length);
  const shown = mines.filter((m) => filter === "All" || tierOf(m.name) === filter);
  const mine = mines.find((m) => m.name === selected) ?? mines[0];
  const tier = tierOf(mine.name);
  const linked = lots.filter((l) => l.mine.name === mine.name);

  const needsVisit = to === "Verified";
  const valid = to !== "" && reason.trim().length >= 10 && (!needsVisit || visit);

  function pick(name: string) {
    setSelected(name);
    setTo("");
    setVisit(false);
    setReason("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setOverride((o) => ({ ...o, [mine.name]: to }));
    setLog((l) => [{ n: l.length + 1, mine: mine.name, from: tier, to, reason: reason.trim() }, ...l]);
    setTo("");
    setVisit(false);
    setReason("");
  }

  return (
    <section className="review-desk">
      <h1>{t("Mine registry")}</h1>
      <p className="listing-intro">
        {t(
          "Every mine starts in a risk tier. Only Verified and Watch mines can supply lots. Reviewers see this page. Buyers see a mine's tier and an evidence summary, never its location."
        )}
      </p>

      <div className="filters">
        <div role="group" aria-label={t("Filter by tier")} className="chips">
          {(["All", ...TIERS] as Filter[]).map((f) => (
            <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "All" ? t("All tiers") : t(f)}
              <span>{count(f)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="desk">
        <nav className="queue" aria-label={t("Mines")}>
          <h2>{t("Mines")}</h2>
          <ul>
            {shown.map((m) => {
              const tr = tierOf(m.name);
              return (
                <li key={m.name}>
                  <button
                    type="button"
                    className="q-item"
                    aria-current={selected === m.name ? "true" : undefined}
                    onClick={() => pick(m.name)}
                    style={{ "--grade": COLOUR[tr] } as CSSProperties}
                  >
                    <span className="q-grade is-word">{t(tr)}</span>
                    <span className="q-main">
                      <strong>{m.name}</strong>
                      <span>{m.operator}</span>
                      <em>
                        {t("{n} lots", { n: lots.filter((l) => l.mine.name === m.name).length })}
                      </em>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <article className="case" aria-live="polite" style={{ "--grade": COLOUR[tier] } as CSSProperties}>
          <header className="case-head">
            <div>
              <p className="lot-id">{mine.operator}</p>
              <h2>{mine.name}</h2>
              <p className="case-grade">
                {t("Tier")}: <strong>{t(tier)}</strong>
              </p>
            </div>
          </header>

          <ol className="tiers" aria-label={t("Mine risk tier")} style={{ marginTop: 20 }}>
            {TIERS.map((x) => (
              <li
                key={x}
                className={`tier tier-${x.toLowerCase()}${x === tier ? " is-current" : ""}`}
                aria-current={x === tier ? "true" : undefined}
              >
                {t(x)}
              </li>
            ))}
          </ol>
          <p className="tier-note">{TIER_NOTES[tier]}</p>

          <dl className="facts-list">
            <div>
              <dt>{t("Permit")}</dt>
              <dd>{mine.permit}</dd>
            </div>
            <div>
              <dt>{t("Last verified")}</dt>
              <dd>
                {mine.lastVerified ? `${fmtDate(mine.lastVerified)}, ${mine.verifiedBy}` : t("Never")}
              </dd>
            </div>
            <div>
              <dt>{t("Traceability tag")}</dt>
              <dd>{mine.tag}</dd>
            </div>
            <div>
              <dt>{t("Location")}</dt>
              <dd>{t("Withheld. Seen only by a few named people.")}</dd>
            </div>
          </dl>

          <h3 className="case-sub">{t("Risk signals")}</h3>
          {mine.signals.length === 0 ? (
            <p className="mini-more">{t("No open signals.")}</p>
          ) : (
            <ul className="signals">
              {mine.signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          <p className="mini-more">
            {t("The rules engine and AI flag signals for a reviewer to judge. They never change a tier.")}
          </p>

          <h3 className="case-sub">{t("Lots from this mine")}</h3>
          {linked.length === 0 ? (
            <p className="mini-more">{t("No lots yet.")}</p>
          ) : (
            <ul className="mini">
              {linked.map((l) => (
                <li key={l.slug}>
                  <span />
                  <a href={href(routes.lot, l.slug)}>
                    {t("Lot")} {l.number}
                  </a>
                  <span className="word">
                    {computeGrade(l).grade === "Blocked" ? t("Blocked") : `${t("Grade")} ${computeGrade(l).grade}`}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form className="decide" onSubmit={submit}>
            <fieldset>
              <legend>{t("Change tier")}</legend>
              {MOVES[tier].map((x) => (
                <label key={x}>
                  <input type="radio" name="tier" value={x} checked={to === x} onChange={() => setTo(x)} />
                  <span>
                    <strong>{t(x)}</strong>
                    {x === "Verified" && <small>{t("Needs an independent site visit in the last 90 days.")}</small>}
                  </span>
                </label>
              ))}
              {TIERS.filter((x) => x !== tier && !MOVES[tier].includes(x)).map((x) => (
                <label key={x} className="is-off">
                  <input type="radio" name="tier" value={x} disabled />
                  <span>
                    <strong>{t(x)}</strong>
                    <small>{t("The rules do not allow a direct move from {a} to {b}.", { a: t(tier), b: t(x) })}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            {needsVisit && (
              <label className="check-row">
                <input type="checkbox" checked={visit} onChange={(e) => setVisit(e.target.checked)} />
                <span>{t("An independent site visit was done in the last 90 days")}</span>
              </label>
            )}
            <label className="reason-field">
              <span>{t("Reason (at least 10 characters)")}</span>
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <button type="submit" className="btn" disabled={!valid}>
              {t("Record tier change")}
            </button>
            <p className="reserve-note">
              {t("Recorded under your name and kept in the change log. Nothing is saved in this demo.")}
            </p>
          </form>

          {log.length > 0 && (
            <div className="decided" role="status">
              <p className="reserved-title">{t("Change log (this session)")}</p>
              <ul className="mini">
                {log.map((e) => (
                  <li key={e.n}>
                    <span />
                    <span>
                      {e.mine}: {t("{a} to {b}", { a: t(e.from), b: t(e.to) })}. {e.reason}
                    </span>
                    <span />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
