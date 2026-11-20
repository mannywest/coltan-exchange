// State for the simulated USDT flow. Everything here is pretend.
export type Cx = {
  wallet: "none" | "ok" | "flagged";
  screen: "idle" | "running" | "passed" | "flagged";
  pay: "idle" | "confirming" | "confirmed";
  confs: number;
  sigA: boolean;
  sigR: boolean;
  fSigA: boolean;
  fSigR: boolean;
};

export const CX0: Cx = {
  wallet: "none",
  screen: "idle",
  pay: "idle",
  confs: 0,
  sigA: false,
  sigR: false,
  fSigA: false,
  fSigR: false,
};

export const CONFIRMATIONS = 3;
export const NETWORK_FEE_USDT = 0.8; // demo
export const CONVERT_RATE = 0.998; // demo: 1 USDT to USD
export const CONVERT_FEE_PCT = 0.5; // demo
