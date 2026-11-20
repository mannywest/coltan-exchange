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
  cross: [Status, string][];
  caseNote?: string;
  aiSummary?: string;
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

export type ReasonKey =
  | "The source mine is in the Blocked tier, so this lot cannot be traded."
  | "A party on this lot failed sanctions screening, so this lot cannot be traded."
  | "All six evidence checks are verified, including independent site evidence."
  | "{n} of 6 evidence checks are verified. Still open: {list}."
  | "Only {n} of 6 evidence checks are verified. Still open: {list}.";

export function computeGrade(lot: Lot): {
  grade: Grade;
  reasons: string[];
  verified: number;
  reasonKey: ReasonKey;
  open: CheckId[];
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
      reasonKey: "The source mine is in the Blocked tier, so this lot cannot be traded.",
      open: [],
      reasons: [
        "The source mine is in the Blocked tier, so this lot cannot be traded.",
      ],
    };
  }
  if (lot.evidence.screening.status === "failed") {
    return {
      grade: "Blocked",
      verified,
      reasonKey: "A party on this lot failed sanctions screening, so this lot cannot be traded.",
      open: [],
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
      reasonKey: "All six evidence checks are verified, including independent site evidence.",
      open: [],
      reasons: [
        "All six evidence checks are verified, including independent site evidence.",
      ],
    };
  }
  if (verified >= 4 && failed.length === 0) {
    return {
      grade: "B",
      verified,
      reasonKey: "{n} of 6 evidence checks are verified. Still open: {list}.",
      open: notVerified.map(([k]) => k),
      reasons: [
        `${verified} of 6 evidence checks are verified. Still open: ${list(notVerified)}.`,
      ],
    };
  }
  return {
    grade: "C",
    verified,
    reasonKey: "Only {n} of 6 evidence checks are verified. Still open: {list}.",
    open: notVerified.map(([k]) => k),
    reasons: [
      `Only ${verified} of 6 evidence checks are verified. Still open: ${list(notVerified)}.`,
    ],
  };
}

// ---------- Origin cross-checks (the trust check screen) ----------

export const CROSS_META = [
  { id: "geo", label: "Location and boundaries", what: "Pin and photos checked against the mine's recorded boundary and known conflict areas." },
  { id: "volume", label: "Volume sanity", what: "Reported output compared with what this mine and its crew can plausibly produce." },
  { id: "chemistry", label: "Assay profile", what: "Niobium, uranium, tin and other lines compared with this mine's earlier lots." },
  { id: "route", label: "Route and timing", what: "Transport log checked against realistic journey times and known mixing points." },
  { id: "price", label: "Price", what: "Price compared with the market range. Far below it is a warning sign." },
  { id: "people", label: "People", what: "Owners, transporters and exporters checked for sanctions and adverse media." },
  { id: "track", label: "Track record", what: "How this seller and mine have performed on earlier lots." },
] as const;

export const CROSS_WORD: Record<Status, string> = {
  verified: "Passed",
  partial: "Look closer",
  missing: "Not run",
  failed: "Failed",
};

export function crossSummary(lot: Lot) {
  const n = (s: Status) => lot.cross.filter(([x]) => x === s).length;
  return { total: lot.cross.length, passed: n("verified"), look: n("partial"), notRun: n("missing"), failed: n("failed") };
}

export function evidencePack(lot: Lot): { label: string; status: Status }[] {
  const c = crossSummary(lot);
  const cross: Status =
    c.failed > 0 ? "failed" : c.passed === c.total ? "verified" : c.passed > 0 ? "partial" : "missing";
  return [
    { label: "Certificate of analysis", status: lot.evidence.assay.status },
    { label: "Sample split record", status: lot.evidence.sampling.status },
    { label: "Custody log with seal numbers", status: lot.evidence.custody.status },
    { label: "Screening report", status: lot.evidence.screening.status },
    { label: "Site audit report", status: lot.evidence.site.status },
    { label: "Cross-check report", status: cross },
  ];
}
