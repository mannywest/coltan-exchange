export const GRADE_COLOUR = {
  A: "var(--verified)",
  B: "var(--amber)",
  C: "var(--copper)",
  Blocked: "var(--blocked)",
} as const;

// Darker versions that pass contrast on the paper sheet.
export const GRADE_INK = {
  A: "#006b5a",
  B: "#7a5a0a",
  C: "#b04a1e",
  Blocked: "#b3262b",
} as const;
