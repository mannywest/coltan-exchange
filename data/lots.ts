import type { Lot } from "@/lib/grade";
import { extraLots } from "./extra";

// DEMO DATA ONLY. Every lot, name, number, date and price below is invented.
// COMPLIANCE: screening results here are pretend. Real screening must come from a
// regulated provider, never from this file.

const baseLots: Lot[] = [
  {
    slug: "lot-0417",
    number: "0417",
    tonnes: 12,
    basisTa2O5: 25,
    incoterm: "CIF Demo Port",
    priceUsdPerLb: 150,
    holdHours: 48,
    sellerAlias: "Seller S-17",
    mine: { name: "Mine A (demo)", tier: "Verified" },
    evidence: {
      sampling: {
        status: "verified",
        detail:
          "Three-way split taken under inspector supervision: one part each for seller, buyer and umpire lab. Bags sealed on the spot.",
        source: "Demo Inspection Co.",
      },
      assay: {
        status: "verified",
        detail:
          "Certificate of analysis issued by an independent lab and anchored to this lot's number. Result sits inside the agreed tolerance of the seller's own lab.",
        source: "Demo Assay Lab 1",
      },
      custody: {
        status: "verified",
        detail:
          "Six handover scans with seal numbers, weights and location pins. No weight, seal or timing gaps outside the set limits.",
        source: "Platform custody log",
      },
      screening: {
        status: "verified",
        detail:
          "Seller, transporter, exporter and beneficial owners checked against UK, US, EU and UN lists and adverse media. No matches.",
        source: "Screening provider (demo)",
      },
      crosschecks: {
        status: "verified",
        detail:
          "Reported output is plausible for this mine's size and crew. Assay profile matches this mine's earlier lots. Journey time fits the route.",
        source: "Platform rules engine",
      },
      site: {
        status: "verified",
        detail:
          "Site visit and labour-conditions check by a third party, with dated photos, in the last 90 days.",
        source: "Demo Site Auditors Ltd",
      },
    },
    assay: {
      fieldTa: 20.6,
      factor: 1.22,
      sellerLab: 25.3,
      independentLab: 25.2,
      toleranceCheck: "Both lab results are inside the 0.5 point tolerance.",
    },
    custody: [
      {
        at: "2026-11-02T08:10:00Z",
        action: "Lot logged and sampled",
        place: "Demo Depot 1",
        by: "Field buyer and inspector",
      },
      {
        at: "2026-11-02T11:35:00Z",
        action: "Bags sealed, seals 0417-01 to 0417-24 recorded",
        place: "Demo Depot 1",
        by: "Inspector",
      },
      {
        at: "2026-11-04T07:50:00Z",
        action: "Handover to transporter, weight 12.01 t",
        place: "Demo Depot 1",
        by: "Transporter driver",
      },
      {
        at: "2026-11-06T15:20:00Z",
        action: "Border post, seals and papers matched",
        place: "Demo Border Post",
        by: "Named checker M. (demo)",
      },
      {
        at: "2026-11-09T10:05:00Z",
        action: "Received at export warehouse, weight 12.00 t",
        place: "Demo Warehouse",
        by: "Warehouse supervisor",
      },
      {
        at: "2026-11-12T09:40:00Z",
        action: "Independent lab result issued",
        place: "Demo Assay Lab 1",
        by: "Lab",
      },
    ],
    screening: [
      { party: "Seller", status: "verified", note: "No list or media matches" },
      { party: "Transporter", status: "verified", note: "No list or media matches" },
      { party: "Exporter", status: "verified", note: "No list or media matches" },
      { party: "Beneficial owners", status: "verified", note: "Identified and cleared" },
    ],
    lastScreened: "2026-11-17T06:00:00Z",
    cross: [
      ["verified", "Site photos and pin sit inside the mine's recorded boundary. No armed-group area nearby (demo map)."],
      ["verified", "12 t is well inside this mine's usual monthly output."],
      ["verified", "Niobium, uranium and tin lines are within the range of earlier lots."],
      ["verified", "Six days door to door, which matches the usual route."],
      ["verified", "USD 150 is inside the demo market range of 140 to 160."],
      ["verified", "No sanctions or media matches on any party."],
      ["verified", "Four earlier lots from this seller, all settled without a dispute."],
    ],
    review: {
      status: "approved",
      by: "Compliance reviewer R. (demo)",
      at: "2026-11-13T14:00:00Z",
    },
  },
  {
    slug: "lot-0422",
    number: "0422",
    tonnes: 10,
    basisTa2O5: 25,
    incoterm: "CIF Demo Port",
    priceUsdPerLb: 142,
    holdHours: 48,
    sellerAlias: "Seller S-09",
    mine: { name: "Mine B (demo)", tier: "Watch" },
    evidence: {
      sampling: {
        status: "verified",
        detail:
          "Three-way split taken under inspector supervision, bags sealed and photographed.",
        source: "Demo Inspection Co.",
      },
      assay: {
        status: "verified",
        detail: "Certificate of analysis issued by an independent lab.",
        source: "Demo Assay Lab 1",
      },
      custody: {
        status: "verified",
        detail:
          "Five handover scans. One weight gap of 0.3% was flagged and cleared by a named checker.",
        source: "Platform custody log",
      },
      screening: {
        status: "verified",
        detail: "All parties checked, no matches. Re-screened last week.",
        source: "Screening provider (demo)",
      },
      crosschecks: {
        status: "partial",
        detail:
          "Output is plausible and the route fits, but this mine's output rose sharply last month, so the volume check is held open.",
        source: "Platform rules engine",
      },
      site: {
        status: "partial",
        detail:
          "Third-party site visit is 140 days old, outside the 90-day window. A new visit is booked.",
        source: "Demo Site Auditors Ltd",
      },
    },
    assay: {
      fieldTa: 19.9,
      factor: 1.22,
      sellerLab: 24.4,
      independentLab: 24.1,
      toleranceCheck: "Both lab results are inside the 0.5 point tolerance.",
    },
    custody: [
      {
        at: "2026-10-28T09:00:00Z",
        action: "Lot logged and sampled",
        place: "Demo Depot 2",
        by: "Field buyer and inspector",
      },
      {
        at: "2026-10-30T13:15:00Z",
        action: "Handover to transporter, weight 10.03 t",
        place: "Demo Depot 2",
        by: "Transporter driver",
      },
      {
        at: "2026-11-03T16:40:00Z",
        action: "Border post, weight 10.00 t",
        place: "Demo Border Post",
        by: "Named checker M. (demo)",
        flag: "Weight is 0.3% below the previous scan. Cleared as scale difference by the named checker.",
      },
      {
        at: "2026-11-07T10:30:00Z",
        action: "Received at export warehouse, weight 10.00 t",
        place: "Demo Warehouse",
        by: "Warehouse supervisor",
      },
      {
        at: "2026-11-10T12:00:00Z",
        action: "Independent lab result issued",
        place: "Demo Assay Lab 1",
        by: "Lab",
      },
    ],
    screening: [
      { party: "Seller", status: "verified", note: "No list or media matches" },
      { party: "Transporter", status: "verified", note: "No list or media matches" },
      { party: "Exporter", status: "verified", note: "No list or media matches" },
      { party: "Beneficial owners", status: "verified", note: "Identified and cleared" },
    ],
    lastScreened: "2026-11-16T06:00:00Z",
    cross: [
      ["verified", "Photos and pin sit inside the mine's recorded boundary."],
      ["partial", "Output rose 40% in one month. Held open until the new site visit."],
      ["verified", "Assay profile is within the range of earlier lots."],
      ["verified", "Journey time fits the route. One 0.3% weight gap was cleared."],
      ["verified", "USD 142 is inside the demo market range of 140 to 160."],
      ["verified", "No sanctions or media matches on any party."],
      ["verified", "Two earlier lots from this seller, both settled."],
    ],
    review: {
      status: "approved",
      by: "Compliance reviewer R. (demo)",
      at: "2026-11-12T11:30:00Z",
      note: "Approved because this mine is on watch. A new site visit must be complete before payment is released.",
    },
  },
  {
    slug: "lot-0431",
    number: "0431",
    tonnes: 10,
    basisTa2O5: 25,
    incoterm: "FOB Demo Port",
    priceUsdPerLb: 118,
    holdHours: 24,
    sellerAlias: "Seller S-23",
    mine: { name: "Mine C (demo)", tier: "Watch" },
    evidence: {
      sampling: {
        status: "verified",
        detail: "Three-way split taken under inspector supervision and sealed.",
        source: "Demo Inspection Co.",
      },
      assay: {
        status: "partial",
        detail:
          "Seller's lab result received. The independent lab result has not arrived yet.",
        source: "Demo Assay Lab 2",
      },
      custody: {
        status: "partial",
        detail:
          "Three of five expected scans are logged. The border scan is missing.",
        source: "Platform custody log",
      },
      screening: {
        status: "verified",
        detail: "All parties checked, no matches.",
        source: "Screening provider (demo)",
      },
      crosschecks: {
        status: "missing",
        detail:
          "Not run yet: the seller has not supplied the route papers the checks need.",
        source: "Platform rules engine",
      },
      site: {
        status: "missing",
        detail: "No third-party site evidence on file for this mine.",
        source: "None",
      },
    },
    assay: {
      fieldTa: 19.2,
      factor: 1.22,
      sellerLab: 23.6,
      independentLab: null,
      toleranceCheck:
        "Cannot be checked until the independent lab result arrives.",
    },
    custody: [
      {
        at: "2026-11-05T08:30:00Z",
        action: "Lot logged and sampled",
        place: "Demo Depot 3",
        by: "Field buyer and inspector",
      },
      {
        at: "2026-11-07T09:10:00Z",
        action: "Handover to transporter, weight 10.10 t",
        place: "Demo Depot 3",
        by: "Transporter driver",
      },
      {
        at: "2026-11-15T14:25:00Z",
        action: "Received at export warehouse, weight 10.05 t",
        place: "Demo Warehouse",
        by: "Warehouse supervisor",
        flag: "Eight days between scans and no border scan. The gap is unexplained.",
      },
    ],
    screening: [
      { party: "Seller", status: "verified", note: "No list or media matches" },
      { party: "Transporter", status: "verified", note: "No list or media matches" },
      { party: "Exporter", status: "verified", note: "No list or media matches" },
      { party: "Beneficial owners", status: "partial", note: "One owner still to be identified" },
    ],
    lastScreened: "2026-11-16T06:00:00Z",
    cross: [
      ["partial", "The pin matches the mine, but the photos are older than 30 days."],
      ["verified", "10 t is plausible for this mine."],
      ["partial", "The independent lab result is due, so the profile cannot be compared yet."],
      ["missing", "The border scan is missing, so journey time cannot be checked."],
      ["partial", "USD 118 is below the demo market range of 140 to 160."],
      ["partial", "One beneficial owner is still to be identified."],
      ["missing", "First lot from this seller, so there is no track record."],
    ],
    review: {
      status: "approved",
      by: "Compliance reviewer R. (demo)",
      at: "2026-11-17T09:15:00Z",
      note: "Approved for viewing only because the buyer asked for it. Full payment needs the independent lab result and the missing border scan first.",
    },
  },
  {
    slug: "lot-0409",
    number: "0409",
    tonnes: 11,
    basisTa2O5: 25,
    incoterm: "CIF Demo Port",
    priceUsdPerLb: 96,
    holdHours: 0,
    sellerAlias: "Seller S-31",
    mine: { name: "Mine D (demo)", tier: "Blocked" },
    evidence: {
      sampling: {
        status: "partial",
        detail: "Samples were taken by the seller alone, with no inspector present.",
        source: "Seller only",
      },
      assay: {
        status: "missing",
        detail: "No independent certificate of analysis.",
        source: "None",
      },
      custody: {
        status: "missing",
        detail: "No sealed custody log. Papers show no seal numbers.",
        source: "None",
      },
      screening: {
        status: "failed",
        detail:
          "The transporter matched a designated party in the pretend screening data used for this demo.",
        source: "Screening provider (demo)",
      },
      crosschecks: {
        status: "failed",
        detail:
          "Price is far below the market range and the stated route passes a known mixing point.",
        source: "Platform rules engine",
      },
      site: {
        status: "missing",
        detail: "No third-party site evidence. Site is inside a Blocked area.",
        source: "None",
      },
    },
    assay: {
      fieldTa: 21.0,
      factor: 1.22,
      sellerLab: null,
      independentLab: null,
      toleranceCheck: "No lab results on file.",
    },
    custody: [
      {
        at: "2026-10-20T07:00:00Z",
        action: "Lot logged by seller, no inspector",
        place: "Demo Depot 4",
        by: "Seller",
        flag: "Unverified entry. Nobody independent confirmed this scan.",
      },
    ],
    screening: [
      { party: "Seller", status: "partial", note: "Ownership unclear" },
      { party: "Transporter", status: "failed", note: "Match to a designated party (demo data)" },
      { party: "Exporter", status: "missing", note: "Not yet identified" },
      { party: "Beneficial owners", status: "missing", note: "Not provided" },
    ],
    lastScreened: "2026-11-14T06:00:00Z",
    cross: [
      ["failed", "The pin falls inside a Blocked area."],
      ["missing", "No output figures were supplied."],
      ["missing", "No independent lab result to compare."],
      ["failed", "The route passes a known mixing point."],
      ["failed", "USD 96 is far below the demo market range of 140 to 160."],
      ["failed", "The transporter matches a designated party (demo data)."],
      ["missing", "First lot from this seller, so there is no track record."],
    ],
    review: {
      status: "rejected",
      by: "Compliance reviewer R. (demo)",
      at: "2026-11-14T16:45:00Z",
      note: "Rejected. Mine tier is Blocked and screening failed. Case kept on file.",
    },
  },
];

export const lots: Lot[] = [...baseLots, ...extraLots];

export function getLot(slug: string): Lot | undefined {
  return lots.find((l) => l.slug === slug);
}
