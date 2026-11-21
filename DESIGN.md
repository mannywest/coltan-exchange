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

## Update: fuller home page and lot pictures
- Home: hero with drawn ore-and-certificate illustration, live stats, four featured lot cards, the problem, six-stage trade, trust grade key, seven origin checks, "what we will not do", role cards, FAQ, glossary.
- Pictures are drawn placeholders only (components/HomeArt.tsx): no stock or web photos, because all data is invented. Lot pictures tint by grade; Blocked lots are crossed out. Lots list rows also carry a picture. Replace with real field photos later.

## Update: data visuals instead of photos
- Photos were tried and removed: they felt out of place and clumpy. Rock photos are not used anywhere.
- Home hero shows a compact paper certificate built from a real demo lot (grade, six checks, assay chart). Faint contour lines sit behind the hero.
- Lot cards and list rows carry a small assay chart (field, seller lab, independent lab on a 22 to 28 percent Ta2O5 scale, basis marked) plus the check meter. Blocked lots are dimmed.
- Lot-page photo evidence still uses drawn placeholders until real field photos exist.

## Update: UX review fixes
- Refresh keeps your place and language/role within a tab; a brand-new visit opens on home.
- Reserve needs a cleared buyer (Get cleared, or a labelled demo shortcut).
- Mobile header is two rows; tap targets are 44px; grade reason sentence translates; "Demo view" label; meta description and favicon added.

## Update: free-flowing transaction (screening moved to a later phase)
- Reserve no longer requires being cleared. Get cleared stays as an optional page. Sanctions and screening are planned for a later phase and are not promised on the home page.
- Lot page and Reserve show an estimated total and the 80% provisional amount (tonnes x 2,204.62 lb x grade basis x price), marked as an estimate until the lab confirms.
- Buyer menu: Lots first, Get cleared last. Role cards go straight to Lots or List a lot.

## Round: assay chart made readable
- Lot page: heading line, plain caption, larger scale with "Selling grade" marker, shaded allowed range (0.5 points) around the independent lab result, a key naming each dot with its figure, and a one-line verdict from a fixed rule (labs agree within 0.5 points, or the umpire lab decides).
- Cards and home certificate: compact scale plus the same one-line verdict. Evidence-check segments now read "n of 6 checks verified".
- Verdict wording is a rule check, never "clean" or "guaranteed". Lab names stay fake.

## Round: first-time-reader gaps
- Buyer can enter a quantity (2 tonnes up to the whole lot); total, escrow amount and demo platform fee update live. A part-lot request needs the seller's agreement (human step).
- Lot page gains three plain blocks: How the price works (worked example from the lot's own numbers, lab grade replaces basis, demo fee 1% per side at release), How long a deal takes (about 3 to 4 weeks, demo), If something goes wrong (umpire lab, named Reviewer, named Compliance officer; AI never decides).
- Figures live in lib/price.ts. COMPLIANCE comments added at the fee/escrow/dispute spots.

## Round: simulated USDT and smart contract
- Deal step 3 now asks "How will you pay?": bank escrow (default) or USDT through a smart contract (simulated). Choosing USDT adds a "Fund the contract" action and a contract panel: fake address, demo network, 1 USDT = 1 USD, release needs 2 of 3 named people (Approver, Reviewer, Compliance officer), no AI key, and a log of events with fake transaction IDs.
- Lot page shows a demo certificate fingerprint with a plain note that a live version would record it on a public ledger (no money, no names).
- Clearly labelled simulation; nothing real. COMPLIANCE: stablecoin use needs legal opinion, wallet screening, licensed partner and a frozen-funds plan; all shown as "planned later". Helpers in lib/chain.ts produce obviously fake "0xDEMO..." identifiers.
- Preview fix: deep links to #deal- and #check- pages are now honoured on a first visit.

## Round: realistic simulated USDT flow
- Step 3 for USDT now runs: connect a demo wallet (or try a flagged one) -> screening result -> payment screen (fake QR, exact amount, contract address, payment window) -> confirming on the network (1 of 3, 2 of 3, 3 of 3) -> confirmed with block number and network fee -> two named people sign (approver and reviewer) -> released.
- Final payment needs the same two signatures. Panel adds an escrow statement (paid in, released, refunded, held, demo fee), an email-style notifications list, a seller's view (incoming payment, keep USDT or convert at a demo rate and fee) and a downloadable demo receipt with the certificate fingerprint.
- Flagged wallet: funds paused, sent to a named Compliance officer, buyer must use another wallet.
- All simulated with timers and fake data; "0xDEMO" identifiers; Simulation banner kept. COMPLIANCE comments in UsdtFlow, SignPanel and ContractExtras.

## Round: tabs, progress, side panel, grade bar, access gate
- Lot page: certificate now has tabs (Evidence, Assay, Price and timing, If something goes wrong). Photo evidence, custody and mine sit under Evidence. Long captions moved into tap-to-open "?" hints (Hint component).
- Deal page: progress bar ("Step n of 6"), only the current step is open, finished steps fold into one line, and a "Confirm the assay result" action ends step 4. On wide screens the contract panel sits beside the steps and stays in view.
- Compact grade bar (cards, list, home certificate) redesigned: one bar that fills to the lot's tantalum reading (independent lab first), a tick and label at the selling grade, labelled ends 22% and 28%, and a plain-words line under it. The detailed dot chart stays on the lot page.
- Access gate: the whole demo opens on a "Private demo" screen asking for an access code. Only a SHA-256 hash is stored (lib/access.ts); change it with `node scripts/set-access-code.mjs "new code"` and rebuild. A few seconds' delay grows after wrong tries. This is a screen for casual visitors, not real security: for real protection use Cloudflare Access when hosted.
- Success pop on payment confirmation (off if the visitor prefers reduced motion).

## Round: consistency pass
- Money reads the same way everywhere: "USD 150", "USDT 800,013" (code first, then amount, thousands separated).

## Round 6 (21 Nov 2026): back office and buyer-clarity fixes
- **Back office added.** Every step that moves money, records an assay result or clears a flagged party is now an approval request, not a buyer tick-box. Requests: enhanced review (Grade C lots), flagged wallet, confirm funds received (bank route), provisional release, assay result, final release.
- **Four-eyes rule.** Releases need a named approver and a named reviewer, two different people. Nobody signs twice. Assay results need a named reviewer (with the umpire result entered if the labs differ by more than 0.5 points). Flagged wallets and Grade C buyers need a named Compliance officer. The person who asks never approves.
- **Back office screen** (`components/BackOffice.tsx`): "Signed in as" person (three fictional staff), queue with checks computed by code (`lib/approvals.ts`), reject-with-reason (buyer sees the reason), deals view, and a tamper-evident audit log (each entry is chained to the one before it; demo fingerprints only).
- **Shared state** (`lib/dealStore.ts`): deals, requests and audit log live in session storage for the tab. No server, no database.
- **My deals / Deals** (`components/Deals.tsx`): buyer's list of reservations with the next action and who must act; the seller countersigns here. Part-lot requests need the seller's agreement.
- **Role switch:** Visitor removed (it matched Buyer). Views are Buyer, Seller, Back office.
- **Clarity fixes from the buyer review:** one consistent line on screening ("simulated here, required in the real product"); estimated total and escrow amount now use the independent lab result so the lot page and the deal agree; Grade C warning and enhanced review; listing text no longer says lots are "approved"; CIF/FOB label fixed; quantity errors shown instead of silently changing the number; origin-check wording; glossary extended (FOB, provisional payment, tolerance, beneficial owner, back office); FAQ on who approves a payment.
- **Not yet translated:** new back office and deal strings are English only (French and Chinese fall back to English).

## Round 7: shipment step, guided demo, restart
- New step 4 "Shipment and documents": seller attaches five documents and submits a shipment record; a named reviewer confirms before assay opens. Flow is now 7 steps.
- "Guided demo" panel: shows the seven steps, says who to be next and links there. It only points; it never signs or approves. Starts open on wide screens, a small button on phones.
- "Restart demo": always visible in the demo bar and in the panel; needs a second click to confirm.
- Glossary tips on phones sit inside the screen.
