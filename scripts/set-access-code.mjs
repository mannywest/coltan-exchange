// Usage: node scripts/set-access-code.mjs "the new access code"
// Stores only a SHA-256 hash in lib/access.ts, never the code itself. Rebuild afterwards.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const code = process.argv[2];
if (!code || code.length < 8) {
  console.error('Give a code of at least 8 characters: node scripts/set-access-code.mjs "my code"');
  process.exit(1);
}
const hash = createHash("sha256").update(code.trim()).digest("hex");
writeFileSync(
  new URL("../lib/access.ts", import.meta.url),
  `// Hash of the demo access code. The code itself is not stored in this repo.
// Change it with: node scripts/set-access-code.mjs "new code"
// NOTE: this is a screen to keep casual visitors out. It is not real security.
// For real protection, put the hosted demo behind Cloudflare Access.
export const ACCESS_HASH = "${hash}";
`
);
console.log("Access code updated. Rebuild to apply.");
