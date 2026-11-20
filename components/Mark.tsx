import type { Lot, Status } from "@/lib/grade";
import { CHECK_ORDER } from "@/lib/grade";

export default function Mark({ status }: { status: Status }) {
  return (
    <svg
      className={`mark mark-${status}`}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <circle className="mark-ring" cx="10" cy="10" r="8.5" />
      {status === "verified" && <path className="tick" d="M5.8 10.4l2.9 2.9 5.5-6" />}
      {status === "partial" && <path className="half" d="M10 1.5a8.5 8.5 0 0 1 0 17z" />}
      {status === "failed" && <path className="cross" d="M6.5 6.5l7 7M13.5 6.5l-7 7" />}
    </svg>
  );
}

// Six small blocks, one per evidence check, so a row shows its evidence at a glance.
export function Meter({ lot }: { lot: Lot }) {
  const items = CHECK_ORDER.map((k) => lot.evidence[k].status);
  const n = items.filter((s) => s === "verified").length;
  return (
    <span className="meter" role="img" aria-label={`${n} of 6 checks verified`}>
      {items.map((s, i) => (
        <i key={i} className={`m-${s}`} />
      ))}
      <b>{n} of 6</b>
    </span>
  );
}
