import type { Tier } from "@/lib/grade";

// DEMO DATA ONLY. No real mines, operators or places.
// COMPLIANCE: the registry is for reviewers. Buyers see a mine's tier, never this page,
// and exact locations are never shown to anyone outside a few named people.

export type Mine = {
  name: string;
  tier: Tier;
  operator: string;
  permit: string;
  lastVerified: string | null;
  verifiedBy: string;
  tag: string;
  signals: string[];
  note: string;
};

export const mines: Mine[] = [
  { name: "Mine A (demo)", tier: "Verified", operator: "Demo Cooperative 1", permit: "Valid to Mar 2027 (demo)", lastVerified: "2026-09-14", verifiedBy: "Demo Site Auditors Ltd", tag: "Programme tag present (one signal only)", signals: [], note: "Steady output. Four lots settled with no dispute." },
  { name: "Mine B (demo)", tier: "Watch", operator: "Demo Cooperative 2", permit: "Valid to Jun 2027 (demo)", lastVerified: "2026-07-02", verifiedBy: "Demo Site Auditors Ltd", tag: "Programme tag present (one signal only)", signals: ["Output rose 40% in one month", "Site visit older than 90 days"], note: "Verified earlier, now on watch until a new site visit is done." },
  { name: "Mine C (demo)", tier: "Watch", operator: "Demo Cooperative 3", permit: "Renewal pending (demo)", lastVerified: "2026-06-20", verifiedBy: "Demo Site Auditors Ltd", tag: "No tag", signals: ["Permit renewal pending", "Photos older than 30 days"], note: "Lots here need a reviewer's approval every time." },
  { name: "Mine D (demo)", tier: "Blocked", operator: "Unknown", permit: "None on file", lastVerified: null, verifiedBy: "Not verified", tag: "None", signals: ["Inside an area controlled by an armed group (demo map)", "Route passes a known mixing point"], note: "Lots from here cannot be traded." },
  { name: "Mine E (demo)", tier: "Verified", operator: "Demo Company 1", permit: "Valid to Dec 2027 (demo)", lastVerified: "2026-10-02", verifiedBy: "Demo Site Auditors Ltd", tag: "Programme tag present (one signal only)", signals: [], note: "Six lots settled with no dispute." },
  { name: "Mine F (demo)", tier: "Verified", operator: "Demo Company 2", permit: "Valid to Aug 2027 (demo)", lastVerified: "2026-08-25", verifiedBy: "Demo Site Auditors Ltd", tag: "Programme tag present (one signal only)", signals: ["Site visit due within 14 days"], note: "A new site visit is booked." },
  { name: "Mine G (demo)", tier: "Watch", operator: "Demo Cooperative 4", permit: "Valid to Feb 2027 (demo)", lastVerified: "2026-07-22", verifiedBy: "Demo Site Auditors Ltd", tag: "Programme tag present (one signal only)", signals: ["Output rose 40% in one month"], note: "Waiting on a reviewer decision for lot 0436." },
  { name: "Mine H (demo)", tier: "Verified", operator: "Demo Company 3", permit: "Valid to Nov 2027 (demo)", lastVerified: "2026-09-30", verifiedBy: "Demo Site Auditors Ltd", tag: "No tag", signals: ["Seller offering far below the market range"], note: "Mine is clean. The concern is the seller and the price." },
  { name: "Mine J (demo)", tier: "Unverified", operator: "Demo Cooperative 5", permit: "Not yet checked", lastVerified: null, verifiedBy: "Not verified", tag: "None", signals: [], note: "Listed on day one. Not tradable until verified." },
  { name: "Mine K (demo)", tier: "Unverified", operator: "Unknown", permit: "Not yet checked", lastVerified: null, verifiedBy: "Not verified", tag: "None", signals: ["Owners not identified"], note: "Not tradable until verified." },
  { name: "Mine L (demo)", tier: "Blocked", operator: "Demo Holding (listed party, demo)", permit: "Not valid", lastVerified: "2026-05-11", verifiedBy: "Demo Site Auditors Ltd", tag: "Tag suspended (demo)", signals: ["Operator is a designated party (demo data)"], note: "Blocked after the operator was listed." },
  { name: "Mine M (demo)", tier: "Watch", operator: "Demo Cooperative 6", permit: "Valid to Apr 2027 (demo)", lastVerified: "2026-08-08", verifiedBy: "Demo Site Auditors Ltd", tag: "Programme tag present (one signal only)", signals: ["Nearby area reported unstable"], note: "Tradable only with reviewer approval." },
];
