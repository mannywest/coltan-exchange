"use client";

import { useState } from "react";

type Props = {
  lotNumber: string;
  holdHours: number;
  blockedReason?: string;
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

export default function ReservePanel({ lotNumber, holdHours, blockedReason }: Props) {
  const [reserved, setReserved] = useState(false);

  if (blockedReason) {
    return (
      <div className="reserve is-blocked" role="status">
        <button type="button" className="btn" disabled>
          Reserve this lot
        </button>
        <p className="reserve-note">{blockedReason}</p>
      </div>
    );
  }

  if (reserved) {
    return (
      <div className="reserve is-reserved" role="status" aria-live="polite">
        <p className="reserved-title">Reserved for {holdHours} hours (demo)</p>
        <p className="reserve-note">
          Lot {lotNumber} is held for you. Before any money moves:
        </p>
        <ul className="steps">
          {NEXT_STEPS.map((s) => (
            <li key={s}>
              <span>{s}</span>
              <span className="stub">Not connected</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-quiet" onClick={() => setReserved(false)}>
          Release reservation
        </button>
      </div>
    );
  }

  return (
    <div className="reserve">
      <button type="button" className="btn" onClick={() => setReserved(true)}>
        Reserve this lot
      </button>
      <p className="reserve-note">
        Holds the lot for {holdHours} hours. You pay nothing now. Payment goes through a
        regulated escrow partner, which this demo does not connect.
      </p>
    </div>
  );
}
