"use client";

import { useState } from "react";
import { useT } from "./I18n";

type Props = {
  lotNumber: string;
  holdHours: number;
  blockedReason?: string;
  dealHref?: string;
  clearHref?: string;
  estimate?: { total: number; provisional: number };
};

// COMPLIANCE: reserving never releases money or clears a counterparty.
// Counterparty screening is planned for a later phase and is not part of this flow yet.
// Escrow release needs a named human approver. Here those steps are stubs.
const NEXT_STEPS = [
  "Locked terms are signed",
  "Funds go into escrow with a regulated partner",
  "A named approver releases payment after final assay",
];

export default function ReservePanel({ lotNumber, holdHours, blockedReason, dealHref, estimate }: Props) {
  const t = useT();
  const [reserved, setReserved] = useState(false);

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
      {estimate && (
        <p className="est-money">
          <span>{t("Estimated total")}</span>
          <strong>{usd(estimate.total)}</strong>
          <small>
            {t("{amount} goes into escrow after you sign terms. Estimate until the lab confirms the grade.", {
              amount: usd(estimate.provisional),
            })}
          </small>
        </p>
      )}
      <button type="button" className="btn" onClick={() => setReserved(true)}>
        {t("Reserve this lot")}
      </button>
      <p className="reserve-note">
        {t("Holds the lot for {n} hours. You pay nothing now. Payment goes through a regulated escrow partner, which this demo does not connect.", { n: holdHours })}
      </p>
    </div>
  );
}
