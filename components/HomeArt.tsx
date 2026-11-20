"use client";

import { fieldEstimate, type Grade, type Lot } from "@/lib/grade";
import { useT } from "./I18n";

// A small assay chart for a lot: three readings on a 22 to 28 percent Ta2O5 scale,
// with the price basis marked. Readings that are not on file show as empty rings.
export function AssayStrip({ lot, grade }: { lot: Lot; grade: Grade }) {
  const t = useT();
  const x = (v: number) => 12 + ((Math.min(28, Math.max(22, v)) - 22) / 6) * 276;
  const reads: { v: number | null; label: string; kind: "field" | "seller" | "indep" }[] = [
    { v: fieldEstimate(lot), label: "Field handheld", kind: "field" },
    { v: lot.assay.sellerLab, label: "Seller's lab", kind: "seller" },
    { v: lot.assay.independentLab, label: "Independent lab", kind: "indep" },
  ];
  const blocked = grade === "Blocked";
  return (
    <svg
      viewBox="0 0 300 58"
      className={`assay-strip${blocked ? " is-blocked" : ""}`}
      role="img"
      aria-label={t("Assay readings, % Ta2O5")}
    >
      <line x1="12" y1="26" x2="288" y2="26" stroke="var(--line)" strokeWidth="2" />
      {[22, 25, 28].map((n) => (
        <g key={n}>
          <line x1={x(n)} y1="20" x2={x(n)} y2="32" stroke="var(--faint)" />
          <text x={x(n)} y="52" textAnchor="middle" fontSize="11" fill="var(--faint)">
            {n}
          </text>
        </g>
      ))}
      <line x1={x(lot.basisTa2O5)} y1="10" x2={x(lot.basisTa2O5)} y2="42" stroke="var(--paper)" strokeWidth="2" />
      {reads.map((r) =>
        r.v == null ? null : (
          <circle
            key={r.kind}
            cx={x(r.v)}
            cy="26"
            r="6"
            fill={r.kind === "indep" ? "var(--grade)" : r.kind === "seller" ? "var(--muted)" : "var(--ink)"}
            stroke={r.kind === "field" ? "var(--grade)" : "var(--ink)"}
            strokeWidth="2"
          >
            <title>{`${t(r.label)}: ${r.v}%`}</title>
          </circle>
        ),
      )}
    </svg>
  );
}
