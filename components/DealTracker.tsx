"use client";

import { useEffect, type CSSProperties } from "react";
import { computeGrade, evidencePack, type Lot, type Status } from "@/lib/grade";
import { GRADE_COLOUR } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import Mark from "./Mark";
import ContractPanel, { type ChainEvent, type Notice, type StatementRow } from "./ContractPanel";
import { SellerView, Receipt } from "./ContractExtras";
import UsdtFlow from "./UsdtFlow";
import ApprovalStatus from "./ApprovalStatus";
import DisputeHelper from "./DisputeHelper";
import { SHIP_DOCS } from "@/lib/approvals";
import Hint from "./Hint";
import Term from "./Term";
import { PLATFORM_FEE_PCT, PROVISIONAL_SHARE, LB_PER_TONNE, preShipGrade } from "@/lib/price";
import {
  TOLERANCE, assayOutcome, bankSent, buyerSign, getReq, openDeal, personName, requestRelease, resetDeal,
  setBuyerLab, setMethod, submitAssay, useStore,
} from "@/lib/dealStore";
import { useRole, useT } from "./I18n";

const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-US")}`;

// COMPLIANCE: the buyer starts each step. Money release, the assay result and flagged parties are approved
// by named people in the back office. This screen only shows the status. No AI approves or releases money.
export default function DealTracker({ lot, routes }: { lot: Lot; routes: Routes }) {
  const t = useT();
  const { setRole } = useRole();
  const s = useStore();
  const g = computeGrade(lot);
  const eligible = lot.review.status === "approved" && g.grade !== "Blocked";
  const deal = s.deals[lot.slug];

  // A deal opened from a direct link starts as a whole-lot reservation.
  useEffect(() => {
    if (eligible && !s.deals[lot.slug]) openDeal(lot.slug, lot.number, lot.tonnes, g.grade === "C");
  }, [eligible, lot.slug, lot.number, lot.tonnes, g.grade, s.deals]);

  if (!eligible) {
    return (
      <section className="review-desk">
        <h1>{t("Deal")}</h1>
        <div className="empty">
          <h2>{t("This lot cannot be traded")}</h2>
          <p>{t("Only lots a reviewer approved, and that are not Blocked, can go into a deal.")}</p>
          <a href={href(routes.lot, lot.slug)}>{t("Back to lot {n}", { n: lot.number })}</a>
        </div>
      </section>
    );
  }
  if (!deal) return <section className="review-desk"><p className="reserve-note">{t("Opening the deal…")}</p></section>;

  const slug = lot.slug;
  const qty = deal.qty;
  const independent = preShipGrade(lot);
  const value = (ta: number) => qty * LB_PER_TONNE * (ta / 100) * lot.priceUsdPerLb;
  const provisional = value(independent) * PROVISIONAL_SHARE;
  const method = deal.method;
  const unit = method === "usdt" ? "USDT" : "USD";

  const enh = getReq(s, deal.enhancedReq);
  const funds = getReq(s, deal.fundsReq);
  const prov = getReq(s, deal.provReq);
  const sh = getReq(s, deal.shipReq);
  const assay = getReq(s, deal.assayReq);
  const fin = getReq(s, deal.finalReq);
  const enhOk = !enh || enh.status === "approved";
  const signed = deal.buyerSigned && deal.sellerSigned;
  const provDone = prov?.status === "approved";
  const shipDone = sh?.status === "approved";
  const assayDone = assay?.status === "approved" && deal.assayFinal !== null;
  const finalDone = fin?.status === "approved";
  const finalTa = deal.assayFinal ?? NaN;
  const finalValue = assayDone ? value(finalTa) : NaN;
  const balance = assayDone ? finalValue - provisional : NaN;

  const b = deal.buyerLab.trim() === "" ? NaN : Number(deal.buyerLab);
  const preview = Number.isNaN(b) ? null : assayOutcome({ buyerLab: b, independent });

  type Stage = { title: string; status: Status; body: React.ReactNode; summary?: string };
  const stageStatus = (done: boolean, open: boolean): Status => (done ? "verified" : open ? "partial" : "missing");
  const bo = routes.backoffice;
  const asSeller = () => setRole("seller");

  const stages: Stage[] = [
    {
      title: t("Reserve the lot"),
      summary: t("Reserved for {n} hours", { n: lot.holdHours }),
      status: "verified",
      body: <p>{t("Reserved for {n} hours. Nothing is paid yet.", { n: lot.holdHours })} {t("{n} tonnes requested.", { n: qty })}</p>,
    },
    {
      title: t("Sign the locked terms"),
      summary: t("Terms signed by both sides"),
      status: stageStatus(signed, true),
      body: (
        <>
          <p>
            {t("{tonnes} tonnes, {basis}% Ta2O5 basis, {incoterm}, USD {price} per lb.", {
              tonnes: qty, basis: lot.basisTa2O5, incoterm: lot.incoterm, price: lot.priceUsdPerLb,
            })}
          </p>
          {/* COMPLIANCE: counterparty screening is simulated in this demo and does not block signing. In the real product both sides must be cleared by a named Compliance officer first. */}
          <p className="reserve-note">
            {t("The buyer signs, then the seller countersigns. In the real product both must be cleared by screening first. Screening is simulated here.")}
          </p>
          {enh && enh.status !== "approved" && (
            <>
              <p className="outcome warn">
                {t("This lot is Grade C, so a named Compliance officer must allow you to continue before you can sign.")}
              </p>
              <ApprovalStatus req={enh} backofficeHref={bo} />
            </>
          )}
          {enh?.status === "approved" && <p className="outcome ok">{t("Enhanced review passed.")}</p>}
          {enhOk && !deal.buyerSigned && (
            <button type="button" className="btn btn-quiet" onClick={() => buyerSign(slug)}>
              {t("Sign terms as buyer (demo)")}
            </button>
          )}
          {deal.buyerSigned && !deal.sellerSigned && (
            <>
              <p className="outcome" role="status">
                {t("You signed. Waiting for the seller ({n}) to countersign.", { n: lot.sellerAlias })}
                {qty < lot.tonnes ? ` ${t("This is a part-lot request, so the seller must agree to the quantity.")}` : ""}
              </p>
              <a className="btn btn-quiet" href={routes.deals} onClick={asSeller}>
                {t("Demo: act as the seller")}
              </a>
            </>
          )}
          {signed && <p className="outcome ok">{t("Both sides signed.")}</p>}
        </>
      ),
    },
    {
      title: t("Provisional payment into escrow"),
      summary: t("Provisional payment released"),
      status: stageStatus(provDone, signed),
      body: signed ? (
        <>
          <p>
            {t("{pct}% of the value on the independent assay ({ta}% Ta2O5): {amount}.", {
              pct: PROVISIONAL_SHARE * 100, ta: independent.toFixed(1), amount: usd(provisional),
            })}
            <Hint>{t("This is the first payment, called a provisional payment. The final amount is set after the arrival assay.")}</Hint>
          </p>
          <p className="calc">
            {qty} t x {LB_PER_TONNE.toLocaleString("en-US")} lb x {independent.toFixed(1)}% x USD {lot.priceUsdPerLb} x {PROVISIONAL_SHARE * 100}%
          </p>
          {!provDone && deal.cx.wallet === "none" && !deal.bankSent && !prov && (
            <fieldset className="method">
              <legend>{t("How will you pay?")}</legend>
              <label className="check-row">
                <input type="radio" name="method" checked={method === "bank"} onChange={() => setMethod(slug, "bank")} />
                <span>{t("Bank escrow with a regulated partner")}</span>
              </label>
              <label className="check-row">
                <input type="radio" name="method" checked={method === "usdt"} onChange={() => setMethod(slug, "usdt")} />
                <span>{t("USDT through a smart contract (simulated)")}</span>
              </label>
            </fieldset>
          )}
          {method === "usdt" && <UsdtFlow lotNumber={lot.number} slug={slug} amount={provisional} deal={deal} s={s} routes={routes} />}
          {method === "bank" && (
            <>
              {!deal.bankSent && (
                <>
                  <dl className="chain-facts bank-box">
                    <div>
                      <dt>{t("Pay to")}</dt>
                      <dd>Demo Escrow Partner Ltd (demo)</dd>
                    </div>
                    <div>
                      <dt>{t("Account")}</dt>
                      <dd>
                        <code>DEMO 0000 0000 (not a real account)</code>
                      </dd>
                    </div>
                    <div>
                      <dt>{t("Reference")}</dt>
                      <dd>
                        <code>CX-{lot.number}-B04</code>
                      </dd>
                    </div>
                    <div>
                      <dt>{t("Amount")}</dt>
                      <dd>{usd(provisional)}</dd>
                    </div>
                  </dl>
                  <button type="button" className="btn btn-quiet" onClick={() => bankSent(slug, provisional)}>
                    {t("I have sent the transfer (demo)")}
                  </button>
                  <p className="reserve-note">{t("The escrow partner holds the money, not the platform. AI cannot release money.")}</p>
                </>
              )}
              {deal.bankSent && funds && (
                <>
                  <p className="sign-title">{t("Escrow partner confirms the money arrived")}</p>
                  <ApprovalStatus req={funds} backofficeHref={bo} doneText={t("Funds confirmed in escrow.")} />
                </>
              )}
              {funds?.status === "approved" && prov && (
                <>
                  <p className="sign-title">{t("Release the provisional payment")}</p>
                  <ApprovalStatus
                    req={prov}
                    backofficeHref={bo}
                    doneText={t("Provisional payment released.")}
                    onAskAgain={() => requestRelease(slug, { kind: "provisional", amount: provisional, unit: "USD", note: "Funds confirmed in escrow." })}
                  />
                </>
              )}
            </>
          )}
        </>
      ) : (
        <p className="locked">{t("Locked until both sides have signed the terms.")}</p>
      ),
    },
    {
      title: t("Shipment and documents"),
      summary: t("Shipment and documents confirmed"),
      status: stageStatus(shipDone, provDone),
      body: provDone ? (
        <>
          <p>{t("The seller logs each handover and attaches the export documents. A named reviewer checks that seals, weights and paperwork match before the lot goes to assay.")}</p>
          <ol className="handovers">
            {lot.custody.map((c) => (
              <li key={c.at + c.action}>
                <span>{new Date(c.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                <span>
                  {c.action}
                  <small>{c.place} · {c.by}{c.flag ? ` · ${c.flag}` : ""}</small>
                </span>
              </li>
            ))}
          </ol>
          {(!sh || sh.status === "rejected") && (
            <>
              {sh?.status === "rejected" && <ApprovalStatus req={sh} backofficeHref={bo} />}
              <p className="outcome" role="status">
                {t("Waiting for the seller ({n}) to attach the documents ({k} of {m} attached).", { n: lot.sellerAlias, k: deal.docs.length, m: SHIP_DOCS.length })}
              </p>
              <a className="btn btn-quiet" href={routes.deals} onClick={asSeller}>
                {t("Demo: act as the seller")}
              </a>
            </>
          )}
          {sh && sh.status !== "rejected" && (
            <ApprovalStatus req={sh} backofficeHref={bo} doneText={t("Shipment and documents confirmed by a named reviewer.")} />
          )}
        </>
      ) : (
        <p className="locked">{t("Locked until the provisional payment is released.")}</p>
      ),
    },
    {
      title: t("Assay on arrival"),
      summary: assayDone ? t("Final grade {ta}% Ta2O5", { ta: finalTa.toFixed(2) }) : "",
      status: stageStatus(assayDone, shipDone),
      body: shipDone ? (
        <>
          <label className="field" style={{ maxWidth: 260 }}>
            <span>{t("Buyer's lab result (% Ta2O5)")}</span>
            <input
              inputMode="decimal"
              value={deal.buyerLab}
              placeholder={independent.toFixed(1)}
              disabled={assay?.status === "pending" || assayDone}
              onChange={(e) => setBuyerLab(slug, e.target.value)}
            />
          </label>
          {preview && !assay && (
            <p className={`outcome ${preview.within ? "ok" : "warn"}`}>
              {preview.within
                ? t("Gap {gap} points, inside the {tol} point tolerance. The average would be used: {ta}% Ta2O5.", {
                    gap: preview.gap.toFixed(1), tol: TOLERANCE, ta: (preview.final as number).toFixed(2),
                  })
                : t("Gap {gap} points, outside the {tol} point tolerance. The back office opens the sealed umpire sample and its result decides.", {
                    gap: preview.gap.toFixed(1), tol: TOLERANCE,
                  })}
            </p>
          )}
          {(() => {
            const a = assay?.assay;
            if (a) return <DisputeHelper lotNumber={lot.number} buyerLab={a.buyerLab} independent={a.independent} umpire={a.umpire} />;
            if (preview && !preview.within && !Number.isNaN(b)) return <DisputeHelper lotNumber={lot.number} buyerLab={b} independent={independent} />;
            return null;
          })()}
          {!assay && <p className="reserve-note">{t("Try 25.9 as the buyer's result to see the umpire step.")}</p>}
          {!assay && (
            <button
              type="button"
              className="btn btn-quiet"
              disabled={Number.isNaN(b) || b <= 0}
              onClick={() => submitAssay(slug, b, independent)}
            >
              {t("Submit your lab result")}
            </button>
          )}
          {assay && (
            <ApprovalStatus
              req={assay}
              backofficeHref={bo}
              doneText={t("Result recorded by a named reviewer.")}
              onAskAgain={() => submitAssay(slug, Number.isNaN(b) ? independent : b, independent)}
            />
          )}
        </>
      ) : (
        <p className="locked">{t("Locked until the shipment and documents are confirmed.")}</p>
      ),
    },
    {
      title: t("Final payment"),
      summary: t("Final payment released"),
      status: stageStatus(finalDone, assayDone),
      body: assayDone ? (
        <>
          <p>
            {t("Final value at {ta}% Ta2O5: {value}. Already paid: {paid}.", {
              ta: finalTa.toFixed(2), value: usd(finalValue), paid: usd(provisional),
            })}
          </p>
          <p className="outcome ok">
            {balance >= 0
              ? t("Balance due to the seller: {amount}.", { amount: usd(balance) })
              : t("Refund due to the buyer: {amount}.", { amount: usd(-balance) })}
          </p>
          <ApprovalStatus
            req={fin}
            backofficeHref={bo}
            doneText={t("Final payment released.")}
            onAskAgain={() =>
              requestRelease(slug, { kind: "final", amount: Math.abs(balance), unit, note: balance >= 0 ? "Balance due to the seller." : "Refund due to the buyer." })
            }
          />
        </>
      ) : (
        <p className="locked">{t("Locked until the assay result is settled.")}</p>
      ),
    },
    {
      title: t("Evidence pack"),
      summary: t("Evidence pack ready"),
      status: stageStatus(finalDone, finalDone),
      body: finalDone ? (
        <>
          <ul className="pack">
            {evidencePack(lot).map((p) => (
              <li key={p.label}>
                <Mark status={p.status} />
                <span>{t(p.label)}</span>
                <span className={`word word-${p.status}`}>
                  {p.status === "verified" ? t("Included") : p.status === "partial" ? t("Incomplete") : t("Not available")}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn" disabled style={{ marginTop: 16, maxWidth: 320 }}>
            {t("Export for your bank")}
          </button>
          <p className="reserve-note">{t("Not connected in this demo.")}</p>
        </>
      ) : (
        <p className="locked">{t("Ready once the final payment is released.")}</p>
      ),
    },
  ];

  const firstOpen = stages.findIndex((x) => x.status !== "verified");
  const cur = firstOpen === -1 ? stages.length - 1 : firstOpen;

  const events: ChainEvent[] = [];
  const notices: Notice[] = [];
  let statement: StatementRow[] = [];
  const fee = (n: number) => n * (PLATFORM_FEE_PCT / 100);
  const names = (r: typeof prov) => (r ? r.sigs.map((x) => personName(x.personId)).join(" and ") : "");
  if (method === "usdt") {
    if (signed) events.push({ label: "Contract created with the locked terms", who: "Both sides signed", seed: "create" });
    if (deal.cx.wallet !== "none") events.push({ label: deal.cx.wallet === "ok" ? "Buyer wallet connected" : "Wallet connected", who: "Buyer", seed: "wallet" });
    if (deal.cx.screen === "passed") events.push({ label: "Wallet screening passed (demo)", who: "Automatic check, result logged", seed: "screen" });
    if (deal.cx.screen === "flagged") events.push({ label: "Wallet flagged, funds paused", who: "Sent to a named Compliance officer", seed: "flag" });
    const funded = deal.cx.pay === "confirmed";
    if (funded) events.push({ label: "Buyer funded the contract", who: "Buyer", seed: "fund" });
    if (provDone) events.push({ label: "Provisional payment released to the seller", who: `Signed by ${names(prov)}`, seed: "prov" });
    if (assayDone) events.push({ label: "Assay result recorded", who: `Signed by ${names(assay)}`, seed: "assay" });
    if (finalDone) events.push({ label: "Balance settled", who: `Signed by ${names(fin)}`, seed: "final" });

    if (funded) notices.push({ subject: "Funds received in escrow", body: `USDT ${Math.round(provisional).toLocaleString("en-GB")} confirmed. Approval needed to release.` });
    if (funded && !provDone) notices.push({ subject: "Approval needed: provisional release", body: "Two named people must sign in the back office." });
    if (provDone) notices.push({ subject: "Provisional payment released", body: `USDT ${Math.round(provisional).toLocaleString("en-GB")} sent to the seller.` });
    if (assayDone) notices.push({ subject: "Assay result recorded", body: `Final grade ${finalTa.toFixed(2)}% Ta2O5.` });
    if (assayDone && !finalDone) notices.push({ subject: "Approval needed: final release", body: "Two named people must sign in the back office." });
    if (finalDone) notices.push({ subject: "Deal complete", body: "Evidence pack and receipt are ready." });

    const topUp = finalDone && balance > 0 ? balance : 0;
    const refund = finalDone && balance < 0 ? -balance : 0;
    const paidIn = (funded ? provisional : 0) + topUp;
    const released = (provDone ? provisional : 0) + topUp;
    statement = [
      { label: "Paid into the contract", amount: paidIn },
      { label: "Released to the seller", amount: released },
      { label: "Refunded to the buyer", amount: refund },
      { label: "Still held by the contract", amount: Math.max(0, paidIn - released) },
      { label: "Platform fee (demo, charged at release)", amount: finalDone ? fee(finalValue) : provDone ? fee(provisional) : 0 },
    ];
  }

  return (
    <section className="review-desk" style={{ "--grade": GRADE_COLOUR[g.grade] } as CSSProperties}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href={routes.lots}>{t("All lots")}</a>
        <span aria-hidden="true">/</span>
        <a href={href(routes.lot, lot.slug)}>{t("Lot")} {lot.number}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("Deal")}</span>
      </nav>
      <h1>{t("Deal for lot {n}", { n: lot.number })}</h1>
      <p className="listing-intro">
        {t("Seven steps from reservation to evidence pack.")}
        <Hint>{t("Each step unlocks the next. Money moves only when named people in the back office approve it. You cannot approve your own payment.")}</Hint>
      </p>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={stages.length} aria-valuenow={cur + 1} aria-label={t("Deal progress")}>
        <p>{t("Step {n} of {m}: {title}", { n: cur + 1, m: stages.length, title: stages[cur].title })}</p>
        <div className="progress-bar" aria-hidden="true">
          {stages.map((_, i) => (
            <span key={i} className={i < cur ? "is-done" : i === cur ? "is-now" : ""} />
          ))}
        </div>
      </div>
      <p className="demo-role" role="note">
        {t("Demo: you are the buyer here. In the real product, approvals are done by separate named staff in the back office, so use the buttons marked Demo to switch view and play those people.")}
      </p>
      <div className={`deal-layout${method === "usdt" && signed ? " has-side" : ""}`}>
        <div className="deal-main">
          <ol className="stages">
            {stages.map((st, i) => (
              <li key={i} className={`stage stage-${st.status}${i < cur ? " is-done" : ""}`}>
                <Mark status={st.status} />
                {i < cur ? (
                  <details className="stage-fold">
                    <summary>
                      <span>{i + 1}. {st.title}</span>
                      <small>{st.summary}</small>
                    </summary>
                    <div>{st.body}</div>
                  </details>
                ) : (
                  <div>
                    <h2>
                      {i + 1}. {st.title}
                    </h2>
                    {st.body}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
        {method === "usdt" && signed && (
          <aside className="deal-side" aria-label={t("Smart contract escrow (simulated)")}>
            <ContractPanel lotNumber={lot.number} events={events} statement={statement} notices={notices} />
            {provDone && <SellerView amount={finalDone ? finalValue : provisional} final={finalDone} />}
            {finalDone && <Receipt lotNumber={lot.number} paid={finalValue} ta={finalTa} fee={fee(finalValue)} />}
          </aside>
        )}
      </div>
      <p className="reserve-note">
        <Term k="Back office">{t("What is the back office?")}</Term>
      </p>
      <button type="button" className="btn btn-quiet" style={{ width: "auto", marginTop: 24 }} onClick={() => resetDeal(slug)}>
        {t("Start the demo again")}
      </button>
    </section>
  );
}
