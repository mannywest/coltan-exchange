"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import {
  CHECK_LABELS,
  CHECK_ORDER,
  STATUS_WORD,
  computeGrade,
  crossSummary,
  type Lot,
} from "@/lib/grade";
import { GRADE_COLOUR } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import { fmtDate } from "@/lib/format";
import Mark from "./Mark";

type Choice = "approve" | "conditions" | "reject";
const LABEL: Record<Choice, string> = {
  approve: "Approve",
  conditions: "Approve with conditions",
  reject: "Reject",
};
type Made = { choice: Choice; reason: string };

export default function ReviewDesk({ lots, routes }: { lots: Lot[]; routes: Routes }) {
  const waiting = lots.filter((l) => l.review.status === "pending");
  const earlier = lots.filter((l) => l.review.status !== "pending");

  const [made, setMade] = useState<Record<string, Made>>({});
  const [selected, setSelected] = useState<string>((waiting[0] ?? earlier[0]).slug);
  const [choice, setChoice] = useState<Choice | "">("");
  const [reason, setReason] = useState("");

  const queue = waiting.filter((l) => !made[l.slug]);
  const decidedNow = waiting.filter((l) => made[l.slug]);
  const lot = lots.find((l) => l.slug === selected) ?? lots[0];
  const g = computeGrade(lot);
  const c = crossSummary(lot);
  const decision = made[lot.slug];
  const isPending = lot.review.status === "pending";

  // COMPLIANCE: these gates are fixed rules. A person decides, but cannot approve a lot the
  // rules have blocked, and cannot approve a Grade C lot without conditions.
  const allowed: Record<Choice, boolean> = {
    approve: g.grade === "A" || g.grade === "B",
    conditions: g.grade !== "Blocked",
    reject: true,
  };
  const needsReason = choice === "conditions" || choice === "reject";
  const valid = choice !== "" && (!needsReason || reason.trim().length >= 10);

  function pick(slug: string) {
    setSelected(slug);
    setChoice("");
    setReason("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setMade((m) => ({ ...m, [lot.slug]: { choice, reason: reason.trim() } }));
    setChoice("");
    setReason("");
  }

  function undo() {
    setMade((m) => {
      const { [lot.slug]: _removed, ...rest } = m;
      void _removed;
      return rest;
    });
  }

  const item = (l: Lot, note: string) => {
    const gr = computeGrade(l).grade;
    return (
      <li key={l.slug}>
        <button
          type="button"
          className="q-item"
          aria-current={selected === l.slug ? "true" : undefined}
          onClick={() => pick(l.slug)}
          style={{ "--grade": GRADE_COLOUR[gr] } as CSSProperties}
        >
          <span className={`q-grade${gr === "Blocked" ? " is-word" : ""}`}>{gr}</span>
          <span className="q-main">
            <strong>Lot {l.number}</strong>
            <span>
              {l.mine.name}, {l.mine.tier}
            </span>
            <em>{note}</em>
          </span>
        </button>
      </li>
    );
  };

  return (
    <section className="review-desk">
      <h1>Reviewer desk</h1>
      <p className="listing-intro">
        Lots that the rules cannot clear alone wait here for a named person. You decide. The rules
        set the limits, and AI only drafts a summary.
      </p>

      <div className="desk">
        <nav className="queue" aria-label="Review queue">
          <h2>Waiting for a decision ({queue.length})</h2>
          {queue.length === 0 ? (
            <div className="empty small">
              <p>The queue is clear. Nothing is waiting for you.</p>
            </div>
          ) : (
            <ul>{queue.map((l) => item(l, `Submitted ${fmtDate(l.review.at)}`))}</ul>
          )}
          <h2>Decided</h2>
          <ul>
            {decidedNow.map((l) => item(l, `${LABEL[made[l.slug].choice]} (demo)`))}
            {earlier.map((l) =>
              item(l, `${l.review.status === "approved" ? "Approved" : "Rejected"} ${fmtDate(l.review.at)}`)
            )}
          </ul>
        </nav>

        <article
          className="case"
          aria-live="polite"
          style={{ "--grade": GRADE_COLOUR[g.grade] } as CSSProperties}
        >
          <header className="case-head">
            <div>
              <p className="lot-id">
                {lot.sellerAlias}, {lot.tonnes} tonnes, USD {lot.priceUsdPerLb} per lb
              </p>
              <h2>Lot {lot.number}</h2>
              <p className="case-grade">
                Rules propose <strong>{g.grade === "Blocked" ? "Blocked" : `Grade ${g.grade}`}</strong>.{" "}
                {lot.mine.name} is in the {lot.mine.tier} tier.
              </p>
            </div>
            <div className={`case-letter${g.grade === "Blocked" ? " is-word" : ""}`} aria-hidden="true">
              {g.grade}
            </div>
          </header>

          {lot.caseNote && (
            <div className="case-why">
              <h3>Why a person must decide</h3>
              <p>{lot.caseNote}</p>
            </div>
          )}

          {lot.aiSummary && (
            <div className="ai">
              <h3>Draft summary</h3>
              <p className="ai-label">
                Written by AI. Check it against the evidence before you rely on it.
              </p>
              <p>{lot.aiSummary}</p>
            </div>
          )}

          <h3 className="case-sub">Evidence</h3>
          <ul className="mini">
            {CHECK_ORDER.map((k) => (
              <li key={k}>
                <Mark status={lot.evidence[k].status} />
                <span>{CHECK_LABELS[k]}</span>
                <span className={`word word-${lot.evidence[k].status}`}>
                  {STATUS_WORD[lot.evidence[k].status]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mini-more">
            Origin checks: {c.passed} of {c.total} passed
            {c.failed ? `, ${c.failed} failed` : ""}.{" "}
            <a href={href(routes.lot, lot.slug)}>Open the certificate</a>{" "}
            <a href={href(routes.check, lot.slug)}>Open the trust check</a>
          </p>

          {decision ? (
            <div className="decided" role="status">
              <p className="reserved-title">Decision recorded (demo)</p>
              <p>
                {LABEL[decision.choice]}, by you, today.
                {decision.reason && <> Reason: {decision.reason}</>}
              </p>
              <button type="button" className="btn btn-quiet" onClick={undo}>
                Change decision
              </button>
            </div>
          ) : !isPending ? (
            <div className="decided">
              <p className="reserved-title">
                {lot.review.status === "approved" ? "Approved" : "Rejected"}
              </p>
              <p>
                By {lot.review.by}, {fmtDate(lot.review.at)}.{" "}
                {lot.review.note ?? "No conditions were set."}
              </p>
            </div>
          ) : (
            <form className="decide" onSubmit={submit}>
              <fieldset>
                <legend>Your decision</legend>
                {(Object.keys(LABEL) as Choice[]).map((k) => (
                  <label key={k} className={allowed[k] ? undefined : "is-off"}>
                    <input
                      type="radio"
                      name="decision"
                      value={k}
                      checked={choice === k}
                      disabled={!allowed[k]}
                      onChange={() => setChoice(k)}
                    />
                    <span>
                      <strong>{LABEL[k]}</strong>
                      {!allowed[k] && (
                        <small>
                          The rules do not allow this for a{" "}
                          {g.grade === "Blocked" ? "Blocked" : `Grade ${g.grade}`} lot.
                        </small>
                      )}
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="reason-field">
                <span>Reason{needsReason ? " (at least 10 characters)" : ""}</span>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="What did you check, and why does it justify this decision?"
                />
              </label>
              <button type="submit" className="btn" disabled={!valid}>
                Record decision
              </button>
              <p className="reserve-note">
                Recorded under your name. AI can summarise and flag, but it never approves, rejects
                or changes a tier. Nothing is saved in this demo.
              </p>
            </form>
          )}
        </article>
      </div>
    </section>
  );
}
