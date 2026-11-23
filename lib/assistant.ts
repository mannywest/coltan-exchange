// The "front of house" logic for the demo assistant, message-to-lot and the dispute helper.
// SIMULATED: fixed rules and templates, no live AI call. A real version would use a language model
// that reads ONLY the record the user may already see, and the same limits below would stay.
// COMPLIANCE: the assistant explains, compares and drafts. It never approves a lot, signs, releases money,
// changes a mine tier, shows a mine or route location, or reveals who a seller or buyer is.
import { CHECK_LABELS, computeGrade, type Lot } from "./grade";
import { GLOSSARY } from "./glossary";
import { LB_PER_TONNE, MIN_TONNES, preShipGrade } from "./price";
import { mines } from "@/data/mines";
import { dealStage } from "./approvals";
import { TOLERANCE, assayOutcome, pendingCount, pendingFor, type Store } from "./dealStore";
import type { DemandReq } from "./demand";
import type { Routes } from "./routes";

export type Role = "buyer" | "seller" | "reviewer";

// ---------------------------------------------------------------------------
// 1. Message to lot
// ---------------------------------------------------------------------------

export type FieldKey = "tonnes" | "incoterm" | "price" | "ta" | "operator" | "mine";
export type FieldState = "clear" | "unsure" | "missing";
export type ParsedField = {
  key: FieldKey;
  label: string;
  state: FieldState;
  value: string; // what would go into the form (empty unless clear)
  heard: string; // what the message said, for the read-back
  question?: string; // follow-up for unsure or missing
};
export type ParsedMessage = { fields: ParsedField[]; notes: string[]; readBack: string };

export const EXAMPLE_MESSAGE = "12t ready next wk, reading 19, cif china, 150 usd per lb, mine A";

const num = (s: string) => Number(s.replace(",", "."));

// COMPLIANCE: the message is a seller claim. Nothing here sets a grade or counts as evidence.
// The full instrument reading, scale weight and photos are still required on the form.
export function parseLotMessage(raw: string): ParsedMessage {
  const text = raw.trim();
  const notes: string[] = [];
  const fields: ParsedField[] = [];

  // Quantity
  {
    const hits = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*(kg|tonnes?|tons?|t)\b/gi)];
    const f: ParsedField = { key: "tonnes", label: "Quantity (tonnes)", state: "missing", value: "", heard: "", question: "How many tonnes are in the lot?" };
    if (hits.length) {
      const first = hits[0];
      const v = num(first[1]);
      const kg = first[2].toLowerCase() === "kg";
      const distinct = new Set(hits.map((h) => `${num(h[1])}${h[2].toLowerCase() === "kg"}`)).size > 1;
      f.heard = first[0];
      if (kg || distinct || !(v > 0) || v > 500) {
        f.state = "unsure";
        f.question = kg ? "That was in kilograms. How many tonnes is that?" : distinct ? "I heard two different quantities. Which one is the lot?" : "That quantity looks odd. How many tonnes?";
      } else {
        f.state = "clear";
        f.value = String(v);
        f.question = undefined;
      }
    }
    fields.push(f);
  }

  // Delivery term
  {
    const cif = /\bcif\b/i.test(text);
    const fob = /\bfob\b/i.test(text);
    const f: ParsedField = { key: "incoterm", label: "Delivery", state: "missing", value: "", heard: "", question: "Is the price CIF (you pay shipping) or FOB (buyer pays shipping)?" };
    if (cif !== fob) {
      f.state = "clear";
      f.heard = cif ? "CIF" : "FOB";
      f.value = cif ? "CIF Demo Port" : "FOB Demo Port";
      f.question = undefined;
    } else if (cif && fob) {
      f.state = "unsure";
      f.heard = "CIF and FOB";
      f.question = "I heard both CIF and FOB. Which one?";
    }
    fields.push(f);
  }

  // Price per pound of Ta2O5
  {
    const m = text.match(/(?:usd|us\$|\$)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:usd|dollars?|\$)|\bprice\s*(?:is|of|at|:)?\s*(\d+(?:[.,]\d+)?)/i);
    const f: ParsedField = { key: "price", label: "Asking price (USD per lb Ta2O5)", state: "missing", value: "", heard: "", question: "What is the asking price, in USD per pound of Ta2O5?" };
    if (m) {
      const v = num(m[1] ?? m[2] ?? m[3]);
      f.heard = m[0].trim();
      const perLb = /(per\s*lb|\/\s*lb|a\s*pound|per\s*pound)/i.test(text);
      if (!perLb || !(v >= 1 && v <= 1000)) {
        f.state = "unsure";
        f.question = "Is that USD per pound of Ta2O5? Please say the unit.";
      } else {
        f.state = "clear";
        f.value = String(v);
        f.question = undefined;
      }
    }
    fields.push(f);
  }

  // Handheld Ta reading
  {
    const m = text.match(/(?:\breading|\bxrf|\bta)\s*(?:is|was|of|=|:)?\s*(\d{1,2}(?:[.,]\d+)?)/i);
    const f: ParsedField = { key: "ta", label: "Ta reading (%)", state: "missing", value: "", heard: "", question: "What did the handheld show for Ta, in percent?" };
    if (m) {
      const v = num(m[1]);
      f.heard = `reading ${m[1]}`;
      if (/ta2o5|pentoxide/i.test(text) || !(v > 0) || v > 65) {
        f.state = "unsure";
        f.question = "Is that the Ta reading from the handheld, not the Ta2O5 estimate? It must be 65 or less.";
      } else {
        f.state = "clear";
        f.value = String(v);
        f.question = undefined;
      }
    }
    fields.push(f);
  }

  // Operator
  {
    const m = text.match(/operator[:\s]+(?:is\s+|was\s+)?([A-Za-z][\w'-]+(?:\s[A-Z][\w'-]+)?)/i);
    const f: ParsedField = { key: "operator", label: "Operator who took the reading", state: "missing", value: "", heard: "", question: "Who took the reading?" };
    if (m) {
      f.state = "clear";
      f.heard = `operator ${m[1]}`;
      f.value = m[1];
      f.question = undefined;
    }
    fields.push(f);
  }

  // Mine (name only. Locations are never read from a message)
  {
    const m = text.match(/\bmine\s+([A-HJ-K])\b/i);
    const f: ParsedField = { key: "mine", label: "Source mine", state: "missing", value: "", heard: "", question: "Which mine is the lot from?" };
    if (m) {
      const name = `Mine ${m[1].toUpperCase()} (demo)`;
      const mine = mines.find((x) => x.name === name);
      f.heard = `mine ${m[1].toUpperCase()}`;
      if (!mine) {
        f.state = "unsure";
        f.question = "I could not find that mine. Which one is it?";
      } else if (mine.tier === "Blocked" || mine.tier === "Unverified") {
        // COMPLIANCE: only Verified and Watch mines can supply lots.
        f.state = "unsure";
        f.question = `${mine.name} is ${mine.tier} and cannot supply lots. Which mine is it from?`;
      } else {
        f.state = "clear";
        f.value = name;
        f.question = undefined;
      }
    }
    fields.push(f);
  }

  // Things the assistant will not carry into the draft
  if (/\b\d{1,3}\.\d{3,}\s*[,;]\s*-?\d{1,3}\.\d{3,}\b|\bgps\b|\bcoordinates?\b/i.test(text)) {
    notes.push("Location details were left out of the draft. Locations are kept for reviewers only, and buyers never see them.");
  }
  const claim = text.match(/\b(clean|conflict[- ]free|guaranteed|certified)\b/i);
  if (claim) {
    notes.push(`"${claim[1].toLowerCase()}" is a claim, not evidence. It is not used or shown. The grade comes from the checks.`);
  }
  if (/ignore (all |your |previous |the )*(instructions|rules)|approve (this|the) lot|release (the )?(money|payment)|set (the )?grade/i.test(text)) {
    notes.push("The message contains an instruction. The assistant treats messages as data and ignores instructions in them. Only named people approve lots or release money.");
  }

  const clear = fields.filter((f) => f.state === "clear");
  const readBack = clear.length
    ? "I understood: " +
      clear
        .map((f) => {
          if (f.key === "tonnes") return `${f.value} tonnes`;
          if (f.key === "incoterm") return f.heard;
          if (f.key === "price") return `USD ${f.value} per lb of Ta2O5`;
          if (f.key === "ta") return `handheld Ta reading ${f.value}%`;
          if (f.key === "operator") return `reading taken by ${f.value}`;
          return f.value;
        })
        .join(", ") +
      "."
    : "I could not read any field with confidence.";
  return { fields, notes, readBack };
}

// ---------------------------------------------------------------------------
// 2. Dispute helper (assay step)
// ---------------------------------------------------------------------------

export type DisputeHelp = { lines: string[]; next: string; draft: string };

// Only for results outside the agreed tolerance. A named reviewer records the outcome. This never decides it.
export function disputeHelp(lotNumber: string, a: { buyerLab: number; independent: number; umpire?: number }): DisputeHelp | null {
  const o = assayOutcome(a);
  if (o.within) return null;
  const fmt = (n: number) => `${n.toFixed(2).replace(/\.?0+$/, "")}%`;
  const lines = [
    `Buyer's lab: ${fmt(a.buyerLab)} Ta2O5. Independent lab: ${fmt(a.independent)} Ta2O5. Gap: ${o.gap.toFixed(1)} points.`,
    `The published rule allows ${TOLERANCE} points. This gap is outside it, so the average cannot be used.`,
    "Under the rule, the sealed umpire sample is opened at the umpire lab and its result decides the final grade.",
    "Common reasons for a gap like this: the samples were not the same mix, moisture or sample preparation differed, or an instrument needs calibrating. None of these is a finding about either lab.",
  ];
  let next = "Next step: a named reviewer opens the umpire sample and enters its result in the back office.";
  if (a.umpire !== undefined) {
    const dB = Math.abs(a.umpire - a.buyerLab);
    const dI = Math.abs(a.umpire - a.independent);
    lines.push(`Umpire result: ${fmt(a.umpire)}. It is ${dB.toFixed(1)} from the buyer's lab and ${dI.toFixed(1)} from the independent lab. It decides the final grade.`);
    next = "Next step: the reviewer records the umpire result and the final payment is raised from it.";
  }
  const draft = [
    `Subject: Assay result, lot ${lotNumber}`,
    "",
    "Hello both,",
    `The two lab results for lot ${lotNumber} differ by ${o.gap.toFixed(1)} points, outside the ${TOLERANCE} point tolerance in the published rules.`,
    a.umpire !== undefined
      ? `The umpire lab result is ${fmt(a.umpire)}. Under the rules it decides the final grade, and the final payment is calculated from it.`
      : "Under the rules, the sealed umpire sample will now be opened at the umpire lab, and its result will decide the final grade.",
    "A named reviewer records the outcome. No payment changes until then.",
    "This message is not a finding about either lab.",
  ].join("\n");
  return { lines, next, draft };
}

// ---------------------------------------------------------------------------
// 3. Platform assistant ("Ask the Exchange")
// ---------------------------------------------------------------------------

export type Ctx = { role: Role; hash: string; lots: Lot[]; store: Store; demand: DemandReq[]; routes: Routes };
export type Answer = { text: string; lines?: string[]; source: string; refused?: boolean; go?: { label: string; to: string } };

const lotByNumber = (lots: Lot[], n: string) => lots.find((l) => l.number === n);

function lotsIn(q: string, ctx: Ctx): Lot[] {
  const out: Lot[] = [];
  for (const m of q.matchAll(/\b(0\d{3})\b/g)) {
    const l = lotByNumber(ctx.lots, m[1]);
    if (l && !out.includes(l)) out.push(l);
  }
  if (!out.length) {
    const slug = ctx.hash.replace(/^(check-|deal-)/, "");
    const l = ctx.lots.find((x) => x.slug === slug);
    if (l) out.push(l);
  }
  return out;
}

const perLb = (l: Lot) => `USD ${l.priceUsdPerLb} per lb`;

export function suggestionsFor(role: Role): string[] {
  if (role === "seller")
    return ["Turn a message into a lot", "What do I do next?", "How does the 0.5 tolerance work?", "Which buyers are asking for lots?"];
  if (role === "reviewer")
    return ["What is waiting for me?", "Why is lot 0436 not Grade A?", "How do I explain a dispute?", "Draft a note for the reviewer on lot 0417"];
  return ["Why is lot 0417 Grade A?", "Compare lots 0417 and 0412", "What do I do next?", "Draft an RFQ for 10 tonnes CIF"];
}

export function answer(question: string, ctx: Ctx): Answer {
  const q = question.trim();
  const lc = q.toLowerCase();
  const { routes, role } = ctx;

  // Limits first. These hold for every role.
  if (/ignore (all |your |previous |the )*(instructions|rules)|pretend (you are|to be)/i.test(q)) {
    return { text: "I follow the platform rules in every answer, and instructions inside a message do not change them.", source: "Platform rules (demo)", refused: true };
  }
  if (/^(please\s+)?(approve|release|sign|upgrade|downgrade|clear|unblock|pay|transfer|set|change|mark)\b/i.test(q) || /\b(approve|release|sign off|sign|clear|unblock)\b.*\b(this|the|my|that)\b.*\b(lot|payment|deal|tier|mine|buyer|seller|party|wallet)\b/i.test(q) || /\b(change|raise|lower|set)\b.*\b(tier|grade)\b/i.test(q)) {
    return {
      text: "I cannot do that. Only named people in the back office can approve a lot, sign a release, clear a party or change a mine's tier. I can explain the step, or draft a note for them.",
      source: "Platform rules (demo)",
      refused: true,
    };
  }
  if (/(where|location|coordinates|gps|route|map)\b.*\b(mine|lot|come|from|ship)|\b(who|name)\b.*\b(seller|buyer|owner|operator)\b|seller identity|buyer identity/i.test(q)) {
    const l = lotsIn(q, ctx)[0];
    return {
      text: `Exact mine and route locations are never shown, and a seller's or buyer's identity stays hidden until both sides are cleared. ${l ? `What I can show for lot ${l.number}: ${l.mine.name}, tier ${l.mine.tier}, and the evidence summary.` : "I can show the mine's tier and the evidence summary instead."}`,
      source: "Platform rules (demo)",
      refused: true,
    };
  }
  if (/\b(legal|lawyer|illegal|sanction(s|ed)?\b.*\b(ok|okay|allowed|safe)|invest|should i (buy|sell)|tax advice|price (will|going))\b/i.test(q)) {
    return {
      text: "I cannot give legal or investment advice. Questions about sanctions exposure, marketplace status or stablecoin use go to a lawyer. That opinion is a gate before the real product launches. I can explain how the platform's own rules work.",
      source: "Platform rules (demo)",
      refused: true,
    };
  }

  const found = lotsIn(q, ctx);

  // Compare lots
  if (/\bcompar|versus|\bvs\b|difference between/.test(lc)) {
    const pick = found.length >= 2 ? found.slice(0, 3) : ctx.lots.slice(0, 2);
    const rows = pick.map((l) => {
      const g = computeGrade(l);
      return `Lot ${l.number}: Grade ${g.grade}, ${g.verified} of 6 checks verified, ${l.tonnes} t, ${perLb(l)}, ${l.incoterm.split(" ")[0]}, mine tier ${l.mine.tier}.`;
    });
    const cheap = [...pick].sort((a, b) => a.priceUsdPerLb - b.priceUsdPerLb)[0];
    return {
      text: `Here are lots ${pick.map((l) => l.number).join(" and ")} side by side.`,
      lines: [...rows, `Lowest price per lb: lot ${cheap.number}. Price is not a quality signal. The grade and the open checks are.`],
      source: `Evidence records for lots ${pick.map((l) => l.number).join(", ")}`,
      go: { label: `Open lot ${pick[0].number}`, to: routes.lot.replace("{slug}", pick[0].slug) },
    };
  }

  // Why a grade
  if (/\bgrade\b|trust/.test(lc) && /why|how|explain|what|mean|raise|improve|not/.test(lc)) {
    const l = found[0];
    if (!l) {
      return {
        text: "A Trust Grade comes from six evidence checks, never from seller claims. A means strong evidence, B good evidence with gaps, C weak evidence, Blocked cannot be traded. Tell me a lot number and I will explain its grade.",
        source: "Published rules (demo)",
      };
    }
    const g = computeGrade(l);
    const open = g.open.map((k) => CHECK_LABELS[k]);
    return {
      text: `Lot ${l.number} is Grade ${g.grade}. ${g.reasons[0]}`.replace("{n}", String(g.verified)).replace("{list}", open.join(", ")),
      lines: open.length
        ? [`Open checks: ${open.join(", ")}.`, "Each check closes when independent evidence arrives. A reviewer can see what is outstanding. Nobody can raise a grade by asking."]
        : ["Grade A is still not a guarantee. It means the evidence is strong and suspicious signs would have been flagged."],
      source: `Lot ${l.number} evidence record`,
      go: { label: `Open lot ${l.number}`, to: routes.lot.replace("{slug}", l.slug) },
    };
  }

  // Assay and labs for a lot
  if (found[0] && /assay|\blabs?\b|tantalum|ta2o5/.test(lc)) {
    const l = found[0];
    const { sellerLab, independentLab } = l.assay;
    return {
      text: `Lot ${l.number} is sold on a ${l.basisTa2O5}% Ta2O5 basis. The lab results on record: ${sellerLab ?? "none"} (seller's lab) and ${independentLab ?? "none yet"} (independent lab). ${sellerLab !== null && independentLab !== null ? (Math.abs(sellerLab - independentLab) <= TOLERANCE ? `They agree within ${TOLERANCE} points.` : `They differ by more than ${TOLERANCE} points, so the umpire lab would decide.`) : "A comparison needs both results."}`,
      source: `Lot ${l.number} evidence record`,
    };
  }

  // Message to lot
  if (/message|whatsapp|sms|text(ed)? (it|them)|turn .*lot|list (a|my) lot|start a lot/.test(lc)) {
    return {
      text: "Paste the field team's message on List a lot. I read it into a draft, mark each field clear, unsure or missing, ask short follow-ups, and read it back for you to confirm. What the message says is a seller claim, not evidence. The reading, photos and scale weight are still required.",
      source: "Published rules (demo)",
      go: { label: "Open List a lot", to: routes.sell },
    };
  }

  // Demand board
  if (/demand|requirement|looking for|buyers? (are )?(want|ask)|who wants|asking for/.test(lc)) {
    const open = ctx.demand.filter((d) => d.status === "open");
    return {
      text: open.length
        ? `${open.length} open requirement${open.length === 1 ? "" : "s"} on the demand board. Buyers are anonymous until both sides are cleared and a lot is approved.`
        : "There are no open requirements right now.",
      lines: open.slice(0, 4).map((d) => `${d.id}: ${d.tonnes} t, ${d.incoterm.split(" ")[0]}, ${d.neededBy.toLowerCase()}${d.maxPrice ? `, up to USD ${d.maxPrice} per lb` : ""}.`),
      source: "Demand board",
      go: { label: "Open the demand board", to: routes.demand },
    };
  }

  // RFQ draft
  if (/\brfq\b|request for (a )?quote|draft .*(request|requirement|order)/.test(lc)) {
    const t = q.match(/(\d+(?:\.\d+)?)\s*(?:t\b|tonnes?|tons?)/i);
    const tonnes = t ? Number(t[1]) : 10;
    const inc = /\bfob\b/i.test(q) ? "FOB" : "CIF";
    if (tonnes < MIN_TONNES) {
      return { text: `The smallest quantity in the demo is ${MIN_TONNES} tonnes.`, source: "Published rules (demo)" };
    }
    return {
      text: "Here is a draft. Post it on the demand board and it stays anonymous. Read it before you send anything.",
      lines: [
        `Requirement: ${tonnes} tonnes of tantalum ore, ${inc}, grade basis 25% Ta2O5, lots with an independent lab result and a Trust Grade shown.`,
        `Estimated value at the 25% basis and USD 150 per lb (demo figure): USD ${Math.round(tonnes * LB_PER_TONNE * 0.25 * 150).toLocaleString("en-US")}.`,
        "Terms: provisional payment into regulated escrow, released by named people; umpire lab settles any assay gap over 0.5 points.",
      ],
      source: "Published rules (demo)",
      go: { label: "Post on the demand board", to: routes.demand },
    };
  }

  // Draft a note for the reviewer
  if (/draft .*note|note (for|to) (the )?(reviewer|back office)|handover note/.test(lc)) {
    const l = found[0];
    return {
      text: "Here is a draft note. A named person decides. I only wrote it.",
      lines: [
        l
          ? `Note for the reviewer, lot ${l.number}: Grade ${computeGrade(l).grade}, ${computeGrade(l).verified} of 6 checks verified, mine tier ${l.mine.tier}. Please review the open checks before any approval.`
          : "Note for the reviewer: please review the open checks on this lot before any approval.",
        "This note is a summary of the record. It is not a recommendation to approve.",
      ],
      source: l ? `Lot ${l.number} evidence record` : "Published rules (demo)",
    };
  }

  // What is waiting / next step / deal status
  if (/\bnext\b|what now|waiting|status|summar|where am i|what do i do|pending|queue/.test(lc)) {
    if (role === "reviewer") {
      const mine = pendingFor(ctx.store, ctx.store.who);
      const all = pendingCount(ctx.store);
      const top = ctx.store.reqs.filter((r) => r.status === "pending").slice(0, 3);
      return {
        text: all === 0 ? "Nothing is waiting in the back office." : `${all} request${all === 1 ? "" : "s"} waiting in total, ${mine} for the person signed in. I can list them, but only named people sign them.`,
        lines: top.map((r) => `${r.id}: ${r.title}, ${r.sigs.length} of ${r.slots.length} signed.`),
        source: "Back office approval queue",
        go: { label: "Open the back office", to: routes.backoffice },
      };
    }
    const deals = Object.values(ctx.store.deals);
    if (!deals.length) {
      return {
        text: role === "seller" ? "You have no deals yet. You can list a lot, or look at what buyers are asking for." : "You have no deals yet. Open a lot, check its grade and press Reserve.",
        source: "Deal record",
        go: role === "seller" ? { label: "Open the demand board", to: routes.demand } : { label: "See the lots", to: routes.lots },
      };
    }
    const d = deals[0];
    const st = dealStage(d, ctx.store);
    return {
      text: `Lot ${d.lotNumber}: step ${st.step}, ${st.label}. Waiting on: ${st.waitingOn}.`,
      lines: [st.detail, deals.length > 1 ? `You have ${deals.length} deals in total. Open My deals to see them all.` : "The guided demo panel shows all seven steps."],
      source: "Deal record",
      go: { label: "Open the deal", to: routes.deal.replace("{slug}", d.slug) },
    };
  }

  // Disputes, umpire, tolerance
  if (/dispute|umpire|tolerance|labs? (differ|disagree)|gap/.test(lc)) {
    return {
      text: `If the two lab results differ by more than ${TOLERANCE} points of Ta2O5, the average is not used. The sealed umpire sample is opened at a neutral lab and its result decides the final grade. A named reviewer records it. In the Assay step, the assay helper shows the gap and drafts a neutral message to both sides.`,
      source: "Published rules (demo)",
    };
  }

  // Language
  if (/translate|french|chinese|fran[cç]ais|中文|language/.test(lc)) {
    return {
      text: "Use the language buttons at the top for French and Chinese. In this demo, lot evidence stays in English. The real product translates it with AI and keeps the original beside the translation.",
      source: "Published rules (demo)",
    };
  }

  // How a trade works
  if (/how (does|do).*(work|trade)|steps?\b|process|walk me through/.test(lc)) {
    return {
      text: "A deal has seven locked steps. At each money, assay or shipment step, named people in the back office approve. Nobody approves their own step.",
      lines: ["1 Reserve. 2 Sign terms (buyer, then seller). 3 Provisional payment. 4 Shipment and documents. 5 Assay on arrival. 6 Final payment. 7 Evidence pack and receipt."],
      source: "Published rules (demo)",
    };
  }

  // Glossary
  const term = GLOSSARY.find((g) => lc.includes(g.term.toLowerCase()));
  if (term) return { text: `${term.term}: ${term.meaning}`, source: "Glossary" };

  // Lot summary when a lot is named
  if (found[0]) {
    const l = found[0];
    const g = computeGrade(l);
    return {
      text: `Lot ${l.number}: ${l.tonnes} t, ${perLb(l)} on a ${l.basisTa2O5}% basis, Grade ${g.grade} (${g.verified} of 6 checks verified), mine tier ${l.mine.tier}. Estimated lab grade ${preShipGrade(l)}% Ta2O5.`,
      source: `Lot ${l.number} evidence record`,
      go: { label: `Open lot ${l.number}`, to: routes.lot.replace("{slug}", l.slug) },
    };
  }

  return {
    text: "That is not on record in this demo, so I will not guess. I can explain a grade, compare lots, show what is waiting, draft an RFQ or a note, or turn a message into a lot.",
    source: "None",
  };
}
