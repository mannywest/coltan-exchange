import type { CheckId, Lot, Status } from "@/lib/grade";

// DEMO DATA ONLY. Four more invented lots, built from a small factory so the
// evidence text stays consistent. Two are waiting for a reviewer's decision.
// COMPLIANCE: screening results are pretend. Real screening comes from a regulated provider.

const SOURCE: Record<CheckId, string> = {
  sampling: "Demo Inspection Co.",
  assay: "Demo Assay Lab 1",
  custody: "Platform custody log",
  screening: "Screening provider (demo)",
  crosschecks: "Platform rules engine",
  site: "Demo Site Auditors Ltd",
};

const DETAIL: Record<CheckId, Record<Status, string>> = {
  sampling: {
    verified: "Three-way split taken under inspector supervision and sealed.",
    partial: "Split taken, but the inspector was present for only part of it.",
    missing: "No independent sampling on file.",
    failed: "The sampling record does not match the lot.",
  },
  assay: {
    verified: "Certificate of analysis issued by an independent lab.",
    partial: "Seller's lab result only. The independent result is due.",
    missing: "No certificate of analysis.",
    failed: "Lab results disagree beyond the tolerance.",
  },
  custody: {
    verified: "Handover scans with seals, weights and pins. No gaps outside the set limits.",
    partial: "Some expected scans are missing.",
    missing: "No sealed custody log.",
    failed: "A seal or weight mismatch was not cleared.",
  },
  screening: {
    verified: "All parties checked against UK, US, EU and UN lists and adverse media. No matches.",
    partial: "Most parties cleared. One owner is still being identified.",
    missing: "Screening has not started.",
    failed: "A party matched a designated list (demo data).",
  },
  crosschecks: {
    verified: "All seven origin cross-checks passed.",
    partial: "Most cross-checks passed. Some are held open.",
    missing: "Cross-checks have not been run.",
    failed: "At least one cross-check failed.",
  },
  site: {
    verified: "Third-party site visit and labour-conditions check, with dated photos, in the last 90 days.",
    partial: "The third-party site visit is older than 90 days. A new visit is booked.",
    missing: "No third-party site evidence on file.",
    failed: "The site visit found a problem.",
  },
};

function evidence(
  s: Record<CheckId, Status>,
  over: Partial<Record<CheckId, string>> = {}
): Lot["evidence"] {
  const out = {} as Lot["evidence"];
  (Object.keys(s) as CheckId[]).forEach((k) => {
    out[k] = {
      status: s[k],
      detail: over[k] ?? DETAIL[k][s[k]],
      source: s[k] === "missing" ? "None" : SOURCE[k],
    };
  });
  return out;
}

function custody(depot: string, start: string, number: string, tonnes: number): Lot["custody"] {
  const t0 = new Date(start).getTime();
  const at = (h: number) => new Date(t0 + h * 3600000).toISOString();
  return [
    { at: at(0), action: "Lot logged and sampled", place: depot, by: "Field buyer and inspector" },
    { at: at(3), action: `Bags sealed, seals ${number}-01 to ${number}-20 recorded`, place: depot, by: "Inspector" },
    { at: at(46), action: `Handover to transporter, weight ${(tonnes + 0.01).toFixed(2)} t`, place: depot, by: "Transporter driver" },
    { at: at(100), action: "Border post, seals and papers matched", place: "Demo Border Post", by: "Named checker M. (demo)" },
    { at: at(150), action: `Received at export warehouse, weight ${tonnes.toFixed(2)} t`, place: "Demo Warehouse", by: "Warehouse supervisor" },
  ];
}

function screening(s: Status): Lot["screening"] {
  return ["Seller", "Transporter", "Exporter", "Beneficial owners"].map((party, i) => {
    const st: Status = i === 3 ? s : "verified";
    return {
      party,
      status: st,
      note:
        st === "verified"
          ? party === "Beneficial owners"
            ? "Identified and cleared"
            : "No list or media matches"
          : "One owner still to be identified",
    };
  });
}

const V: Status = "verified";

export const extraLots: Lot[] = [
  {
    slug: "lot-0412",
    number: "0412",
    tonnes: 15,
    basisTa2O5: 25,
    incoterm: "FOB Demo Port",
    priceUsdPerLb: 152,
    holdHours: 48,
    sellerAlias: "Seller S-04",
    mine: { name: "Mine E (demo)", tier: "Verified" },
    evidence: evidence({ sampling: V, assay: V, custody: V, screening: V, crosschecks: V, site: V }),
    assay: { fieldTa: 20.8, factor: 1.22, sellerLab: 25.6, independentLab: 25.5, toleranceCheck: "Both lab results are inside the 0.5 point tolerance." },
    custody: custody("Demo Depot 5", "2026-10-24T08:00:00Z", "0412", 15),
    screening: screening(V),
    lastScreened: "2026-11-17T06:00:00Z",
    cross: [
      ["verified", "Photos and pin sit inside the mine's recorded boundary."],
      ["verified", "15 t is within this mine's usual monthly output."],
      ["verified", "Assay profile matches earlier lots."],
      ["verified", "Journey time fits the usual route."],
      ["verified", "USD 152 is inside the demo market range of 140 to 160."],
      ["verified", "No sanctions or media matches on any party."],
      ["verified", "Six earlier lots from this seller, all settled."],
    ],
    review: { status: "approved", by: "Compliance reviewer R. (demo)", at: "2026-11-10T10:20:00Z" },
  },
  {
    slug: "lot-0428",
    number: "0428",
    tonnes: 10,
    basisTa2O5: 25,
    incoterm: "CIF Demo Port",
    priceUsdPerLb: 145,
    holdHours: 48,
    sellerAlias: "Seller S-12",
    mine: { name: "Mine F (demo)", tier: "Verified" },
    evidence: evidence({ sampling: V, assay: V, custody: V, screening: V, crosschecks: V, site: "partial" }),
    assay: { fieldTa: 19.6, factor: 1.22, sellerLab: 24.2, independentLab: 24.0, toleranceCheck: "Both lab results are inside the 0.5 point tolerance." },
    custody: custody("Demo Depot 6", "2026-10-30T08:00:00Z", "0428", 10),
    screening: screening(V),
    lastScreened: "2026-11-16T06:00:00Z",
    cross: [
      ["partial", "The photos are 45 days old. Fresh ones come with the booked site visit."],
      ["verified", "10 t is plausible for this mine."],
      ["verified", "Assay profile matches earlier lots."],
      ["verified", "Journey time fits the usual route."],
      ["verified", "USD 145 is inside the demo market range of 140 to 160."],
      ["verified", "No sanctions or media matches on any party."],
      ["verified", "Three earlier lots from this seller, all settled."],
    ],
    review: { status: "approved", by: "Compliance reviewer R. (demo)", at: "2026-11-11T13:00:00Z" },
  },
  {
    slug: "lot-0436",
    number: "0436",
    tonnes: 10,
    basisTa2O5: 25,
    incoterm: "CIF Demo Port",
    priceUsdPerLb: 141,
    holdHours: 48,
    sellerAlias: "Seller S-26",
    mine: { name: "Mine G (demo)", tier: "Watch" },
    evidence: evidence(
      { sampling: V, assay: V, custody: V, screening: V, crosschecks: "partial", site: "partial" },
      {
        crosschecks: "Output rose sharply in one month, so the volume check is held open. The rest passed.",
        site: "The third-party site visit is 120 days old. A new visit is booked.",
      }
    ),
    assay: { fieldTa: 19.8, factor: 1.22, sellerLab: 24.4, independentLab: 24.3, toleranceCheck: "Both lab results are inside the 0.5 point tolerance." },
    custody: custody("Demo Depot 7", "2026-11-04T08:00:00Z", "0436", 10),
    screening: screening(V),
    lastScreened: "2026-11-18T06:00:00Z",
    cross: [
      ["verified", "Photos and pin sit inside the mine's recorded boundary."],
      ["partial", "Output rose 40% in one month. Held open until the new site visit."],
      ["verified", "Assay profile matches earlier lots."],
      ["verified", "Journey time fits the usual route."],
      ["verified", "USD 141 is at the bottom of the demo market range of 140 to 160."],
      ["verified", "No sanctions or media matches on any party."],
      ["verified", "Two earlier lots from this seller, both settled."],
    ],
    caseNote: "The mine is on watch, so a named person must decide before buyers can see this lot.",
    aiSummary:
      "Four of six evidence checks pass. Sampling, assay, custody and screening are clean. The mine's output jumped 40% in a month and the site visit is 120 days old, so those two checks are open. Suggested outcome: approve with a condition that a new site visit is finished before payment is released.",
    review: { status: "pending", by: "", at: "2026-11-18T10:00:00Z" },
  },
  {
    slug: "lot-0440",
    number: "0440",
    tonnes: 12,
    basisTa2O5: 25,
    incoterm: "CIF Demo Port",
    priceUsdPerLb: 101,
    holdHours: 48,
    sellerAlias: "Seller S-33",
    mine: { name: "Mine H (demo)", tier: "Verified" },
    evidence: evidence(
      { sampling: V, assay: V, custody: V, screening: "partial", crosschecks: "failed", site: "missing" },
      { crosschecks: "Price is far below the market range and the stated route passes a known mixing point." }
    ),
    assay: { fieldTa: 20.0, factor: 1.22, sellerLab: 24.6, independentLab: 24.5, toleranceCheck: "Both lab results are inside the 0.5 point tolerance." },
    custody: custody("Demo Depot 8", "2026-11-06T08:00:00Z", "0440", 12),
    screening: screening("partial"),
    lastScreened: "2026-11-19T06:00:00Z",
    cross: [
      ["verified", "Photos and pin sit inside the mine's recorded boundary."],
      ["verified", "12 t is plausible for this mine."],
      ["verified", "Assay profile matches earlier lots."],
      ["failed", "The route passes a known mixing point."],
      ["failed", "USD 101 is far below the demo market range of 140 to 160."],
      ["partial", "One beneficial owner is still to be identified."],
      ["partial", "Two earlier lots from this seller. One had a late payment."],
    ],
    caseNote: "A cross-check failed, so the rules send this lot to a person. The rules also cap it at Grade C.",
    aiSummary:
      "The lab and custody evidence is clean, but the price is far below the market range and the route passes a known mixing point. One owner is still unidentified. Suggested outcome: reject unless the seller explains the price and supplies the route papers. If you approve, the rules only allow approval with conditions.",
    review: { status: "pending", by: "", at: "2026-11-19T15:30:00Z" },
  },
];
