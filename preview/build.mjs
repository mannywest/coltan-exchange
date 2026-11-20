// Builds the hosted preview: ONE self-contained index.html (CSS, fonts, JS all inline).
// Run after `npm run build`:  node preview/build.mjs
import { build } from "esbuild";
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const chunks = join(root, ".next/static/chunks");
const media = join(root, ".next/static/media");

// 1. CSS from the Next build, keeping only the latin font files, inlined as data URIs.
const cssFile = readdirSync(chunks).find((f) => f.endsWith(".css"));
let css = readFileSync(join(chunks, cssFile), "utf8");
css = css.replace(/@font-face\{[^}]*\}/g, (block) => {
  const m = block.match(/url\(\.\.\/media\/([^)]*?-latin-(?:\d+|wght)-normal\.[^)]*?\.woff2)\)/);
  if (!m) return "";
  const data = readFileSync(join(media, m[1])).toString("base64");
  return block.replace(/src:[^;}]*/, `src:url(data:font/woff2;base64,${data}) format("woff2")`);
});

// 2. Browser bundle (React and the real LotView component).
const out = await build({
  entryPoints: [join(root, "preview/entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  tsconfig: join(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

// 3. One HTML file.
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coltan Exchange (demo) | Plerosis</title>
<meta name="description" content="Demo of a neutral, invite-only exchange for tantalum ore. All data is invented.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23090B0C'/%3E%3Cpath d='M8 22V10h9a4 4 0 0 1 0 8h-5' fill='none' stroke='%2300B89C' stroke-width='3'/%3E%3C/svg%3E">
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;

mkdirSync(join(root, "preview/dist"), { recursive: true });
writeFileSync(join(root, "preview/dist/index.html"), html);
console.log("preview/dist/index.html", Math.round(html.length / 1024) + " KB");
