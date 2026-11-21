"use client";

// One small shared store for the demo: deals, approval requests and the audit log.
// It lives in the browser tab (session storage). There is no server and no database.
// COMPLIANCE: every step that moves money, records an assay result or clears a flagged party
// becomes an approval request. Named people sign it in the back office. No AI signs anything,
// and the buyer can never approve their own payment.
import { useSyncExternalStore } from "react";
import { CX0, type Cx } from "./chainState";
import { demoHash } from "./chain";

export type Slot = "approver" | "reviewer" | "compliance";
export type Person = { id: string; name: string; role: Slot };

// Pretend staff. Obviously fictional names, as the project rules require.
export const PEOPLE: Person[] = [
  { id: "approver", name: "Approver A. (demo)", role: "approver" },
  { id: "reviewer", name: "Reviewer R. (demo)", role: "reviewer" },
  { id: "compliance", name: "Compliance officer C. (demo)", role: "compliance" },
];
export const personName = (id: string) => PEOPLE.find((p) => p.id === id)?.name ?? id;
export const SLOT_LABEL: Record<Slot, string> = {
  approver: "Named approver",
  reviewer: "Named reviewer",
  compliance: "Named Compliance officer",
};

export type Kind = "enhanced" | "wallet" | "funds" | "provisional" | "shipment" | "assay" | "final";
export const KIND_LABEL: Record<Kind, string> = {
  enhanced: "Enhanced review before signing",
  wallet: "Flagged wallet",
  funds: "Confirm funds received",
  provisional: "Release provisional payment",
  shipment: "Confirm shipment and documents",
  assay: "Record the assay result",
  final: "Release final payment",
};

export type Req = {
  id: string;
  kind: Kind;
  slug: string;
  lotNumber: string;
  title: string;
  amount?: number;
  unit?: "USD" | "USDT";
  at: number;
  slots: Slot[];
  sigs: { slot: Slot; personId: string; at: number }[];
  status: "pending" | "approved" | "rejected";
  decidedAt?: number;
  decidedBy?: string;
  reason?: string;
  // Assay requests carry the numbers the Reviewer works from.
  assay?: { buyerLab: number; independent: number; umpire?: number };
};

export type Deal = {
  slug: string;
  lotNumber: string;
  qty: number;
  at: number;
  method: "bank" | "usdt";
  enhancedReq: string | null;
  buyerSigned: boolean;
  sellerSigned: boolean;
  bankSent: boolean;
  fundsReq: string | null;
  cx: Cx;
  walletReq: string | null;
  provReq: string | null;
  docs: string[];
  shipReq: string | null;
  buyerLab: string;
  assayReq: string | null;
  assayFinal: number | null;
  finalReq: string | null;
};

export type Audit = { n: number; at: number; who: string; action: string; ref: string; hash: string };

export type Store = {
  deals: Record<string, Deal>;
  reqs: Req[];
  audit: Audit[];
  seq: number;
  who: string; // back office person currently signed in (demo)
};

const EMPTY: Store = { deals: {}, reqs: [], audit: [], seq: 0, who: "approver" };
const KEY = "cx-store-v2";
let state: Store = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}
function emit() {
  persist();
  listeners.forEach((l) => l());
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Store) };
  } catch {}
}

function subscribe(l: () => void) {
  hydrate();
  listeners.add(l);
  // Hydrating after first paint: tell subscribers.
  queueMicrotask(l);
  return () => listeners.delete(l);
}
const snap = () => state;
const serverSnap = () => EMPTY;

export function useStore(): Store {
  return useSyncExternalStore(subscribe, snap, serverSnap);
}

function update(fn: (s: Store) => Store) {
  hydrate();
  state = fn(state);
  emit();
}

// ---- helpers --------------------------------------------------------------

function log(s: Store, who: string, action: string, ref: string): Store {
  const n = s.audit.length + 1;
  const at = Date.now();
  const prev = s.audit[s.audit.length - 1]?.hash ?? "genesis";
  const hash = demoHash(`${prev}|${n}|${who}|${action}|${ref}|${at}`);
  return { ...s, audit: [...s.audit, { n, at, who, action, ref, hash }] };
}

function newReq(
  s: Store,
  r: Omit<Req, "id" | "at" | "sigs" | "status">,
  who: string
): { s: Store; id: string } {
  const seq = s.seq + 1;
  const id = `REQ-${String(seq).padStart(4, "0")}`;
  const req: Req = { ...r, id, at: Date.now(), sigs: [], status: "pending" };
  let next: Store = { ...s, seq, reqs: [...s.reqs, req] };
  next = log(next, who, `Approval requested: ${r.title}`, id);
  return { s: next, id };
}

const patchDeal = (s: Store, slug: string, p: Partial<Deal>): Store =>
  s.deals[slug] ? { ...s, deals: { ...s.deals, [slug]: { ...s.deals[slug], ...p } } } : s;

export const getReq = (s: Store, id: string | null): Req | undefined => (id ? s.reqs.find((r) => r.id === id) : undefined);

export const BUYER = "Buyer B-04 (demo)";
export const SELLER_ACTOR = "Seller (demo)";

// Which slot would this person fill on this request?
export function slotFor(req: Req, p: Person): Slot | null {
  const filled = req.sigs.map((x) => x.slot);
  for (const slot of req.slots) {
    if (filled.includes(slot)) continue;
    if (p.role === slot || (p.role === "compliance" && slot === "reviewer")) return slot;
  }
  return null;
}
export const hasSigned = (req: Req, personId: string) => req.sigs.some((x) => x.personId === personId);

// ---- deal actions (buyer and seller side) ----------------------------------

export function openDeal(slug: string, lotNumber: string, qty: number, needsEnhanced: boolean) {
  update((s) => {
    if (s.deals[slug]) return s;
    let next: Store = {
      ...s,
      deals: {
        ...s.deals,
        [slug]: {
          slug, lotNumber, qty, at: Date.now(), method: "bank", enhancedReq: null, buyerSigned: false, sellerSigned: false,
          bankSent: false, fundsReq: null, cx: CX0, walletReq: null, provReq: null, docs: [], shipReq: null, buyerLab: "", assayReq: null,
          assayFinal: null, finalReq: null,
        },
      },
    };
    next = log(next, BUYER, `Reserved lot ${lotNumber} (${qty} tonnes)`, slug);
    if (needsEnhanced) {
      const r = newReq(next, {
        kind: "enhanced", slug, lotNumber, title: `Enhanced review, lot ${lotNumber} (Grade C)`, slots: ["compliance"],
      }, BUYER);
      next = patchDeal(r.s, slug, { enhancedReq: r.id });
    }
    return next;
  });
}

export function releaseReservation(slug: string) {
  update((s) => {
    const d = s.deals[slug];
    if (!d || d.buyerSigned) return s;
    const deals = { ...s.deals };
    delete deals[slug];
    return log({ ...s, deals, reqs: s.reqs.filter((r) => r.slug !== slug) }, BUYER, `Reservation released, lot ${d.lotNumber}`, slug);
  });
}

export function resetDeal(slug: string) {
  update((s) => {
    const deals = { ...s.deals };
    delete deals[slug];
    return log({ ...s, deals, reqs: s.reqs.filter((r) => r.slug !== slug) }, "Demo", "Deal restarted (demo)", slug);
  });
}

export function resetAll() {
  update(() => ({ ...EMPTY }));
}

export function setBuyerLab(slug: string, v: string) {
  update((s) => patchDeal(s, slug, { buyerLab: v }));
}
export function setMethod(slug: string, method: "bank" | "usdt") {
  update((s) => patchDeal(s, slug, { method }));
}
export function setCx(slug: string, p: Partial<Cx>) {
  update((s) => (s.deals[slug] ? patchDeal(s, slug, { cx: { ...s.deals[slug].cx, ...p } }) : s));
}

export function buyerSign(slug: string) {
  update((s) => {
    const d = s.deals[slug];
    if (!d) return s;
    return log(patchDeal(s, slug, { buyerSigned: true }), BUYER, `Buyer signed the locked terms, lot ${d.lotNumber}`, slug);
  });
}
export function sellerSign(slug: string) {
  update((s) => {
    const d = s.deals[slug];
    if (!d) return s;
    return log(patchDeal(s, slug, { sellerSigned: true }), SELLER_ACTOR, `Seller countersigned the locked terms, lot ${d.lotNumber}`, slug);
  });
}

export function walletFlagged(slug: string) {
  update((s) => {
    const d = s.deals[slug];
    if (!d || d.walletReq) return s;
    const r = newReq(s, { kind: "wallet", slug, lotNumber: d.lotNumber, title: `Flagged wallet, lot ${d.lotNumber}`, slots: ["compliance"] }, "Automatic screening (demo)");
    return patchDeal(r.s, slug, { walletReq: r.id });
  });
}
export function clearWalletRequest(slug: string) {
  update((s) => patchDeal(s, slug, { walletReq: null }));
}

export function bankSent(slug: string, amount: number) {
  update((s) => {
    const d = s.deals[slug];
    if (!d || d.fundsReq) return s;
    let next = patchDeal(s, slug, { bankSent: true });
    next = log(next, BUYER, `Buyer says the escrow transfer was sent, lot ${d.lotNumber}`, slug);
    const r = newReq(next, {
      kind: "funds", slug, lotNumber: d.lotNumber, title: `Confirm funds received, lot ${d.lotNumber}`,
      amount, unit: "USD", slots: ["reviewer"],
    }, BUYER);
    return patchDeal(r.s, slug, { fundsReq: r.id });
  });
}

export type FollowUp = { kind: "provisional" | "final"; amount: number; unit: "USD" | "USDT"; note: string };

function addRelease(s: Store, slug: string, f: FollowUp, who: string): Store {
  const d = s.deals[slug];
  if (!d) return s;
  const field = f.kind === "provisional" ? "provReq" : "finalReq";
  const existing = getReq(s, d[field]);
  if (existing && existing.status !== "rejected") return s;
  const r = newReq(s, {
    kind: f.kind, slug, lotNumber: d.lotNumber, title: `${KIND_LABEL[f.kind]}, lot ${d.lotNumber}. ${f.note}`,
    amount: f.amount, unit: f.unit, slots: ["approver", "reviewer"],
  }, who);
  return patchDeal(r.s, slug, { [field]: r.id } as Partial<Deal>);
}

export function requestRelease(slug: string, f: FollowUp) {
  update((s) => addRelease(s, slug, f, BUYER));
}

// The USDT payment reached its confirmations. The release request is raised at the same moment.
export function usdtConfirmed(slug: string, f: FollowUp) {
  update((s) => {
    const d = s.deals[slug];
    if (!d) return s;
    let next = patchDeal(s, slug, { cx: { ...d.cx, pay: "confirmed", confs: 3 } });
    next = log(next, "Demo network", `Payment of ${f.unit} ${Math.round(f.amount).toLocaleString("en-GB")} confirmed, lot ${d.lotNumber}`, slug);
    return addRelease(next, slug, f, "Platform rules");
  });
}

export function toggleDoc(slug: string, doc: string) {
  update((s) => {
    const d = s.deals[slug];
    if (!d) return s;
    const docs = d.docs.includes(doc) ? d.docs.filter((x) => x !== doc) : [...d.docs, doc];
    return patchDeal(s, slug, { docs });
  });
}

// The seller logs the handovers and attaches the export documents. A named reviewer then checks that seals and paperwork match.
// COMPLIANCE: origin and export documents are checked by a named human before the lot moves on to assay.
export function submitShipment(slug: string) {
  update((s) => {
    const d = s.deals[slug];
    if (!d) return s;
    const existing = getReq(s, d.shipReq);
    if (existing && existing.status !== "rejected") return s;
    let next = log(s, SELLER_ACTOR, `Seller logged the handovers and attached ${d.docs.length} documents, lot ${d.lotNumber}`, slug);
    const r = newReq(next, {
      kind: "shipment", slug, lotNumber: d.lotNumber, title: `Confirm shipment and documents, lot ${d.lotNumber}`, slots: ["reviewer"],
    }, SELLER_ACTOR);
    return patchDeal(r.s, slug, { shipReq: r.id });
  });
}

export function submitAssay(slug: string, buyerLab: number, independent: number) {
  update((s) => {
    const d = s.deals[slug];
    if (!d) return s;
    const existing = getReq(s, d.assayReq);
    if (existing && existing.status !== "rejected") return s;
    const r = newReq(s, {
      kind: "assay", slug, lotNumber: d.lotNumber, title: `Record the assay result, lot ${d.lotNumber}`,
      slots: ["reviewer"], assay: { buyerLab, independent },
    }, BUYER);
    return patchDeal(r.s, slug, { assayReq: r.id });
  });
}

// ---- back office actions ---------------------------------------------------

export function setWho(id: string) {
  update((s) => ({ ...s, who: id }));
}

export function setUmpire(reqId: string, v: number | undefined) {
  update((s) => ({
    ...s,
    reqs: s.reqs.map((r) => (r.id === reqId && r.assay ? { ...r, assay: { ...r.assay, umpire: v } } : r)),
  }));
}

export const TOLERANCE = 0.5; // demo rule, in Ta2O5 points
export function assayOutcome(a: { buyerLab: number; independent: number; umpire?: number }) {
  const gap = Math.round(Math.abs(a.buyerLab - a.independent) * 10) / 10;
  const within = gap <= TOLERANCE;
  const final = within ? Math.round(((a.buyerLab + a.independent) / 2) * 100) / 100 : a.umpire;
  return { gap, within, final };
}

// A person signs one slot. When every slot is filled by a different person, the request is approved
// and its deterministic consequence runs. Nobody signs twice, and nobody signs a slot they do not hold.
// COMPLIANCE: this is the four-eyes rule for money release.
export function sign(reqId: string, personId: string, followUp?: (req: Req, deal: Deal) => FollowUp | null): string | null {
  const person = PEOPLE.find((p) => p.id === personId);
  let error: string | null = null;
  update((s) => {
    const req = getReq(s, reqId);
    if (!req || !person) { error = "Request not found."; return s; }
    if (req.status !== "pending") { error = "This request is already decided."; return s; }
    if (hasSigned(req, personId)) { error = "You already signed this request. A different person must sign the other slot."; return s; }
    const slot = slotFor(req, person);
    if (!slot) { error = `This request needs a ${req.slots.filter((x) => !req.sigs.some((g) => g.slot === x)).map((x) => SLOT_LABEL[x].toLowerCase()).join(" or ")}.`; return s; }
    if (req.kind === "assay") {
      const o = assayOutcome(req.assay!);
      if (o.final === undefined || Number.isNaN(o.final)) { error = "Enter the umpire lab result first."; return s; }
    }
    const sigs = [...req.sigs, { slot, personId, at: Date.now() }];
    const done = req.slots.every((x) => sigs.some((g) => g.slot === x));
    const updated: Req = { ...req, sigs, status: done ? "approved" : "pending", decidedAt: done ? Date.now() : undefined, decidedBy: done ? personId : undefined };
    let next: Store = { ...s, reqs: s.reqs.map((r) => (r.id === reqId ? updated : r)) };
    next = log(next, person.name, `Signed as ${SLOT_LABEL[slot].toLowerCase()}: ${req.title}`, req.id);
    if (done) {
      next = log(next, "Platform rules", `Request approved: ${req.title}`, req.id);
      if (req.kind === "wallet") {
        const d = next.deals[req.slug];
        if (d) next = patchDeal(next, req.slug, { cx: { ...d.cx, screen: "passed" } });
      }
      if (req.kind === "assay") {
        const o = assayOutcome(req.assay!);
        next = patchDeal(next, req.slug, { assayFinal: o.final as number });
      }
      const dealNow = next.deals[req.slug];
      if (dealNow && followUp) {
        const f = followUp({ ...updated }, dealNow);
        if (f) next = addRelease(next, req.slug, f, "Platform rules");
      }
    }
    return next;
  });
  return error;
}

export function reject(reqId: string, personId: string, reason: string): string | null {
  const person = PEOPLE.find((p) => p.id === personId);
  let error: string | null = null;
  update((s) => {
    const req = getReq(s, reqId);
    if (!req || !person) { error = "Request not found."; return s; }
    if (req.status !== "pending") { error = "This request is already decided."; return s; }
    if (!reason.trim()) { error = "Give a reason. The buyer will see it."; return s; }
    const canAct = req.slots.some((x) => p_can(person, x));
    if (!canAct) { error = "You are not one of the named roles for this request."; return s; }
    let next: Store = {
      ...s,
      reqs: s.reqs.map((r) => (r.id === reqId ? { ...r, status: "rejected", decidedAt: Date.now(), decidedBy: personId, reason: reason.trim() } : r)),
    };
    next = log(next, person.name, `Rejected: ${req.title}. Reason: ${reason.trim()}`, req.id);
    return next;
  });
  return error;
}
const p_can = (p: Person, slot: Slot) => p.role === slot || (p.role === "compliance" && slot === "reviewer");

export function pendingFor(s: Store, personId: string): number {
  const p = PEOPLE.find((x) => x.id === personId);
  if (!p) return 0;
  return s.reqs.filter((r) => r.status === "pending" && !hasSigned(r, personId) && slotFor(r, p)).length;
}
export const pendingCount = (s: Store) => s.reqs.filter((r) => r.status === "pending").length;

export const fmtTime = (at: number) =>
  new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export function ago(at: number, now = Date.now()) {
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}
