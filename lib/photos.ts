import type { Lot } from "./grade";

// The four photos every lot should carry. Real photos come from field capture, each tied to the
// lot ID, time, operator and location. This demo shows drawn placeholders only.
export type PhotoKind = "scale" | "xrf" | "bags" | "handover";

export type PhotoSlot = {
  kind: PhotoKind;
  title: string;
  what: string;
  present: boolean;
  at?: string;
  by?: string;
};

// COMPLIANCE: a lot needs at least this many of the four photos before buyers can see it,
// and a reviewer must approve any lot that is missing one.
export const MIN_PHOTOS = 3;

export function photoSet(lot: Lot): PhotoSlot[] {
  const sampled = lot.evidence.sampling.status === "verified" || lot.evidence.sampling.status === "partial";
  const custodied = lot.evidence.custody.status === "verified";
  const sealed = custodied || lot.evidence.custody.status === "partial";
  const c = lot.custody;
  return [
    { kind: "scale", title: "Sample on the scale", what: "Weight display in frame and the lot ID on the bag.", present: sampled, at: c[0]?.at, by: c[0]?.by },
    { kind: "xrf", title: "Handheld reading", what: "The whole instrument screen, with every element line.", present: sampled, at: c[0]?.at, by: c[0]?.by },
    { kind: "bags", title: "Sealed bags", what: "Seal numbers readable and matching the custody log.", present: sealed, at: c[1]?.at ?? c[0]?.at, by: c[1]?.by ?? c[0]?.by },
    { kind: "handover", title: "Handover scan", what: "Seals, weight display and a location pin at the handover.", present: custodied, at: c[2]?.at, by: c[2]?.by },
  ];
}
