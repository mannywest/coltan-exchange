"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { computeGrade, evidencePack, type Lot, type Status } from "@/lib/grade";
import { GRADE_COLOUR } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import Mark from "./Mark";
import ContractPanel, { type ChainEvent, type Notice, type StatementRow } from "./ContractPanel";
import { SellerView, Receipt } from "./ContractExtras";
import UsdtFlow from "./UsdtFlow";
import SignPanel from "./SignPanel";
import { CX0, type Cx } from "@/lib/chainState";
import { PLATFORM_FEE_PCT } from "@/lib/price";
import { useT } from "./I18n";

const LB_PER_TONNE = 2204.62;
const TOLERANCE = 0.5; // demo rule, in Ta2O5 points
const PROVISIONAL = 0.8; // share of value paid on the pre-shipment assay

const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-US")}`;

export default function DealTracker({ lot, routes }: { lot: Lot; routes: Routes }) {
  const t = useT();
  const g = computeGrade(lot);
  const eligible = lot.review.status === "approved" && g.grade !== "Blocked";

  const independent = lot.assay.independentLab ?? lot.assay.sellerLab ?? lot.basisTa2O5;
  const [signed, setSigned] = useState(false);
  const [provApproved, setProvApproved] = useState(false);
  const [buyerLab, setBuyerLab] = useState(independent.toFixed(1));
  const [umpire, setUmpire] = useState("");
  const [finalApproved, setFinalApproved] = useState(false);
  const [approver, setApprover] = useState(false);
  const [method, setMethod] = useState<"bank" | "usdt">("bank");
  const [funded, setFunded] = useState(false);
  const [cx, setCxState] = useState<Cx>(CX0);
  const setCx = useCallback((p: Partial<Cx>) => setCxState((c) => ({ ...c, ...p })), []);

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

  const value = (ta: number) => lot.tonnes * LB_PER_TONNE * (ta / 100) * lot.priceUsdPerLb;
  const provisional = value(independent) * PROVISIONAL;

  const b = buyerLab.trim() === "" ? NaN : Number(buyerLab);
  const u = umpire.trim() === "" ? NaN : Number(umpire);
  const gap = Number.isNaN(b) ? NaN : Math.round(Math.abs(b - independent) * 10) / 10;
  const within = gap <= TOLERANCE;
  // COMPLIANCE: the settlement result follows fixed published rules, not a person's or AI's judgement.
  const finalTa = Number.isNaN(gap) ? NaN : within ? Math.round(((b + independent) / 2) * 100) / 100 : u;
  const assayDone = !Number.isNaN(finalTa);
  const finalValue = assayDone ? value(finalTa) : NaN;
  const balance = assayDone ? finalValue - provisional : NaN;

  type Stage = { title: string; status: Status; body: React.ReactNode };
  const stageStatus = (done: boolean, open: boolean): Status => (done ? "verified" : open ? "partial" : "missing");

  const stages: Stage[] = [
    {
      title: t("Reserve the lot"),
      status: "verified",
      body: <p>{t("Reserved for {n} hours. Nothing is paid yet.", { n: lot.holdHours })}</p>,
    },
    {
      title: t("Sign the locked terms"),
      status: stageStatus(signed, true),
      body: (
        <>
          <p>
            {t("{tonnes} tonnes, {basis}% Ta2O5 basis, {incoterm}, USD {price} per lb. Both sides must be cleared by screening first.", {
              tonnes: lot.tonnes, basis: lot.basisTa2O5, incoterm: lot.incoterm, price: lot.priceUsdPerLb,
            })}
          </p>
          {!signed && (
            <button type="button" className="btn btn-quiet" onClick={() => setSigned(true)}>
              {t("Sign terms (demo)")}
            </button>
          )}
        </>
      ),
    },
    {
      title: t("Provisional payment into escrow"),
      status: stageStatus(provApproved, signed),
      body: signed ? (
        <>
          <p>
            {t("{pct}% of the value on the independent assay ({ta}% Ta2O5): {amount}.", {
              pct: PROVISIONAL * 100, ta: independent.toFixed(1), amount: usd(provisional),
            })}
          </p>
          <p className="calc">
            {lot.tonnes} t x {LB_PER_TONNE.toLocaleString("en-US")} lb x {independent.toFixed(1)}% x USD {lot.priceUsdPerLb} x {PROVISIONAL * 100}%
          </p>
          {!provApproved && cx.wallet === "none" && !funded && (
            <fieldset className="method">
              <legend>{t("How will you pay?")}</legend>
              <label className="check-row">
                <input type="radio" name="method" checked={method === "bank"} onChange={() => setMethod("bank")} />
                <span>{t("Bank escrow with a regulated partner")}</span>
              </label>
              <label className="check-row">
                <input type="radio" name="method" checked={method === "usdt"} onChange={() => setMethod("usdt")} />
                <span>{t("USDT through a smart contract (simulated)")}</span>
              </label>
            </fieldset>
          )}
          {method === "usdt" && (
            <UsdtFlow
              lotNumber={lot.number}
              amount={provisional}
              cx={cx}
              setCx={setCx}
              provApproved={provApproved}
              onFunded={() => setFunded(true)}
              onReleased={() => { setProvApproved(true); setApprover(true); }}
            />
          )}
          {!provApproved && method === "bank" && (
            <>
              <label className="check-row">
                <input type="checkbox" checked={approver} onChange={(e) => setApprover(e.target.checked)} />
                <span>{t("I am the named approver for this release (demo)")}</span>
              </label>
              <button type="button" className="btn btn-quiet" disabled={!approver} onClick={() => setProvApproved(true)}>
                {t("Release provisional payment (demo)")}
              </button>
              <p className="reserve-note">{t("Escrow is held by a regulated partner, not connected in this demo. AI cannot release money.")}</p>
            </>
          )}
        </>
      ) : (
        <p className="locked">{t("Locked until the terms are signed.")}</p>
      ),
    },
    {
      title: t("Assay on arrival"),
      status: stageStatus(assayDone && provApproved, provApproved),
      body: provApproved ? (
        <>
          <label className="field" style={{ maxWidth: 260 }}>
            <span>{t("Buyer's lab result (% Ta2O5)")}</span>
            <input inputMode="decimal" value={buyerLab} onChange={(e) => setBuyerLab(e.target.value)} />
          </label>
          {!Number.isNaN(gap) &&
            (within ? (
              <p className="outcome ok">
                {t("Gap {gap} points, inside the {tol} point tolerance. The average is used: {ta}% Ta2O5.", {
                  gap: gap.toFixed(1), tol: TOLERANCE, ta: finalTa.toFixed(2),
                })}
              </p>
            ) : (
              <>
                <p className="outcome warn">
                  {t("Gap {gap} points, outside the {tol} point tolerance. The sealed umpire sample is opened and its result decides.", {
                    gap: gap.toFixed(1), tol: TOLERANCE,
                  })}
                </p>
                <label className="field" style={{ maxWidth: 260 }}>
                  <span>{t("Umpire lab result (% Ta2O5)")}</span>
                  <input inputMode="decimal" value={umpire} onChange={(e) => setUmpire(e.target.value)} />
                </label>
              </>
            ))}
          <p className="reserve-note">{t("Try 25.9 as the buyer's result to see the umpire step.")}</p>
        </>
      ) : (
        <p className="locked">{t("Locked until the provisional payment is released.")}</p>
      ),
    },
    {
      title: t("Final payment"),
      status: stageStatus(finalApproved, assayDone && provApproved),
      body:
        assayDone && provApproved ? (
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
            {!finalApproved && method === "usdt" && (
              <SignPanel
                title="Release the final payment"
                a={cx.fSigA}
                r={cx.fSigR}
                onSign={(who) => {
                  const next = { fSigA: who === "a" ? true : cx.fSigA, fSigR: who === "r" ? true : cx.fSigR };
                  setCx(next);
                  if (next.fSigA && next.fSigR) setFinalApproved(true);
                }}
              />
            )}
            {!finalApproved && method === "bank" && (
              <button type="button" className="btn btn-quiet" disabled={!approver} onClick={() => setFinalApproved(true)}>
                {t("Release final payment (demo)")}
              </button>
            )}
            {method === "bank" && !approver && !finalApproved && (
              <p className="reserve-note">{t("Tick the named approver box in the provisional payment step first.")}</p>
            )}
          </>
        ) : (
          <p className="locked">{t("Locked until the assay result is settled.")}</p>
        ),
    },
    {
      title: t("Evidence pack"),
      status: stageStatus(finalApproved, finalApproved),
      body: finalApproved ? (
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

  const events: ChainEvent[] = [];
  const notices: Notice[] = [];
  let statement: StatementRow[] = [];
  const fee = (n: number) => n * (PLATFORM_FEE_PCT / 100);
  if (method === "usdt") {
    if (signed) events.push({ label: "Contract created with the locked terms", who: "Both sides signed", seed: "create" });
    if (cx.wallet !== "none") events.push({ label: cx.wallet === "ok" ? "Buyer wallet connected" : "Wallet connected", who: "Buyer", seed: "wallet" });
    if (cx.screen === "passed") events.push({ label: "Wallet screening passed (demo)", who: "Automatic check, result logged", seed: "screen" });
    if (cx.screen === "flagged") events.push({ label: "Wallet flagged, funds paused", who: "Sent to a named Compliance officer", seed: "flag" });
    if (funded) events.push({ label: "Buyer funded the contract", who: "Buyer", seed: "fund" });
    if (provApproved) events.push({ label: "Provisional payment released to the seller", who: "2 of 2 named people signed", seed: "prov" });
    if (assayDone && provApproved) events.push({ label: "Assay result recorded", who: "Named Reviewer entered it", seed: "assay" });
    if (finalApproved) events.push({ label: "Balance settled", who: "2 of 2 named people signed", seed: "final" });

    if (funded) notices.push({ subject: "Funds received in escrow", body: `${Math.round(provisional).toLocaleString("en-GB")} USDT confirmed. Approval needed to release.` });
    if (funded && !provApproved) notices.push({ subject: "Approval needed: provisional release", body: "Two named people must sign." });
    if (provApproved) notices.push({ subject: "Provisional payment released", body: `${Math.round(provisional).toLocaleString("en-GB")} USDT sent to the seller.` });
    if (assayDone && provApproved) notices.push({ subject: "Assay result recorded", body: `Final grade ${finalTa.toFixed(2)}% Ta2O5.` });
    if (assayDone && provApproved && !finalApproved) notices.push({ subject: "Approval needed: final release", body: "Two named people must sign." });
    if (finalApproved) notices.push({ subject: "Deal complete", body: "Evidence pack and receipt are ready." });

    const topUp = finalApproved && balance > 0 ? balance : 0;
    const refund = finalApproved && balance < 0 ? -balance : 0;
    const paidIn = (funded ? provisional : 0) + topUp;
    const released = (provApproved ? provisional : 0) + topUp;
    statement = [
      { label: "Paid into the contract", amount: paidIn },
      { label: "Released to the seller", amount: released },
      { label: "Refunded to the buyer", amount: refund },
      { label: "Still held by the contract", amount: Math.max(0, paidIn - released) },
      { label: "Platform fee (demo, charged at release)", amount: finalApproved ? fee(finalValue) : provApproved ? fee(provisional) : 0 },
    ];
  }

  function restart() {
    setSigned(false); setProvApproved(false); setFinalApproved(false); setApprover(false);
    setBuyerLab(independent.toFixed(1)); setUmpire(""); setMethod("bank"); setFunded(false); setCxState(CX0);
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
        {t("Six steps from reservation to evidence pack. Each step unlocks the next. Money moves only when a named person approves.")}
      </p>
      <ol className="stages">
        {stages.map((s, i) => (
          <li key={i} className={`stage stage-${s.status}`}>
            <Mark status={s.status} />
            <div>
              <h2>
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </div>
          </li>
        ))}
      </ol>
      {method === "usdt" && signed && <ContractPanel lotNumber={lot.number} events={events} statement={statement} notices={notices} />}
      {method === "usdt" && provApproved && (
        <SellerView amount={finalApproved ? finalValue : provisional} final={finalApproved} />
      )}
      {method === "usdt" && finalApproved && (
        <Receipt lotNumber={lot.number} paid={finalValue} ta={finalTa} fee={fee(finalValue)} />
      )}
      <button type="button" className="btn btn-quiet" style={{ width: "auto", marginTop: 24 }} onClick={restart}>
        {t("Start the demo again")}
      </button>
    </section>
  );
}
