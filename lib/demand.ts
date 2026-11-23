"use client";

// Demand board store: buyers post anonymous standing requirements, sellers see them, the back office can pause them.
// Lives in the browser tab (session storage). No server, no database. All names are fictional.
// COMPLIANCE: a requirement is not a deal. Both sides must be cleared and a lot approved before any match.
// In the real product, posting needs a cleared buyer and buyers stay anonymous to sellers until matched.
import { useSyncExternalStore } from "react";
import { BUYER, auditNote } from "./dealStore";
import { MIN_TONNES } from "./price";

export type Incoterm = "CIF Demo Port" | "FOB Demo Port";
export type DemandReq = {
  id: string;
  buyer: string; // fictional name, shown only to the back office and to the buyer who posted it
  mine: boolean; // posted by the person using the demo
  tonnes: number;
  basis: number;
  incoterm: Incoterm;
  neededBy: string;
  maxPrice: number | null;
  status: "open" | "paused";
  interested: boolean; // a seller has said they can supply
  at: number;
};
export type DemandState = { reqs: DemandReq[]; seq: number; responding: string | null };

export const NEEDED_BY = ["Within 4 weeks", "Within 6 weeks", "Within 8 weeks", "Within 12 weeks"] as const;
export const MAX_TONNES = 200;

const seed = (): DemandState => {
  const at = Date.now() - 3600_000;
  return {
    seq: 3,
    responding: null,
    reqs: [
      { id: "DR-001", buyer: "Buyer B-11 (demo)", mine: false, tonnes: 10, basis: 25, incoterm: "CIF Demo Port", neededBy: "Within 4 weeks", maxPrice: 160, status: "open", interested: false, at },
      { id: "DR-002", buyer: "Buyer B-23 (demo)", mine: false, tonnes: 24, basis: 25, incoterm: "FOB Demo Port", neededBy: "Within 8 weeks", maxPrice: null, status: "open", interested: false, at },
      { id: "DR-003", buyer: "Buyer B-09 (demo)", mine: false, tonnes: 6, basis: 25, incoterm: "CIF Demo Port", neededBy: "Within 6 weeks", maxPrice: 145, status: "open", interested: false, at },
    ],
  };
};

const KEY = "cx-demand-v1";
let state: DemandState = seed();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw) as DemandState;
  } catch {}
}
function subscribe(l: () => void) {
  hydrate();
  listeners.add(l);
  queueMicrotask(l);
  return () => listeners.delete(l);
}
const SERVER: DemandState = { reqs: [], seq: 0, responding: null };

export function useDemand(): DemandState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

function set(fn: (s: DemandState) => DemandState) {
  hydrate();
  state = fn(state);
  emit();
}

// Returns an error message, or null when the requirement was posted.
export function postDemand(input: { tonnes: number; incoterm: Incoterm; neededBy: string; maxPrice: number | null }): string | null {
  const { tonnes, incoterm, neededBy, maxPrice } = input;
  if (!(tonnes >= MIN_TONNES && tonnes <= MAX_TONNES)) return `Quantity must be between ${MIN_TONNES} and ${MAX_TONNES} tonnes.`;
  if (maxPrice !== null && !(maxPrice >= 1 && maxPrice <= 1000)) return "A price cap must be between USD 1 and USD 1,000 per lb, or left empty.";
  hydrate();
  const id = `DR-${String(state.seq + 1).padStart(3, "0")}`;
  set((s) => ({
    ...s,
    seq: s.seq + 1,
    reqs: [{ id, buyer: BUYER, mine: true, tonnes, basis: 25, incoterm, neededBy, maxPrice, status: "open", interested: false, at: Date.now() }, ...s.reqs],
  }));
  auditNote(BUYER, `Requirement posted: ${tonnes} t, ${incoterm.split(" ")[0]}`, id);
  return null;
}

// A seller says they can supply. Opens List a lot with the quantity and delivery term filled in.
export function respond(id: string) {
  set((s) => ({ ...s, responding: id, reqs: s.reqs.map((r) => (r.id === id ? { ...r, interested: true } : r)) }));
}
export function clearResponding() {
  set((s) => ({ ...s, responding: null }));
}

// COMPLIANCE: pausing or removing a requirement is a back office action and is written to the audit log.
export function setPaused(id: string, paused: boolean, who: string) {
  set((s) => ({ ...s, reqs: s.reqs.map((r) => (r.id === id ? { ...r, status: paused ? "paused" : "open" } : r)) }));
  auditNote(who, paused ? "Requirement paused" : "Requirement reopened", id);
}
export function removeDemand(id: string, who: string) {
  set((s) => ({ ...s, reqs: s.reqs.filter((r) => r.id !== id) }));
  auditNote(who, "Requirement removed", id);
}

export function resetDemand() {
  hydrate();
  state = seed();
  emit();
}
