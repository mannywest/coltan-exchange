"use client";

import { useState } from "react";
import { openDeal, releaseReservation, useStore } from "@/lib/dealStore";
import { useT } from "./I18n";
import { PLATFORM_FEE_PCT, PROVISIONAL_SHARE } from "@/lib/price";

type Props = {
  slug: string;
  lotNumber: string;
  gradeC?: boolean;
  provisionalPerTonne?: number;
  holdHours: number;
  blockedReason?: string;
  dealHref?: string;
  clearHref?: string;
  quantity?: { tonnes: number; min: number; perTonne: number };
};

// COMPLIANCE: reserving never releases money or clears a counterparty.
// Counterparty screening is planned for a later phase and is not part of this flow yet.
// Escrow release needs a named human approver. Here those steps are stubs.
const NEXT_STEPS = [
  "Locked terms are signed by both sides",
  "Funds go into escrow with a regulated partner",
  "Named people in the back office release each payment",
];

export default function ReservePanel({ slug, lotNumber, gradeC, holdHours, blockedReason, dealHref, quantity }: Props) {
  const t = useT();
  const store = useStore();
  const reserved = Boolean(store.deals[slug]);
  const [text, setText] = useState<string>(String(quantity?.tonnes ?? ""));
  const parsed = text.trim() === "" ? NaN : Number(text);
  const qtyError = !quantity
    ? null
    : Number.isNaN(parsed)
      ? t("Enter a number of tonnes.")
      : parsed < quantity.min
        ? t("The minimum is {n} tonnes.", { n: quantity.min })
        : parsed > quantity.tonnes
          ? t("Only {n} tonnes are available.", { n: quantity.tonnes })
          : null;
  const qty = qtyError || Number.isNaN(parsed) ? (quantity?.tonnes ?? 0) : parsed;
  const estimate = quantity ? { total: qty * quantity.perTonne, provisional: qty * quantity.perTonne * PROVISIONAL_SHARE } : undefined;
  const fee = estimate ? estimate.total * (PLATFORM_FEE_PCT / 100) : 0;

  if (blockedReason) {
    return (
      <div className="reserve is-blocked" role="status">
        <button type="button" className="btn" disabled>
          {t("Reserve this lot")}
        </button>
        <p className="reserve-note">{blockedReason}</p>
      </div>
    );
  }

  if (reserved) {
    return (
      <div className="reserve is-reserved" role="status" aria-live="polite">
        <p className="reserved-title">{t("Reserved for {n} hours (demo)", { n: holdHours })}</p>
        <p className="reserve-note">{t("{n} tonnes requested.", { n: store.deals[slug].qty })}</p>
        <p className="reserve-note">
          {t("Lot {n} is held for you. Before any money moves:", { n: lotNumber })}
        </p>
        {store.deals[slug].qty < (quantity?.tonnes ?? 0) && (
          // COMPLIANCE: a part-lot request is a human step. The seller must agree; nothing is automatic.
          <p className="reserve-note">{t("You asked for {n} tonnes. The seller must agree to a part-lot sale.", { n: store.deals[slug].qty })}</p>
        )}
        <ul className="steps">
          {NEXT_STEPS.map((s) => (
            <li key={s}>
              <span>{t(s)}</span>
              <span className="stub">{t("Later")}</span>
            </li>
          ))}
        </ul>
        {dealHref && (
          <a className="btn btn-link" href={dealHref}>
            {t("Continue to the deal")}
          </a>
        )}
        <button type="button" className="btn btn-quiet" onClick={() => releaseReservation(slug)}>
          {t("Release reservation")}
        </button>
      </div>
    );
  }

  const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-GB")}`;
  return (
    <div className="reserve">
      {quantity && (
        <div className="qty">
          <label htmlFor="qty-input">{t("Quantity you want (tonnes)")}</label>
          <div className="qty-row">
            <input
              id="qty-input"
              type="number"
              inputMode="decimal"
              min={quantity.min}
              max={quantity.tonnes}
              step={0.5}
              value={text}
              aria-invalid={qtyError ? true : undefined}
              aria-describedby={qtyError ? "qty-error" : undefined}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="button" className="btn btn-quiet" onClick={() => setText(String(quantity.tonnes))}>
              {t("Whole lot")}
            </button>
          </div>
          {qtyError && (
            <p className="field-error" id="qty-error" role="alert">
              {qtyError}
            </p>
          )}
          <small>{t("Between {min} and {max} tonnes. Less than the whole lot needs the seller's agreement.", { min: quantity.min, max: quantity.tonnes })}</small>
        </div>
      )}
      {estimate && (
        <p className="est-money">
          <span>{t("Estimated total")}</span>
          <strong>{usd(estimate.total)}</strong>
          <small>
            {t("{amount} goes into escrow first. Estimate: the final grade is set by the arrival assay.", {
              amount: usd(estimate.provisional),
            })}
          </small>
          {/* COMPLIANCE: fee and payment figures are demo only. Money moves through a regulated escrow partner, never the platform. */}
          <small>{t("Platform fee (demo): {amount}, charged only when payment is released.", { amount: usd(fee) })}</small>
        </p>
      )}
      {gradeC && (
        <p className="outcome warn">
          {t("Grade C: only 2 of 6 checks are verified. A named Compliance officer must allow you to continue before you can sign terms.")}
        </p>
      )}
      <button type="button" className="btn" disabled={Boolean(qtyError)} onClick={() => openDeal(slug, lotNumber, qty, Boolean(gradeC))}>
        {t("Reserve this lot")}
      </button>
      <p className="reserve-note">
        {t("Holds the lot for {n} hours. You pay nothing now. Payment goes through a regulated escrow partner, which this demo does not connect.", { n: holdHours })}{" "}
        {t("At the deal step you can also try paying in USDT through a simulated smart contract.")}
      </p>
    </div>
  );
}
