# IDEA.md: Coltan Exchange (working name)

Status: draft v1, 20 Nov 2026. Built from the Mineral platform project docs. Items marked (confirm) are assumptions to check with James before anything real is built.

## What it is, in one line
A neutral, invite-only exchange where verified sellers list lots of tantalum ore (coltan) and screened buyers buy them, with the evidence (assay, custody, screening) attached to every lot.

Analogy: the buyer sees a menu with a label on each dish saying where it came from and how good it is. The kitchen (the checks) decides what reaches the menu.

## Who uses it
- **Buyers:** Chinese tertiary-market traders first (James already deals with them), later smelters. They want a lot they can trust and defend to their own banks and auditors.
- **Sellers:** James first, as the anchor seller (confirm he is willing to sell on a neutral platform). Later other vetted sellers.
- **Compliance reviewer:** a named person at Plerosis who approves any lot that is not clearly clean.
- **Independent assay lab / umpire:** settles grade disputes (later phase).

## The problem
- Nobody can easily prove where a lot came from or what grade it really is. Handheld XRF gives a Ta reading (x 1.22 = estimated Ta2O5), and many Congolese labs have closed, so buyers re-test and disputes follow.
- Price is opaque: only paid assessments exist, with no open price from real deals.
- Origin paperwork can be faked; tags alone are not trusted. Sanctions risk is live.
- Existing tools are fragmented: traceability firms serve smelters, listing boards have no evidence link.

## The main journey (the 8-stage lot journey, confirm with James)
1. A seller lists a lot (grade basis, tonnage, incoterm, price basis).
2. Field test and sample split are recorded (handheld reading, lot ID, date, GPS, operator, photos).
3. Compliance check: mine tier, counterparty screening, cross-checks. A named reviewer approves. Buyers only see approved lots.
4. Move: sealed, scanned, documented handovers.
5. A buyer opens the lot page, sees its Trust Grade and evidence summary, agrees locked terms and reserves it.
6. Assay on arrival; umpire lab for disputes.
7. Payment through a regulated escrow partner.
8. An evidence pack is kept for the buyer's and bank's own checks.

## Version one: the one thing it must do
A buyer can browse approved lots, open one, see why it can be trusted (Trust Grade, assay, evidence summary, mine tier) and reserve it on locked terms. Everything else is a stub.

Version one is clickable screens with pretend data. The point is to show James and 2-3 buyers the experience and learn what to build next.

## Trust Grade (the heart of the product)
Each lot gets A / B / C / Blocked, built from independent evidence, never seller claims alone. The honest claim is "harder to fake, suspicious lots flagged", never "guaranteed clean".

## Out of scope for now
- Payments and escrow (show a placeholder status only)
- Real integrations (sanctions screening, KYC, labs, WhatsApp, price feeds)
- Database and login
- Other minerals and other countries
- Auctions, RFQ, price index (later phases)
- Any real names, mines, coordinates or prices

## Hard rules
- No clients in sanctioned countries. The platform never trades on its own account and never holds client money.
- AI assists (summaries, translation, flags). It never approves a lot, releases money or changes a mine's tier.
- Exact mine and route locations are never shown to buyers.

## Open questions (answers change the build)
- Which lots, route, documents and payment terms does James actually use today?
- Would James sell on a neutral platform with open rules?
- Which jurisdiction and entity runs the exchange, and what does a lawyer say about marketplace status and sanctions exposure?
- Which inspector and umpire lab would Chinese buyers accept?
