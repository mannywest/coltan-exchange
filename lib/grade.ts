// The "kitchen decides" part: the grade is computed by fixed rules from the evidence.
// AI never sets a grade, approves a lot or changes a mine tier.

export type Status = "verified" | "partial" | "missing" | "failed";
export type Grade = "A" | "B" | "C" | "Blocked";
export type Tier = "Blocked" | "Unverified" | "Watch" | "Verified";
export type CheckId =
  | "sampling"
  | "assay"
  | "custody"
  | "screening"
  | "crosschecks"
  | "site";

export const CHECK_ORDER: CheckId[] = [
  "sampling",
  "assay",
  "custody",
  "screening",
  "crosschecks",
  "site",
];

export const CHECK_LABELS: Record<CheckId, string> = {
  sampling: "Independent sampling",
  assay: "Certificate of analysis",
  custody: "Sealed custody log",
  screening: "Counterparty screening",
  crosschecks: "Origin cross-checks",
  site: "Independent site evidence",
};

export const STATUS_WORD: Record<Status, string> = {
  verified: "Verified",
  partial: "Partial",
  missing: "Missing",
  failed: "Failed",
};

export type Evidence = { status: Status; detail: string; source: string };

export type Lot = {
  slug: string;
  number: string;
  tonnes: number;
  basisTa2O5: number;
  incoterm: string;
  priceUsdPerLb: number;
  holdHours: number;
  sellerAlias: string;
  mine: { name: string; tier: Tier };
  evidence: Record<CheckId, Evidence>;
  assay: {
    fieldTa: number;
    factor: number;
    sellerLab: number | null;
    independentLab: number | null;
    toleranceCheck: string;
  };
  custody: {
    at: string;
    action: string;
    place: string;
    by: string;
    flag?: string;
  }[];
  screening: { party: string; status: Status; note: string }[];
  lastScreened: string;
  review: {
    status: "approved" | "pending" | "rejected";
    by: string;
    at: string;
    note?: string;
  };
};

export const TIER_NOTES: Record<Tier, string> = {
  Blocked:
    "Controlled or taxed by armed groups or designated parties. Lots from here cannot be traded.",
  Unverified:
    "Listed, but ownership, site and route are not independently checked. Not tradable until verified.",
  Watch:
    "Verified, with new risk signals. Tradable only with a named reviewer's approval.",
  Verified:
    "Ownership, site, labour conditions and route have been independently checked and documented.",
};

export function fieldEstimate(lot: Lot): number {
  return Math.round(lot.assay.fieldTa * lot.assay.factor * 10) / 10;
}

export function assaySpread(lot: Lot): number | null {
  const v = [fieldEstimate(lot), lot.assay.sellerLab, lot.assay.independentLab].filter(
    (x): x is number => typeof x === "number"
  );
  // Compare the two lab results only; the handheld figure is an estimate.
  const labs = [lot.assay.sellerLab, lot.assay.independentLab].filter(
    (x): x is number => typeof x === "number"
  );
  if (labs.length < 2 || v.length < 2) return null;
  return Math.round(Math.abs(labs[0] - labs[1]) * 10) / 10;
}

export function computeGrade(lot: Lot): {
  grade: Grade;
  reasons: string[];
  verified: number;
} {
  const entries = CHECK_ORDER.map((k) => [k, lot.evidence[k]] as const);
  const verified = entries.filter(([, e]) => e.status === "verified").length;
  const failed = entries.filter(([, e]) => e.status === "failed");
  const notVerified = entries.filter(([, e]) => e.status !== "verified");

  // COMPLIANCE: hard blocks. A failed screening or a Blocked mine can never be traded,
  // whatever else the evidence says.
  if (lot.mine.tier === "Blocked") {
    return {
      grade: "Blocked",
      verified,
      reasons: [
        "The source mine is in the Blocked tier, so this lot cannot be traded.",
      ],
    };
  }
  if (lot.evidence.screening.status === "failed") {
    return {
      grade: "Blocked",
      verified,
      reasons: [
        "A party on this lot failed sanctions screening, so this lot cannot be traded.",
      ],
    };
  }

  const list = (xs: readonly (readonly [CheckId, Evidence])[]) =>
    xs.map(([k]) => CHECK_LABELS[k].toLowerCase()).join(", ");

  if (verified === 6 && lot.mine.tier === "Verified") {
    return {
      grade: "A",
      verified,
      reasons: [
        "All six evidence checks are verified, including independent site evidence.",
      ],
    };
  }
  if (verified >= 4 && failed.length === 0) {
    return {
      grade: "B",
      verified,
      reasons: [
        `${verified} of 6 evidence checks are verified. Still open: ${list(notVerified)}.`,
      ],
    };
  }
  return {
    grade: "C",
    verified,
    reasons: [
      `Only ${verified} of 6 evidence checks are verified. Still open: ${list(notVerified)}.`,
    ],
  };
}
