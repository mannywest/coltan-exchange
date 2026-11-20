"use client";

import { useState, type CSSProperties } from "react";
import { computeGrade, evidencePack, type Lot, type Status } from "@/lib/grade";
import { GRADE_COLOUR } from "@/lib/ui";
import { href, type Routes } from "@/lib/routes";
import Mark from "./Mark";
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
          {!provApproved && (
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
            {!finalApproved && (
              <button type="button" className="btn btn-quiet" disabled={!approver} onClick={() => setFinalApproved(true)}>
                {t("Release final payment (demo)")}
              </button>
            )}
            {!approver && !finalApproved && (
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

  function restart() {
    setSigned(false); setProvApproved(false); setFinalApproved(false); setApprover(false);
    setBuyerLab(independent.toFixed(1)); setUmpire("");
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
      <button type="button" className="btn btn-quiet" style={{ width: "auto", marginTop: 24 }} onClick={restart}>
        {t("Start the demo again")}
      </button>
    </section>
  );
}
