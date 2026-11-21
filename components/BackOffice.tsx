"use client";

import { useEffect, useState } from "react";
import type { Lot } from "@/lib/grade";
import type { Routes } from "@/lib/routes";
import { href } from "@/lib/routes";
import {
  PEOPLE, SLOT_LABEL, KIND_LABEL, ago, fmtTime, getReq, hasSigned, pendingFor, personName, reject, resetAll,
  setUmpire, setWho, sign, slotFor, useStore, assayOutcome, type Req, type Store,
} from "@/lib/dealStore";
import { checksFor, dealStage, followUpFor } from "@/lib/approvals";
import { short } from "@/lib/chain";
import { demoHash } from "@/lib/chain";
import Mark from "./Mark";
import Hint from "./Hint";
import { useT } from "./I18n";

type Tab = "queue" | "deals" | "audit";

// The back office: where named staff approve what the rules engine cannot and must not approve alone.
// COMPLIANCE: money release needs two different named people. Assay results and flagged parties need a named human.
// The screen shows checks computed by code. It never signs for anyone. In the real product this is login and permissions.
export default function BackOffice({ lots, routes }: { lots: Lot[]; routes: Routes }) {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<Tab>("queue");
  const [open, setOpen] = useState<string | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const person = PEOPLE.find((p) => p.id === s.who) ?? PEOPLE[0];
  const mine = pendingFor(s, person.id);
  const pending = s.reqs.filter((r) => r.status === "pending");
  const decided = s.reqs.filter((r) => r.status !== "pending");
  const ordered = [...pending].sort((a, b) => a.at - b.at).concat([...decided].sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0)));
  const deals = Object.values(s.deals);

  return (
    <section className="review-desk backoffice">
      <h1>{t("Back office")}</h1>
      <p className="listing-intro">
        {t("Every payment release, assay result and flagged party waits here for named people. Buyers and sellers cannot approve their own steps.")}
        <Hint>
          {t("Money moves only when two different named people sign. AI can summarise and flag, but it has no signature. In the real product each person has their own login, and every action is recorded.")}
        </Hint>
      </p>

      <div className="bo-who">
        <label className="field">
          <span>{t("Signed in as (demo)")}</span>
          <select value={person.id} onChange={(e) => setWho(e.target.value)} aria-label={t("Signed in as (demo)")}>
            {PEOPLE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <p className="bo-count">
          <strong>{mine}</strong> {t("waiting for you")} · <strong>{pending.length}</strong> {t("open in total")} · <strong>{decided.length}</strong> {t("decided")}
        </p>
      </div>

      <div role="tablist" aria-label={t("Back office sections")} className="tabs">
        {(
          [
            ["queue", t("Approvals")],
            ["deals", t("Deals")],
            ["audit", t("Audit log")],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`tab${tab === id ? " is-on" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <div role="tabpanel" id="tab-panel">
          {ordered.length === 0 ? (
            <div className="empty">
              <h2>{t("Nothing waiting")}</h2>
              <p>{t("Requests appear here when a buyer reserves a lot, pays, or submits a lab result. Start a deal as a buyer, then come back.")}</p>
              <a href={routes.lots}>{t("Browse the lots")}</a>
            </div>
          ) : (
            <ul className="bo-list">
              {ordered.map((r) => (
                <li key={r.id} className={`bo-item is-${r.status}`}>
                  <button
                    type="button"
                    className="bo-head"
                    aria-expanded={open === r.id}
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                  >
                    <span className="bo-ref">{r.id}</span>
                    <span className="bo-title">{r.title}</span>
                    <span className="bo-meta">
                      {r.amount !== undefined && (
                        <b>
                          {r.unit} {Math.round(r.amount).toLocaleString("en-GB")}
                        </b>
                      )}
                      <small>{t("Requested {when}", { when: ago(r.at) })}</small>
                    </span>
                    <span className={`bo-status bo-${r.status}`}>
                      {r.status === "pending"
                        ? `${r.sigs.length} of ${r.slots.length} ${t("signed")}`
                        : r.status === "approved"
                          ? t("Approved")
                          : t("Rejected")}
                    </span>
                  </button>
                  {open === r.id && <RequestDetail req={r} s={s} lots={lots} routes={routes} personId={person.id} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "deals" && (
        <div role="tabpanel" id="tab-panel">
          {deals.length === 0 ? (
            <div className="empty">
              <h2>{t("No deals yet")}</h2>
              <p>{t("A deal appears here as soon as a buyer reserves a lot.")}</p>
            </div>
          ) : (
            <table className="bo-table">
              <thead>
                <tr>
                  <th>{t("Lot")}</th>
                  <th>{t("Tonnes")}</th>
                  <th>{t("Payment route")}</th>
                  <th>{t("Where it is")}</th>
                  <th>{t("Waiting on")}</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => {
                  const st = dealStage(d, s);
                  return (
                    <tr key={d.slug}>
                      <th scope="row">
                        <a href={href(routes.deal, d.slug)}>{d.lotNumber}</a>
                      </th>
                      <td>{d.qty}</td>
                      <td>{d.method === "usdt" ? "USDT (simulated)" : t("Bank escrow")}</td>
                      <td>
                        {t("Step {n}", { n: st.step })}: {st.label}
                        <small>{st.detail}</small>
                      </td>
                      <td>{st.waitingOn === "Nobody" ? "—" : t(st.waitingOn)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div role="tabpanel" id="tab-panel">
          <p className="reserve-note">
            {t("Every action is written once and chained to the one before it, so a change to an old entry would show. Demo fingerprints only.")}
          </p>
          {s.audit.length === 0 ? (
            <div className="empty">
              <h2>{t("Nothing recorded yet")}</h2>
            </div>
          ) : (
            <ol className="bo-audit">
              {[...s.audit].reverse().map((a) => (
                <li key={a.n}>
                  <span className="bo-time">{fmtTime(a.at)}</span>
                  <span>
                    <b>{a.who}</b> {a.action}
                    <small>
                      {a.ref} · <code>{short(a.hash)}</code>
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <button type="button" className="btn btn-quiet" style={{ width: "auto", marginTop: 24 }} onClick={resetAll}>
        {t("Clear all demo deals and approvals")}
      </button>
    </section>
  );
}

function RequestDetail({ req, s, lots, routes, personId }: { req: Req; s: Store; lots: Lot[]; routes: Routes; personId: string }) {
  const t = useT();
  const person = PEOPLE.find((p) => p.id === personId)!;
  const deal = s.deals[req.slug];
  const lot = lots.find((l) => l.slug === req.slug);
  const checks = checksFor(req, deal, lot, s);
  const [ack, setAck] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [umpire, setUmp] = useState(req.assay?.umpire !== undefined ? String(req.assay.umpire) : "");
  const human = req.kind === "enhanced" || req.kind === "wallet"; // a person judges these; a failed check does not block them
  const failed = !human && checks.some((c) => !c.ok);
  const slot = slotFor(req, person);
  const signed = hasSigned(req, person.id);
  const decided = req.status !== "pending";
  const fingerprint = demoHash(`${req.id}|${req.title}|${req.amount ?? 0}`);

  const why = decided
    ? null
    : signed
      ? t("You already signed. A different person must sign the other slot.")
      : !slot
        ? t("This needs a {role}. Switch the person above.", {
            role: req.slots
              .filter((x) => !req.sigs.some((g) => g.slot === x))
              .map((x) => t(SLOT_LABEL[x]).toLowerCase())
              .join(` ${t("or")} `),
          })
        : failed
          ? req.kind === "assay"
            ? t("Enter the umpire lab result first.")
            : t("A check failed. Reject with a reason, or wait for the buyer to fix it.")
          : !ack
            ? t("Tick the box to confirm you reviewed the checks.")
            : null;

  function onSign() {
    if (req.kind === "assay" && req.assay && !assayOutcome(req.assay).within) {
      const v = Number(umpire);
      if (umpire.trim() === "" || Number.isNaN(v)) return setErr(t("Enter the umpire lab result first."));
    }
    setErr(sign(req.id, person.id, followUpFor(lot)));
  }

  return (
    <div className="bo-detail">
      <dl className="bo-facts">
        <div>
          <dt>{t("Request")}</dt>
          <dd>{t(KIND_LABEL[req.kind])}</dd>
        </div>
        <div>
          <dt>{t("Lot")}</dt>
          <dd>
            <a href={href(routes.lot, req.slug)}>{req.lotNumber}</a> · {deal?.qty} t
          </dd>
        </div>
        <div>
          <dt>{t("Asked by")}</dt>
          <dd>{req.kind === "wallet" ? t("Automatic screening (demo)") : "Buyer B-04 (demo)"}</dd>
        </div>
        <div>
          <dt>{t("Needs")}</dt>
          <dd>{req.slots.map((x) => t(SLOT_LABEL[x])).join(` ${t("and")} `)}</dd>
        </div>
        <div>
          <dt>{t("Fingerprint")}</dt>
          <dd>
            <code>{short(fingerprint)}</code>
          </dd>
        </div>
      </dl>

      <h3>{t("Checks run by the rules engine")}</h3>
      <ul className="bo-checks">
        {checks.map((c) => (
          <li key={c.label}>
            <Mark status={c.ok ? "verified" : "missing"} />
            <span>
              <b>{c.label}</b>
              <small>{c.note}</small>
            </span>
          </li>
        ))}
      </ul>

      {req.kind === "assay" && req.assay && !assayOutcome(req.assay).within && !decided && (
        <label className="field" style={{ maxWidth: 280 }}>
          <span>{t("Umpire lab result (% Ta2O5)")}</span>
          <input
            inputMode="decimal"
            value={umpire}
            onChange={(e) => {
              setUmp(e.target.value);
              const v = e.target.value.trim() === "" ? undefined : Number(e.target.value);
              setUmpire(req.id, v !== undefined && !Number.isNaN(v) ? v : undefined);
            }}
          />
        </label>
      )}

      <h3>{t("Signatures")}</h3>
      <ul className="approval-slots">
        {req.slots.map((x) => {
          const sig = req.sigs.find((g) => g.slot === x);
          return (
            <li key={x}>
              <span>{t(SLOT_LABEL[x])}</span>
              {sig ? (
                <b className="sign-done">
                  {personName(sig.personId)} · {fmtTime(sig.at)}
                </b>
              ) : (
                <em>{t("Waiting")}</em>
              )}
            </li>
          );
        })}
      </ul>

      {decided ? (
        <p className={`outcome ${req.status === "approved" ? "ok" : "warn"}`}>
          {req.status === "approved"
            ? t("Approved. The next step has been raised automatically.")
            : t("Rejected by {who}: {reason}", { who: personName(req.decidedBy ?? ""), reason: req.reason ?? "" })}
        </p>
      ) : (
        <>
          <label className="check-row">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>{t("I have reviewed the evidence and the checks above.")}</span>
          </label>
          <div className="bo-actions">
            <button type="button" className="btn" disabled={why !== null} onClick={onSign}>
              {req.kind === "wallet" ? t("Clear this wallet") : req.kind === "enhanced" ? t("Allow this buyer to continue") : t("Sign as {role}", { role: slot ? t(SLOT_LABEL[slot]).toLowerCase() : t("named person") })}
            </button>
          </div>
          {why && <p className="reserve-note">{why}</p>}
          <label className="field">
            <span>{req.kind === "wallet" ? t("Reason for keeping it blocked") : t("Reason, if you reject")}</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("The buyer will see this")} />
          </label>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setErr(reject(req.id, person.id, reason))}
            style={{ width: "auto" }}
          >
            {req.kind === "wallet" ? t("Keep it blocked") : t("Reject with reason")}
          </button>
          {err && (
            <p className="outcome warn" role="alert">
              {err}
            </p>
          )}
        </>
      )}
      {/* COMPLIANCE: the audit log keeps every signature and rejection with the person's name and time. */}
      {getReq(s, req.id)?.status === "pending" && deal && <p className="reserve-note">{t("This request is recorded in the audit log.")}</p>}
    </div>
  );
}
