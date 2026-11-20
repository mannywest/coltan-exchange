"use client";

import { useState } from "react";
import { useT } from "./I18n";
import { PLATFORM_FEE_PCT, PROVISIONAL_SHARE } from "@/lib/price";

type Props = {
  lotNumber: string;
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
  "Locked terms are signed",
  "Funds go into escrow with a regulated partner",
  "A named approver releases payment after final assay",
];

export default function ReservePanel({ lotNumber, holdHours, blockedReason, dealHref, quantity }: Props) {
  const t = useT();
  const [reserved, setReserved] = useState(false);
  const [qty, setQty] = useState<number>(quantity?.tonnes ?? 0);
  const estimate = quantity ? { total: qty * quantity.perTonne, provisional: qty * quantity.perTonne * PROVISIONAL_SHARE } : undefined;
  const fee = estimate ? estimate.total * (PLATFORM_FEE_PCT / 100) : 0;
  const partial = quantity ? qty < quantity.tonnes : false;

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
        <p className="reserve-note">
          {t("Lot {n} is held for you. Before any money moves:", { n: lotNumber })}
        </p>
        {partial && (
          // COMPLIANCE: a part-lot request is a human step. The seller must agree; nothing is automatic.
          <p className="reserve-note">{t("You asked for {n} tonnes. The seller must agree to a part-lot sale.", { n: qty })}</p>
        )}
        <ul className="steps">
          {NEXT_STEPS.map((s) => (
            <li key={s}>
              <span>{t(s)}</span>
              <span className="stub">{t("Not connected")}</span>
            </li>
          ))}
        </ul>
        {dealHref && (
          <a className="btn btn-link" href={dealHref}>
            {t("Continue to the deal")}
          </a>
        )}
        <button type="button" className="btn btn-quiet" onClick={() => setReserved(false)}>
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
              value={qty}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setQty(Number.isFinite(v) ? Math.min(quantity.tonnes, Math.max(quantity.min, v)) : quantity.tonnes);
              }}
            />
            <button type="button" className="btn btn-quiet" onClick={() => setQty(quantity.tonnes)}>
              {t("Whole lot")}
            </button>
          </div>
          <small>{t("Between {min} and {max} tonnes. Less than the whole lot needs the seller's agreement.", { min: quantity.min, max: quantity.tonnes })}</small>
        </div>
      )}
      {estimate && (
        <p className="est-money">
          <span>{t("Estimated total")}</span>
          <strong>{usd(estimate.total)}</strong>
          <small>
            {t("{amount} goes into escrow after you sign terms. Estimate until the lab confirms the grade.", {
              amount: usd(estimate.provisional),
            })}
          </small>
          {/* COMPLIANCE: fee and payment figures are demo only. Money moves through a regulated escrow partner, never the platform. */}
          <small>{t("Platform fee (demo): {amount}, charged only when payment is released.", { amount: usd(fee) })}</small>
        </p>
      )}
      <button type="button" className="btn" onClick={() => setReserved(true)}>
        {t("Reserve this lot")}
      </button>
      <p className="reserve-note">
        {t("Holds the lot for {n} hours. You pay nothing now. Payment goes through a regulated escrow partner, which this demo does not connect.", { n: holdHours })}{" "}
        {t("At the deal step you can also try paying in USDT through a simulated smart contract.")}
      </p>
    </div>
  );
}
