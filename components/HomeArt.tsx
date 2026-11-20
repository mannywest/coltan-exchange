"use client";

import { assayVerdict, fieldEstimate, ASSAY_TOLERANCE, type Grade, type Lot } from "@/lib/grade";
import { useT } from "./I18n";

const MIN = 22;
const MAX = 28;

type Reading = { v: number | null; label: string; kind: "field" | "seller" | "indep" };

function readings(lot: Lot): Reading[] {
  return [
    { v: fieldEstimate(lot), label: "Field handheld", kind: "field" },
    { v: lot.assay.sellerLab, label: "Seller's lab", kind: "seller" },
    { v: lot.assay.independentLab, label: "Independent lab", kind: "indep" },
  ];
}

// One plain sentence on whether the two labs agree. Fixed rule: inside 0.5 points they agree.
export function AssayVerdict({ lot }: { lot: Lot }) {
  const t = useT();
  const v = assayVerdict(lot);
  const text =
    v.key === "agree"
      ? t("Both labs agree: {g} points apart, limit {l}.", { g: v.gap.toFixed(1), l: ASSAY_TOLERANCE })
      : v.key === "apart"
        ? t("Labs are {g} points apart, limit {l}. The umpire lab decides.", { g: v.gap.toFixed(1), l: ASSAY_TOLERANCE })
        : v.key === "waitIndep"
          ? t("Waiting for the second lab result.")
          : t("No lab result on file yet.");
  return <span className={`assay-verdict is-${v.tone}`}>{text}</span>;
}

// Assay chart: readings on a 22 to 28 percent Ta2O5 scale, the price basis marked, and a shaded
// range around the independent lab result showing how far the seller's lab may sit from it.
// "compact" is for cards; "full" adds value labels and bigger type for the lot page.
export function AssayStrip({
  lot,
  grade,
  variant = "compact",
}: {
  lot: Lot;
  grade: Grade;
  variant?: "compact" | "full";
}) {
  const t = useT();
  const full = variant === "full";
  const W = full ? 340 : 300;
  const pad = full ? 14 : 12;
  const axisY = full ? 52 : 26;
  const x = (v: number) => pad + ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * (W - pad * 2);
  const reads = readings(lot);
  const indep = lot.assay.independentLab;
  const blocked = grade === "Blocked";
  const inBand = (v: number) => indep !== null && Math.abs(v - indep) <= ASSAY_TOLERANCE + 1e-9;
  const shown = reads.filter((r): r is Reading & { v: number } => r.v != null).sort((a, b) => a.v - b.v);
  const H = full ? 96 : 58;
  const tick = full ? 11 : 11;
  const ticks = full ? [22, 23, 24, 25, 26, 27, 28] : [22, 25, 28];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`assay-strip is-${variant}${blocked ? " is-blocked" : ""}`}
      role="img"
      aria-label={t("Assay readings, % Ta2O5")}
    >
      {indep !== null && (
        <rect
          x={x(indep - ASSAY_TOLERANCE)}
          y={axisY - (full ? 15 : 11)}
          width={x(indep + ASSAY_TOLERANCE) - x(indep - ASSAY_TOLERANCE)}
          height={full ? 30 : 22}
          fill="var(--grade)"
          opacity="0.22"
          stroke="var(--grade)"
          strokeDasharray="3 2"
        />
      )}
      <line x1={pad} y1={axisY} x2={W - pad} y2={axisY} stroke="var(--line)" strokeWidth="2" />
      {ticks.map((n) => (
        <g key={n}>
          <line x1={x(n)} y1={axisY - 6} x2={x(n)} y2={axisY + 6} stroke="var(--faint)" />
          <text x={x(n)} y={H - 4} textAnchor="middle" fontSize={tick} fill="var(--faint)">
            {n}
          </text>
        </g>
      ))}
      <line
        x1={x(lot.basisTa2O5)}
        y1={full ? 20 : 10}
        x2={x(lot.basisTa2O5)}
        y2={axisY + (full ? 22 : 16)}
        stroke="var(--paper)"
        strokeWidth="2"
      />
      {full && (
        <text x={x(lot.basisTa2O5)} y="13" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--paper)">
          {t("Selling grade {n}", { n: lot.basisTa2O5 })}
        </text>
      )}
      {shown.map((r) => {
        const estimate = r.kind === "field";
        const off = !estimate && indep !== null && !inBand(r.v);
        const colour = off ? "var(--amber)" : r.kind === "indep" ? "var(--grade)" : "var(--paper)";
        return (
          <g key={r.kind}>
            <circle
              cx={x(r.v)}
              cy={axisY}
              r={full ? 8 : 6}
              fill={estimate ? "none" : colour}
              stroke={estimate ? "var(--grade)" : off ? "var(--amber)" : "var(--paper)"}
              strokeWidth="2.5"
            >
              <title>{`${t(r.label)}: ${r.v}%`}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

// Key to the dots on the full chart: the same marker, a name and the figure.
export function AssayLegend({ lot }: { lot: Lot }) {
  const t = useT();
  const indep = lot.assay.independentLab;
  return (
    <ul className="assay-legend">
      {readings(lot).map((r) => {
        const off = r.kind !== "field" && r.v != null && indep !== null && Math.abs(r.v - indep) > ASSAY_TOLERANCE + 1e-9;
        return (
          <li key={r.kind}>
            <i className={`dot dot-${r.kind}${off ? " is-off" : ""}`} aria-hidden="true" />
            <span>{t(r.label)}</span>
            <b>{r.v == null ? t("None") : r.v.toFixed(1)}</b>
            {r.kind === "field" && <small>{t("estimate")}</small>}
          </li>
        );
      })}
      {indep !== null && (
        <li>
          <i className="dot dot-band" aria-hidden="true" />
          <span>{t("Allowed range around the independent lab")}</span>
        </li>
      )}
    </ul>
  );
}
