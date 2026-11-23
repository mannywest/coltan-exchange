# CLAUDE.md: Coltan Exchange

Read IDEA.md first. This file holds the standing rules for every session in this folder.

## Plerosis standard rules
<!-- Paste your standard Plerosis CLAUDE.md here. The rules below are the project-specific additions. -->
- Architecture principle: deterministic code handles logic and consequences; AI handles interpretation, explanation and drafting only; a named human approves anything irreversible or financial.
- Confirm before building anything large. Ask before publishing or deploying. Hold before redeploying until I review.
- I am not a coder. Explain choices in plain words, with an analogy where it helps. Give independent views, not agreement.
- Be token-efficient: do not generate or view images unless needed. Check with numbers and builds first, and look at one combined screenshot at the end.

## This is a regulated trade
Treat the product as a regulated commodity market (conflict minerals, sanctions, OECD due diligence).
- Flag every place a screen, field or feature touches sanctions, conflict-mineral due diligence, counterparty screening, origin claims or payments. Add a comment `// COMPLIANCE:` at that spot and list them in your summary.
- Never imply a lot is "guaranteed clean" or "conflict-free". Use "harder to fake, suspicious lots flagged" or similar plain wording.
- Never show exact mine or route coordinates to a buyer view. Show an evidence summary and a mine tier only.
- Platform rule: no clients in sanctioned countries; the platform never trades for itself or holds client money.
- AI features may summarise, translate and flag. They must never approve a lot, release money or change a mine tier. Show those as human-approval steps with a named role.

## Data: clearly fake only
- All lot, seller, buyer and mine data is pretend. Use obviously fictional names (e.g. "Demo Seller 1", "Mine A (demo)") and round demo numbers.
- Never use real company names, real mines, real people, real sanctions designations or real prices. Put a visible "Demo data" label on every screen.
- No real credentials, keys or personal data anywhere.

## Design
- Read FRONTEND.md before building any UI, and follow it. Write DESIGN.md before building screens, and update it after my feedback.
- Use the frontend-design skill. It must not look like a default AI app or like a generic crypto exchange.
- Brand base: Plerosis dark theme (#090B0C background, #F2F2EE text, accent #00B89C, Manrope font) is the starting palette. Within it, name one aesthetic direction chosen for commodity buyers and sellers in DESIGN.md.
- Text wordmark "Plerosis" until the official file is confirmed.
- Build ONE key screen first (the lot detail page), show me, then build the rest after I approve.
- Footer line: "Prepared by Plerosis with AI assistance".
- Do not mention the voice note, the client's name, Claude or Anthropic in anything shareable.

## Tech
- Next.js (App Router) with TypeScript and Tailwind, in this folder. Pretend data lives in one `data/` folder of typed TypeScript files. No database, auth or external calls until I say so.
- Keep it simple enough that I can run `npm run dev` and click through it.

## Out of scope until told otherwise
Payments and escrow, real integrations, database, login, auctions, price index, other minerals. (Added with Manny's approval on 23 Nov 2026: the simulated assistant, message-to-lot, assay helper and demand board. An RFQ-style requirement can be posted on the demand board, nothing more.)
