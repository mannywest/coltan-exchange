// Illustrative mineral photos (not real lots). Files live in public/samples.
// Credits are shown wherever a photo appears.
export type SampleKey = "tantalite" | "manganotantalite";

export const SAMPLES: Record<SampleKey, { alt: string; credit: string }> = {
  tantalite: {
    alt: "Photo of a dark tantalite rock specimen",
    credit: "Tantalite, Pilbara, Australia. Photo: Andrew Silver, Brigham Young University collection (public domain, via Wikimedia Commons).",
  },
  manganotantalite: {
    alt: "Photo of two manganotantalite crystals",
    credit: "Manganotantalite crystals, Brazil. Photo: Eurico Zimbres and Tom Epaminondas (free for all use, via Wikimedia Commons).",
  },
};

export function sampleSrc(k: SampleKey): string {
  const w = globalThis as unknown as { __SAMPLES?: Record<string, string> };
  return w.__SAMPLES?.[k] ?? `/samples/${k}.jpg`;
}
