// DEMO ONLY. No real blockchain, wallet or token is used anywhere. These helpers make
// stable, obviously fake-looking identifiers so the demo can show how a contract would read.
function mix(seed: string, salt: number): string {
  let h = 2166136261 ^ salt;
  // Fold the whole seed in first so every output chunk depends on all of it.
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  let out = "";
  for (let i = 0; out.length < 64; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i * 31 + salt;
    h = Math.imul(h, 16777619) >>> 0;
    out += (h >>> 0).toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

export const demoHash = (seed: string, salt = 1) => `0xDEMO${mix(seed, salt).slice(0, 56)}`;
export const demoAddress = (seed: string) => `0xDEMO${mix(seed, 7).slice(0, 36)}`;
export const short = (s: string) => `${s.slice(0, 10)}…${s.slice(-6)}`;

export const demoBlock = (seed: string) => 4000000 + (parseInt(mix(seed, 11).slice(0, 5), 16) % 90000);

// A fake QR-style grid, for show only. It is not scannable and encodes nothing.
export function demoGrid(seed: string, n = 25): boolean[][] {
  const bits = (mix(seed, 20) + mix(seed, 21) + mix(seed, 22) + mix(seed, 23))
    .split("")
    .map((c) => parseInt(c, 16).toString(2).padStart(4, "0"))
    .join("");
  const g = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => bits[y * n + x] === "1"));
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        g[oy + y][ox + x] = edge || core;
      }
    for (let i = 0; i < 8; i++) {
      if (oy + 7 < n && ox + i < n) g[oy + 7][Math.min(n - 1, ox + i)] = false;
    }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  return g;
}
