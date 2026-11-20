# DESIGN.md: Coltan Exchange (demo)

Status: v1, 20 Nov 2026. Update after each round of feedback.

## Direction
**An assay certificate on a dark trading desk.** The lot page reads like a lab certificate that has been opened on screen: one huge grade letter, then ruled evidence rows, then tables of numbers. Calm, exact, a little severe. It should feel like paperwork a bank would accept, not like a crypto exchange or a marketplace listing.

Why this fits: buyers are commodity traders who judge a lot by its evidence and who show it to their own banks and auditors. Industrial condensed type and ruled ledgers are the vernacular of mining, assay certificates and bills of lading.

Spend the boldness in one place: the Trust Grade letter. Everything else stays quiet and disciplined.

## Colour (Plerosis base, extended with ore-derived neutrals)
| Token | Hex | Role |
|---|---|---|
| --ink | #090B0C | Page background (Plerosis) |
| --raised | #101417 | Raised panels (rail, tables) |
| --line | #2A3238 | Rules and borders |
| --paper | #F2F2EE | Main text, primary button (Plerosis) |
| --muted | #9BA4A0 | Secondary text |
| --faint | #838D89 | Tertiary text (still AA on ink) |
| --verified | #00B89C | Accent. Means "evidence verified" and Grade A only. Never decoration |
| --amber | #D6A94A | Partial evidence, Grade B |
| --copper | #E07B4F | Thin evidence, Grade C |
| --blocked | #E5484D | Failed or blocked, always paired with hatching and a word |

Colour is never the only signal: every status also has a word and a shape.

## Type
- Display: **Big Shoulders Display** 700/800. Grade letter, lot headline, big numbers. Industrial, condensed, from signage and stencilled crates.
- Body: **Manrope** (Plerosis brand font), variable. Tabular figures on all numbers.
- Scale (rem): 0.8125 / 0.9375 / 1 / 1.125 / 1.5 / 2.25 / 3.25 / grade letter clamp(9, 26vw, 17).
- Sentence case everywhere. No tracked-out capitals, no monospace labels, no arrows on links.
- Line length under 70 characters for prose.

## Space, shape, surface
- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius: 2px only. Surfaces are separated by 1px rules, not by shadows or rounded cards.
- Texture: very fine grain over the page (4% opacity); diagonal hatching on Blocked.

## Layout
- Desktop: wide evidence column (left) plus a 340px sticky rail (right) holding the locked terms and the reserve action.
- Mobile first: single column in this order: grade, locked terms and reserve, evidence, assay, custody, mine and screening, limits.
- Left aligned throughout.

## Motion
- One page-load moment: the grade letter settles in (about 450ms), then the evidence ticks draw one after another (60ms stagger).
- Motion that answers an action: the reserve panel swaps state with a short fade.
- All motion off under `prefers-reduced-motion`.

## Writing rules
- Plain verbs, sentence case. Same action keeps the same name ("Reserve this lot" then "Reserved").
- Never "guaranteed clean". Say "harder to fake, suspicious lots flagged".
- Every screen shows "Demo data". Footer: "Prepared by Plerosis with AI assistance".

## Update 20 Nov 2026: paper certificate
- The evidence area is now a paper sheet on the dark desk, so the page feels like a lab certificate, not a dark app.
- Inside `.sheet` the colour tokens swap (paper becomes ground, ink becomes text) and the status colours darken to pass contrast on paper: #006b5a verified, #7a5a0a partial, #b04a1e thin, #b3262b failed.
- Paper ground #e6e9e4 (cool mineral grey, not cream). Double hard rule border, no blur.
- A rotated stamp carries the grade and review date. It lands once on load (off under reduced motion).
- The hero grade letter, locked terms and reserve panel stay on the dark desk.
- Hosted preview: `node preview/build.mjs` after `npm run build` makes one self-contained `preview/dist/index.html` (hash routes: #all-lots, #lot-0417).

## Update 20 Nov 2026: listing, trust check, reviewer desk
- **Listing:** ruled rows on the dark desk. The Trust Grade letter is the first thing in every row (5.5rem, grade colour). Each row has a six-block evidence meter (filled, half, dashed, hatched = verified, partial, missing, failed) so evidence reads at a glance. Filter chips by grade; an empty state when a filter has no lots. A demo switch shows the lots buyers cannot see (waiting or rejected), dimmed and labelled.
- **Trust check:** same hero and rail as the lot page. The seven origin cross-checks sit on a second paper sheet ("Origin cross-check report"). The rail lists the evidence pack and a disabled "Export for your bank".
- **Reviewer desk:** a working screen, so it stays dark and dense. Queue on the left, case on the right. The AI draft summary is in a dashed box labelled as AI-written. Decision rules are fixed: Blocked lots cannot be approved; Grade C lots can only be approved with conditions; conditions and rejection need a written reason.

## Update 20 Nov 2026: photo evidence
- Four required photos per lot: sample on the scale, handheld reading, sealed bags, handover scan. Buyers need at least three, and a reviewer must approve a lot missing one.
- No decorative or marketing images. The demo uses drawn line placeholders on dark tiles; missing photos show as dashed tiles.
- Buyer copies have location data removed and are checked for people. Photos never raise a grade on their own.

## Update: seller, deal flow, onboarding, registry, languages
- Screens added: List a lot (/sell), Deal (/lots/{slug}/deal, six locked stages), Get cleared (/onboarding), Mine registry (/registry).
- Languages: EN, FR, 中文 through useT(); English text is the key, translations in lib/i18n-dict.ts. Lot evidence and case notes stay English in the demo.
- Rules stay deterministic: mine must be Verified/Watch to list; photos >= 3; named approver ticks before any payment; umpire lab when assay gap > 0.5; sanctioned countries and designated names hard-block onboarding.

## Update: outsider-clarity pass
- Home page is the front door (/): what it is, who are you, how it works (4 steps), what grades mean, terms in plain words. Lots list moved to /lots.
- "Viewing as" switch: Visitor, Buyer, Seller, Reviewer. Menu shows only that role's screens; reviewer desk, mine registry and List a lot show a gate unless the matching view is chosen (demo stand-in for login).
- Every grade letter has a plain label: A Strong evidence, B Good evidence with gaps, C Weak evidence, Blocked Cannot be traded.
- Trade terms (Ta2O5, assay, umpire lab, grade basis, CIF, custody log) have tap or hover meanings (components/Term.tsx, lib/glossary.ts).
- Get cleared is first in the menu for visitors, buyers and sellers.
- Mobile lot page: fixed bar with price and Reserve so the action is always in reach.
