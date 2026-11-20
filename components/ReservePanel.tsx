"use client";

import { useState } from "react";
import { useRole, useT } from "./I18n";

type Props = {
  lotNumber: string;
  holdHours: number;
  blockedReason?: string;
  dealHref?: string;
  clearHref?: string;
};

// COMPLIANCE: reserving never releases money or clears a counterparty.
// In the real product, both sides must pass screening before terms are signed,
// and escrow release needs a named human approver. Here those steps are stubs.
const NEXT_STEPS = [
  "Both sides are cleared by screening",
  "Locked terms are signed",
  "Funds go into escrow with a regulated partner",
  "A named approver releases payment after final assay",
];

export default function ReservePanel({ lotNumber, holdHours, blockedReason, dealHref, clearHref }: Props) {
  const t = useT();
  const { cleared, setCleared } = useRole();
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

  // COMPLIANCE: nobody reserves before counterparty screening. The skip button is a demo shortcut only.
  if (!cleared) {
    return (
      <div className="reserve">
        <a className="btn btn-link" href={clearHref}>
          {t("Get cleared to reserve")}
        </a>
        <p className="reserve-note">{t("Every buyer is screened before they can reserve a lot.")}</p>
        <button type="button" className="btn btn-quiet" onClick={() => setCleared(true)}>
          {t("Demo: continue as a cleared buyer")}
        </button>
      </div>
    );
  }

  return (
    <div className="reserve">
      <button type="button" className="btn" onClick={() => setReserved(true)}>
        {t("Reserve this lot")}
      </button>
      <p className="reserve-note">
        {t("Holds the lot for {n} hours. You pay nothing now. Payment goes through a regulated escrow partner, which this demo does not connect.", { n: holdHours })}
      </p>
    </div>
  );
}
