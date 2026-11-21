// Demo money rules, in one place. Deterministic: no AI sets a price or a fee.
export const LB_PER_TONNE = 2204.62;
export const PROVISIONAL_SHARE = 0.8; // share paid into escrow first
export const PLATFORM_FEE_PCT = 1; // demo figure, per side, charged only when payment is released
export const MIN_TONNES = 2; // smallest quantity a buyer can ask for in the demo

export function lotValue(tonnes: number, gradePct: number, usdPerLb: number): number {
  return tonnes * LB_PER_TONNE * (gradePct / 100) * usdPerLb;
}

// The grade used for estimates before the lot ships: the independent lab, else the seller's lab, else the basis.
export function preShipGrade(lot: { basisTa2O5: number; assay: { independentLab: number | null; sellerLab: number | null } }): number {
  return lot.assay.independentLab ?? lot.assay.sellerLab ?? lot.basisTa2O5;
}
