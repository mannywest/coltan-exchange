// Rules for what a back office person sees before signing. Plain checks, computed by code.
// COMPLIANCE: these checks inform a human. They never approve, release or clear anything themselves.
import { computeGrade, type Lot } from "./grade";
import { LB_PER_TONNE, PROVISIONAL_SHARE, preShipGrade } from "./price";
import { assayOutcome, getReq, type Deal, type FollowUp, type Req, type Store } from "./dealStore";

export const SHIP_DOCS = ["Export certificate", "Radioactivity certificate", "Tax receipts", "Traceability tags", "Packing list"];

export type Check = { label: string; ok: boolean; note: string };

export const valueAt = (lot: Lot, qty: number, ta: number) => qty * LB_PER_TONNE * (ta / 100) * lot.priceUsdPerLb;
export const provisionalAmount = (lot: Lot, qty: number) => valueAt(lot, qty, preShipGrade(lot)) * PROVISIONAL_SHARE;

export function checksFor(req: Req, deal: Deal | undefined, lot: Lot | undefined, s: Store): Check[] {
  if (!deal || !lot) return [{ label: "Deal found", ok: false, note: "The deal behind this request no longer exists." }];
  const g = computeGrade(lot);
  const out: Check[] = [];
  const lotOk = lot.review.status === "approved" && g.grade !== "Blocked";
  const lotCheck: Check = {
    label: "Lot is approved and not Blocked",
    ok: lotOk,
    note: lotOk ? `Trust Grade ${g.grade}, approved by ${lot.review.by}.` : "The lot is not tradable.",
  };
  const signedCheck: Check = {
    label: "Locked terms signed by both sides",
    ok: deal.buyerSigned && deal.sellerSigned,
    note: deal.buyerSigned && deal.sellerSigned ? "Buyer and seller both signed." : "One side has not signed.",
  };

  if (req.kind === "enhanced") {
    const open = (Object.entries(lot.evidence) as [string, { status: string }][]).filter(([, e]) => e.status !== "verified").map(([k]) => k);
    out.push(lotCheck);
    out.push({
      label: "Evidence gaps listed for the decision",
      ok: open.length === 0,
      note: open.length ? `Still open: ${open.join(", ")}. A named Compliance officer decides whether this buyer may continue.` : "No gaps.",
    });
    out.push({ label: "Mine tier", ok: lot.mine.tier === "Verified", note: `${lot.mine.name} is tier ${lot.mine.tier}.` });
  }
  if (req.kind === "wallet") {
    out.push({ label: "Wallet matched a screening list (simulated)", ok: false, note: "A demo watch list returned a possible match. A person must look at it. Real screening is planned for a later phase." });
    out.push({ label: "Funds paused", ok: true, note: "Nothing can be sent from this wallet until a decision is recorded." });
  }
  if (req.kind === "funds") {
    out.push(lotCheck, signedCheck);
    out.push({ label: "Amount matches the locked terms", ok: req.amount !== undefined && Math.abs(req.amount - provisionalAmount(lot, deal.qty)) < 1, note: `Expected about USD ${Math.round(provisionalAmount(lot, deal.qty)).toLocaleString("en-GB")}.` });
    out.push({ label: "Escrow partner statement", ok: true, note: "Check the regulated escrow partner's statement for the transfer. Demo: simulated as received." });
  }
  if (req.kind === "provisional") {
    const expected = provisionalAmount(lot, deal.qty);
    out.push(lotCheck, signedCheck);
    const funded = deal.method === "usdt" ? deal.cx.pay === "confirmed" : getReq(s, deal.fundsReq)?.status === "approved";
    out.push({ label: "Funds are in escrow", ok: funded, note: deal.method === "usdt" ? `Payment confirmed on the demo network (${deal.cx.confs} of 3 confirmations).` : "Escrow partner statement confirmed by a Reviewer." });
    if (deal.method === "usdt") out.push({ label: "Wallet screening passed", ok: deal.cx.screen === "passed", note: "Simulated screening. Real screening is planned for a later phase." });
    out.push({ label: "Amount matches 80% of the pre-shipment value", ok: req.amount !== undefined && Math.abs(req.amount - expected) < 1, note: `Expected ${req.unit ?? "USD"} ${Math.round(expected).toLocaleString("en-GB")} from ${deal.qty} t at ${preShipGrade(lot).toFixed(1)}% Ta2O5.` });
    out.push({ label: "No open dispute or custody flag", ok: !lot.custody.some((c) => c.flag), note: lot.custody.some((c) => c.flag) ? "A custody flag is open on this lot." : "None open." });
  }
  if (req.kind === "shipment") {
    const flagged = lot.custody.filter((c) => c.flag);
    out.push(lotCheck, signedCheck);
    out.push({ label: "All export documents attached", ok: SHIP_DOCS.every((x) => deal.docs.includes(x)), note: `${deal.docs.length} of ${SHIP_DOCS.length} attached: ${SHIP_DOCS.join(", ")}.` });
    out.push({ label: "Seal numbers match at every handover", ok: flagged.length === 0, note: flagged.length ? `Flag on the custody log: ${flagged[0].flag}` : "Seals matched at each scan." });
    out.push({ label: "Weight change inside the 0.5% limit", ok: flagged.length === 0, note: flagged.length ? "A weight or timing flag is open." : "Loaded and arrival weights are within the limit (demo)." });
    out.push({ label: "Route and timing are as expected", ok: true, note: "Journey time matches the usual route for this mine (demo)." });
  }
  if (req.kind === "assay") {
    const a = req.assay!;
    const o = assayOutcome(a);
    out.push({ label: "Results are plausible", ok: [a.buyerLab, a.independent].every((x) => x >= 5 && x <= 60), note: `Buyer lab ${a.buyerLab}%, independent lab ${a.independent}%.` });
    out.push({ label: `Labs agree within 0.5 points, or the umpire decides`, ok: o.within || (a.umpire !== undefined && !Number.isNaN(a.umpire)), note: o.within ? `Gap ${o.gap} points. The average is used: ${o.final}%.` : `Gap ${o.gap} points. The sealed umpire sample is opened and its result decides.` });
    if (!o.within) out.push({ label: "Umpire lab result entered", ok: a.umpire !== undefined && !Number.isNaN(a.umpire), note: a.umpire !== undefined ? `Umpire result ${a.umpire}%.` : "Enter the umpire result below before signing." });
  }
  if (req.kind === "final") {
    const prov = getReq(s, deal.provReq);
    out.push(lotCheck, signedCheck);
    out.push({ label: "Provisional payment already released", ok: prov?.status === "approved", note: prov?.status === "approved" ? "Released earlier." : "Not released." });
    out.push({ label: "Assay result recorded and settled", ok: deal.assayFinal !== null, note: deal.assayFinal !== null ? `Final grade ${deal.assayFinal.toFixed(2)}% Ta2O5.` : "No assay result yet." });
    if (deal.assayFinal !== null) {
      const bal = valueAt(lot, deal.qty, deal.assayFinal) - provisionalAmount(lot, deal.qty);
      out.push({ label: "Balance recalculated by the rules engine", ok: req.amount !== undefined && Math.abs(Math.abs(bal) - req.amount) < 1, note: `${bal >= 0 ? "Due to the seller" : "Refund to the buyer"}: USD ${Math.round(Math.abs(bal)).toLocaleString("en-GB")}.` });
    }
  }
  return out;
}

// What happens automatically once a request is approved. Deterministic. Raises the next request, never money itself.
export function followUpFor(lot: Lot | undefined) {
  return (req: Req, deal: Deal): FollowUp | null => {
    if (!lot) return null;
    if (req.kind === "funds" && req.amount !== undefined)
      return { kind: "provisional", amount: req.amount, unit: "USD", note: "Funds confirmed in escrow." };
    if (req.kind === "assay" && deal.assayFinal !== null) {
      const bal = valueAt(lot, deal.qty, deal.assayFinal) - provisionalAmount(lot, deal.qty);
      return {
        kind: "final",
        amount: Math.abs(bal),
        unit: deal.method === "usdt" ? "USDT" : "USD",
        note: bal >= 0 ? "Balance due to the seller." : "Refund due to the buyer.",
      };
    }
    return null;
  };
}

export type Stage = { step: number; label: string; waitingOn: "Buyer" | "Seller" | "Back office" | "Nobody"; detail: string; tone: "ok" | "wait" | "stop" };

// One line per deal: where it is and who must act next. Used by My deals and the back office.
export function dealStage(d: Deal, s: Store): Stage {
  const enh = getReq(s, d.enhancedReq);
  if (enh?.status === "pending") return { step: 2, label: "Enhanced review", waitingOn: "Back office", detail: `${enh.id} needs a named Compliance officer.`, tone: "wait" };
  if (enh?.status === "rejected") return { step: 2, label: "Stopped at enhanced review", waitingOn: "Nobody", detail: enh.reason ?? "Declined.", tone: "stop" };
  if (!d.buyerSigned) return { step: 2, label: "Sign the locked terms", waitingOn: "Buyer", detail: "The buyer signs first.", tone: "wait" };
  if (!d.sellerSigned) return { step: 2, label: "Seller countersigns", waitingOn: "Seller", detail: d.qty ? `Seller must agree to ${d.qty} t and the locked terms.` : "", tone: "wait" };
  const prov = getReq(s, d.provReq);
  if (!prov || prov.status === "rejected") {
    if (d.method === "usdt") {
      const w = getReq(s, d.walletReq);
      if (d.cx.screen === "flagged" && w?.status === "pending") return { step: 3, label: "Flagged wallet", waitingOn: "Back office", detail: `${w.id} needs a named Compliance officer.`, tone: "wait" };
      return { step: 3, label: "Provisional payment: funding", waitingOn: "Buyer", detail: prov?.status === "rejected" ? `Release declined: ${prov.reason}` : "Buyer connects a wallet and funds the contract.", tone: "wait" };
    }
    const f = getReq(s, d.fundsReq);
    if (f?.status === "pending") return { step: 3, label: "Confirm funds received", waitingOn: "Back office", detail: `${f.id} needs a named reviewer.`, tone: "wait" };
    return { step: 3, label: "Provisional payment: funding", waitingOn: "Buyer", detail: "Buyer sends the escrow transfer.", tone: "wait" };
  }
  if (prov.status === "pending") return { step: 3, label: "Provisional release", waitingOn: "Back office", detail: `${prov.id}: ${prov.sigs.length} of ${prov.slots.length} signed.`, tone: "wait" };
  const sh = getReq(s, d.shipReq);
  if (!sh || sh.status === "rejected") return { step: 4, label: "Shipment and documents", waitingOn: "Seller", detail: sh?.status === "rejected" ? `Shipment not confirmed: ${sh.reason}` : "Seller logs the handovers and attaches the export documents.", tone: "wait" };
  if (sh.status === "pending") return { step: 4, label: "Shipment check", waitingOn: "Back office", detail: `${sh.id} needs a named reviewer.`, tone: "wait" };
  const a = getReq(s, d.assayReq);
  if (!a || a.status === "rejected") return { step: 5, label: "Assay on arrival", waitingOn: "Buyer", detail: a?.status === "rejected" ? `Result declined: ${a.reason}` : "Buyer submits their lab result.", tone: "wait" };
  if (a.status === "pending") return { step: 5, label: "Assay result", waitingOn: "Back office", detail: `${a.id} needs a named reviewer.`, tone: "wait" };
  const f2 = getReq(s, d.finalReq);
  if (!f2 || f2.status === "rejected") return { step: 6, label: "Final payment", waitingOn: "Back office", detail: "Release request being raised.", tone: "wait" };
  if (f2.status === "pending") return { step: 6, label: "Final release", waitingOn: "Back office", detail: `${f2.id}: ${f2.sigs.length} of ${f2.slots.length} signed.`, tone: "wait" };
  return { step: 7, label: "Complete", waitingOn: "Nobody", detail: "Evidence pack ready.", tone: "ok" };
}
