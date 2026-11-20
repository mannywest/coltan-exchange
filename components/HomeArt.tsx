import type { Grade } from "@/lib/grade";

// Drawn placeholders. No photos: all data on this site is invented.

// Hero: an ore sample on a scale beside a stamped certificate.
export function HeroArt() {
  return (
    <svg viewBox="0 0 520 400" role="img" aria-label="Drawing of an ore sample on a scale beside a certificate marked Grade A" className="hero-art">
      <rect x="0" y="0" width="520" height="400" fill="var(--raised)" />
      <g stroke="var(--line)" strokeWidth="1">
        {[60, 120, 180, 240, 300, 360].map((y) => (
          <line key={y} x1="0" y1={y} x2="520" y2={y} />
        ))}
      </g>
      {/* scale */}
      <rect x="40" y="300" width="230" height="28" fill="#1d2326" stroke="var(--faint)" />
      <rect x="60" y="328" width="190" height="16" fill="#141a1c" />
      <rect x="170" y="306" width="80" height="16" fill="#090b0c" stroke="var(--faint)" />
      <text x="210" y="319" textAnchor="middle" fontSize="11" fill="var(--verified)" fontFamily="var(--font-display)">12.00 t</text>
      {/* ore chunks */}
      <polygon points="70,300 100,230 150,215 195,250 215,300" fill="#3a4448" stroke="var(--faint)" />
      <polygon points="100,230 150,215 140,262" fill="#566267" />
      <polygon points="150,215 195,250 140,262" fill="#2b3336" />
      <polygon points="140,262 195,250 215,300 70,300" fill="#47545a" />
      <polygon points="130,300 165,255 205,278 215,300" fill="#6a7a82" />
      <circle cx="120" cy="258" r="3" fill="var(--verified)" />
      <circle cx="178" cy="272" r="2.5" fill="var(--verified)" />
      <circle cx="152" cy="238" r="2" fill="var(--amber)" />
      {/* sealed bag tag */}
      <rect x="222" y="262" width="40" height="26" fill="var(--paper)" />
      <text x="242" y="279" textAnchor="middle" fontSize="9" fill="var(--ink)" fontFamily="var(--font-body)">0417</text>
      {/* certificate */}
      <g transform="rotate(3 390 190)">
        <rect x="290" y="60" width="200" height="270" fill="var(--paper)" />
        <rect x="298" y="68" width="184" height="254" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <rect x="306" y="76" width="168" height="238" fill="none" stroke="var(--ink)" strokeWidth="0.75" />
        <text x="390" y="112" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--ink)" fontFamily="var(--font-display)">CERTIFICATE OF EVIDENCE</text>
        <line x1="326" y1="124" x2="454" y2="124" stroke="var(--ink)" />
        {[148, 166, 184, 202].map((y, i) => (
          <g key={y}>
            <rect x="326" y={y} width={[96, 80, 104, 70][i]} height="6" fill="#bfc3c0" />
            <circle cx="446" cy={y + 3} r="4" fill="#006b5a" />
          </g>
        ))}
        <text x="390" y="290" textAnchor="middle" fontSize="84" fontWeight="800" fill="#006b5a" fontFamily="var(--font-display)">A</text>
        <circle cx="390" cy="262" r="0" />
      </g>
    </svg>
  );
}

// Lot card picture: a pile of ore, tinted by grade. Blocked lots are crossed out.
export function LotThumb({ grade, seed }: { grade: Grade; seed: number }) {
  const n = 3 + (seed % 3);
  const tint = `var(--grade)`;
  const chunks = Array.from({ length: n }, (_, i) => {
    const x = 60 + i * (190 / n) + ((seed + i * 7) % 14);
    const h = 48 + ((seed * (i + 3)) % 34);
    return { x, h, w: 52 + ((seed + i * 5) % 22) };
  });
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label={`Drawing of ore, Trust Grade ${grade}`} className="lot-thumb">
      <rect width="320" height="200" fill="var(--raised)" />
      <rect x="0" y="150" width="320" height="50" fill="#0e1214" />
      {chunks.map((c, i) => (
        <g key={i}>
          <polygon points={`${c.x},150 ${c.x + c.w * 0.25},${150 - c.h} ${c.x + c.w * 0.7},${150 - c.h * 0.8} ${c.x + c.w},150`} fill={i % 2 ? "#3a4448" : "#47545a"} stroke="var(--faint)" />
          <polygon points={`${c.x + c.w * 0.25},${150 - c.h} ${c.x + c.w * 0.7},${150 - c.h * 0.8} ${c.x + c.w * 0.45},${150 - c.h * 0.35}`} fill="#66767d" />
          <circle cx={c.x + c.w * 0.4} cy={150 - c.h * 0.3} r="2.5" fill={tint} />
        </g>
      ))}
      <rect x="0" y="146" width="320" height="4" fill={tint} />
      {grade === "Blocked" && (
        <g stroke="var(--blocked)" strokeWidth="3">
          <line x1="40" y1="30" x2="280" y2="170" />
          <line x1="280" y1="30" x2="40" y2="170" />
        </g>
      )}
    </svg>
  );
}
