"use client";

import { resetDeal, fmtTime, personName, useStore } from "@/lib/dealStore";
import { short } from "@/lib/chain";
import { useT } from "./I18n";

const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-US")}`;

// One page that answers "who signed what, and when" for a finished deal. This is what a bank or auditor asks for first.
// COMPLIANCE: it only reports what the back office recorded. It approves nothing and is not a legal record in this demo.
export default function DealSummary({
  slug, lotNumber, qty, finalTa, finalValue, balance,
}: { slug: string; lotNumber: string; qty: number; finalTa: number; finalValue: number; balance: number }) {
  const t = useT();
  const s = useStore();
  const reqs = s.reqs.filter((r) => r.slug === slug && r.status === "approved").sort((a, b) => a.at - b.at);
  const log = s.audit.filter((a) => a.ref === slug || reqs.some((r) => r.id === a.ref));
  const head = s.audit[s.audit.length - 1];
  return (
    <section className="summary" aria-labelledby="sum-h">
      <h2 id="sum-h">{t("Deal summary")}</h2>
      <p className="reserve-note">{t("Lot {n}, {q} tonnes, final grade {ta}% Ta2O5, final value {v}. {b}", {
        n: lotNumber, q: qty, ta: finalTa.toFixed(2), v: usd(finalValue),
        b: balance >= 0 ? t("Balance paid to the seller: {amount}.", { amount: usd(balance) }) : t("Refund to the buyer: {amount}.", { amount: usd(-balance) }),
      })}</p>
      <table className="bo-table">
        <thead>
          <tr><th>{t("Approval")}</th><th>{t("Signed by")}</th><th>{t("When")}</th></tr>
        </thead>
        <tbody>
          {reqs.map((r) => (
            <tr key={r.id}>
              <td>{r.title} <small>{r.id}</small></td>
              <td>{r.sigs.map((x) => personName(x.personId)).join(", ") || t("Automatic check")}</td>
              <td>{r.sigs.length ? fmtTime(r.sigs[r.sigs.length - 1].at) : fmtTime(r.decidedAt ?? r.at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="reserve-note">
        {t("{n} recorded actions in the audit log for this deal.", { n: log.length })}
        {head && <> {t("Log fingerprint (demo):")} <code>{short(head.hash)}</code></>}
      </p>
      <div className="summary-actions">
        <button type="button" className="btn btn-quiet" onClick={() => window.print()}>{t("Print or save as PDF")}</button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            resetDeal(slug);
            window.scrollTo(0, 0);
          }}
        >
          {t("Replay this deal from the start")}
        </button>
      </div>
    </section>
  );
}
