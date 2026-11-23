// The "front of house" logic for the demo assistant, message-to-lot and the dispute helper.
// SIMULATED: fixed rules and templates, no live AI call. A real version would use a language model
// that reads ONLY the record the user may already see, and the same limits below would stay.
// COMPLIANCE: the assistant explains, compares and drafts. It never approves a lot, signs, releases money,
// changes a mine tier, shows a mine or route location, or reveals who a seller or buyer is.
import { CHECK_LABELS, CHECK_ORDER, TIER_NOTES, computeGrade, type CheckId, type Grade, type Lot, type Status, type Tier } from "./grade";
import { DICT } from "./i18n";
import { GLOSSARY } from "./glossary";
import { LB_PER_TONNE, MIN_TONNES, PLATFORM_FEE_PCT, PROVISIONAL_SHARE, preShipGrade } from "./price";
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
// Conversational on purpose: it remembers the lot you were talking about, takes follow-ups ("what about 0412?"),
// shows what it checked, answers with small cards, suggests next questions and replies in French or Chinese for
// the main answers. Still fixed rules over the demo record. A real version would use a language model reading only
// what the user may already see, with every limit above kept.

export type Lang = "en" | "fr" | "zh";
export type Memory = { lots: string[]; lastQ: string | null };
export const NO_MEMORY: Memory = { lots: [], lastQ: null };

export type Card =
  | { kind: "compare"; rows: { number: string; slug: string; grade: Grade; verified: number; tonnes: number; price: number; term: string; tier: Tier }[] }
  | { kind: "checks"; lot: string; items: { label: string; status: Status; who?: string }[] }
  | { kind: "maths"; title: string; rows: [string, string][]; note: string }
  | { kind: "steps"; current: number; labels: string[]; waiting: string }
  | { kind: "risk"; mine: string; tier: Tier; note: string; signals?: string[]; hidden?: boolean };

export type Ctx = { role: Role; hash: string; lots: Lot[]; store: Store; demand: DemandReq[]; routes: Routes; lang: Lang; memory: Memory };
export type Answer = {
  text: string;
  lines?: string[];
  source: string;
  refused?: boolean;
  go?: { label: string; to: string };
  act?: { label: string; event: string };
  card?: Card;
  checked?: string[]; // what the assistant looked at, shown while it works
  sources?: { label: string; to: string }[]; // links that open the exact tab
  next?: string[]; // follow-up questions to tap
  lots?: string[]; // lot numbers this answer was about, kept as memory
  asked: string; // the question as understood (a follow-up is rewritten), kept as memory
  english?: boolean; // true when the answer is shown in English although another language is on
};

export const DEAL_STEPS = ["Reserve", "Sign terms", "Provisional payment", "Shipment and documents", "Assay on arrival", "Final payment", "Evidence pack"];

const WHO: Record<CheckId, string> = {
  sampling: "an independent inspector",
  assay: "an independent lab",
  custody: "the carriers' sealed handover scans",
  screening: "the screening provider (simulated)",
  crosschecks: "the platform rules and a reviewer",
  site: "a third-party site audit",
};

const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number) => `${Number(n.toFixed(2))}%`;
const lotByNumber = (lots: Lot[], n: string) => lots.find((l) => l.number === n);

// "and what about 0412?" re-asks the last question about the new lot.
function followUp(q: string, m: Memory): string {
  const nums = [...q.matchAll(/\b0\d{3}\b/g)].map((x) => x[0]);
  if (!m.lastQ || !nums.length) return q;
  const t = q.trim();
  if (t.split(/\s+/).length > 6 || !/^(and |what about|how about|or |same for|now |then )/i.test(t)) return q;
  return /\b0\d{3}\b/.test(m.lastQ) ? m.lastQ.replace(/\b0\d{3}\b/, nums[0]) : `${m.lastQ} ${nums[0]}`;
}

function lotsIn(q: string, ctx: Ctx): Lot[] {
  const out: Lot[] = [];
  for (const m of q.matchAll(/\b(0\d{3})\b/g)) {
    const l = lotByNumber(ctx.lots, m[1]);
    if (l && !out.includes(l)) out.push(l);
  }
  if (out.length) return out;
  const fromMemory = ctx.memory.lots.map((n) => lotByNumber(ctx.lots, n)).filter((l): l is Lot => !!l);
  const slug = ctx.hash.replace(/^(check-|deal-)/, "").split("~")[0];
  const fromHere = ctx.lots.find((x) => x.slug === slug);
  // "this" and "here" mean the lot on screen. "it", "its", "that" and "same" mean the lot we were just talking about.
  const here = /\b(this|here)\b/i.test(q);
  const pronoun = /\b(it|its|that|same|the lot|them)\b/i.test(q);
  const pick = pronoun && !here ? [...fromMemory, ...(fromHere ? [fromHere] : [])] : [...(fromHere ? [fromHere] : []), ...fromMemory];
  return pick.slice(0, 1);
}

function tabLink(routes: Routes, l: Lot, tab: "evidence" | "assay" | "price" | "wrong") {
  const base = routes.lot.replace("{slug}", l.slug);
  return routes.lot.startsWith("#") ? `${base}~${tab}` : base;
}

export function suggestionsFor(role: Role): string[] {
  if (role === "seller")
    return ["Turn a message into a lot", "What do buyers want right now?", "How does the assay tolerance work?", "Explain it like I'm new"];
  if (role === "reviewer")
    return ["What is waiting for me?", "What is the risk on Mine B?", "How do I explain a dispute?", "Draft a note for the reviewer on lot 0417"];
  return ["Why is lot 0417 Grade A?", "What would 12 tonnes of lot 0417 cost?", "What would make lot 0436 Grade A?", "Explain it like I'm new"];
}

// A gentle nudge shown when the panel opens, and a dot on the button. Only things the user may act on.
export function nudgeFor(ctx: Omit<Ctx, "lang" | "memory">): { text: string; go?: { label: string; to: string } } | null {
  const { role, store, routes, demand } = ctx;
  if (role === "reviewer") {
    const mine = pendingFor(store, store.who);
    const all = pendingCount(store);
    if (all > 0) return { text: `${all} request${all === 1 ? " is" : "s are"} waiting in the back office${mine ? `, ${mine} for the person signed in` : ""}.`, go: { label: "Open the back office", to: routes.backoffice } };
    return null;
  }
  const deals = Object.values(store.deals);
  for (const d of deals) {
    const st = dealStage(d, store);
    if (st.waitingOn === (role === "seller" ? "Seller" : "Buyer")) {
      return { text: `Lot ${d.lotNumber} is waiting for you: ${st.label}.`, go: { label: "Open the deal", to: routes.deal.replace("{slug}", d.slug) } };
    }
  }
  if (role === "seller") {
    const open = demand.filter((r) => r.status === "open").length;
    if (open) return { text: `${open} buyer requirement${open === 1 ? "" : "s"} on the demand board.`, go: { label: "Open the demand board", to: routes.demand } };
  }
  return null;
}

const dict = (lang: Lang, s: string) => (lang === "en" ? s : (DICT[s]?.[lang] ?? s));

export function answer(question: string, ctx: Ctx): Answer {
  const q = followUp(question.trim(), ctx.memory);
  const lc = q.toLowerCase();
  const { routes, role, lang } = ctx;
  // Pick a language for the main answers. Everything else stays English and says so.
  const L = (en: string, fr: string, zh: string) => (lang === "fr" ? fr : lang === "zh" ? zh : en);
  const A = (a: Omit<Answer, "asked" | "english">, translated = false): Answer => ({
    checked: [a.source],
    ...a,
    asked: q,
    english: lang !== "en" && !translated,
  });

  // ---- Limits first. These hold for every role and every language.
  if (/ignore (all |your |previous |the )*(instructions|rules)|pretend (you are|to be)/i.test(q)) {
    return A({ text: L("I follow the platform rules in every answer, and instructions inside a message do not change them.", "Je suis les règles de la plateforme dans chaque réponse, et les instructions contenues dans un message ne les changent pas.", "我在每个回答中都遵守平台规则，消息里的指令不会改变这些规则。"), source: "Platform rules (demo)", refused: true }, true);
  }
  if (/^(please\s+)?(approve|release|sign|upgrade|downgrade|clear|unblock|pay|transfer|set|change|mark)\b/i.test(q) || /\b(approve|release|sign off|sign|clear|unblock)\b.*\b(this|the|my|that)\b.*\b(lot|payment|deal|tier|mine|buyer|seller|party|wallet)\b/i.test(q) || /\b(change|raise|lower|set)\b.*\b(tier|grade)\b/i.test(q)) {
    return A({
      text: L("I cannot do that. Only named people in the back office can approve a lot, sign a release, clear a party or change a mine's tier. I can explain the step, or draft a note for them.", "Je ne peux pas faire cela. Seules des personnes nommées au back office peuvent approuver un lot, signer un déblocage, valider une partie ou changer le niveau d'une mine. Je peux expliquer l'étape ou rédiger une note pour elles.", "这个我做不到。只有后台的指定人员才能批准批次、签署放款、放行某一方或更改矿山等级。我可以为您解释这一步，或起草一份给他们的说明。"),
      source: "Platform rules (demo)", refused: true, next: ["Who approves a payment?", "Draft a note for the reviewer"],
    }, true);
  }
  if (/(where|location|coordinates|gps|route|map)\b.*\b(mine|lot|come|from|ship)|\b(who|name)\b.*\b(seller|buyer|owner|operator)\b|seller identity|buyer identity/i.test(q)) {
    const l = lotsIn(q, ctx)[0];
    return A({
      text: lang === "en"
        ? `Exact mine and route locations are never shown, and a seller's or buyer's identity stays hidden until both sides are cleared. ${l ? `What I can show for lot ${l.number}: ${l.mine.name}, tier ${l.mine.tier}, and the evidence summary.` : "I can show the mine's tier and the evidence summary instead."}`
        : L("", "Les emplacements exacts des mines et des itinéraires ne sont jamais affichés, et l'identité d'un vendeur ou d'un acheteur reste masquée tant que les deux parties ne sont pas validées. À la place, je peux montrer le niveau de la mine et le résumé des preuves.", "矿山和运输路线的确切位置从不显示，在双方都通过审核之前，卖方和买方的身份也会保持隐藏。我可以提供矿山等级和证据摘要。"),
      source: "Platform rules (demo)", refused: true, next: l ? [`Why is lot ${l.number} Grade ${computeGrade(l).grade}?`] : undefined,
    }, true);
  }
  if (/\b(legal|lawyer|illegal|sanction(s|ed)?\b.*\b(ok|okay|allowed|safe)|invest|should i (buy|sell)|tax advice|price (will|going))\b/i.test(q)) {
    return A({
      text: L("I cannot give legal or investment advice. Questions about sanctions exposure, marketplace status or stablecoin use go to a lawyer. That opinion is a gate before the real product launches. I can explain how the platform's own rules work.", "Je ne peux pas donner de conseil juridique ou d'investissement. Les questions sur l'exposition aux sanctions, le statut de la place de marché ou l'usage de stablecoins relèvent d'un avocat. Je peux expliquer les règles propres à la plateforme.", "我不能提供法律或投资建议。关于制裁风险、交易平台的法律地位或稳定币使用的问题应咨询律师。我可以解释平台自身的规则。"),
      source: "Platform rules (demo)", refused: true, next: ["How does a deal work?"],
    }, true);
  }

  // ---- Small talk and "what are you"
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|bonjour)\b|^你好/i.test(q)) {
    return A({
      text: L("Hello. I can explain a lot's grade, compare lots, work out what a deal would cost, show what is waiting for you, or draft a message. What would you like to look at?", "Bonjour. Je peux expliquer la note d'un lot, comparer des lots, calculer le coût d'une transaction, montrer ce qui vous attend ou rédiger un message. Que souhaitez-vous consulter ?", "您好。我可以解释批次评级、比较批次、计算一笔交易的费用、显示待您处理的事项，或起草消息。您想看什么？"),
      source: "Platform rules (demo)", next: suggestionsFor(role).slice(0, 2),
    }, true);
  }
  if (/^(thanks|thank you|cheers|merci|great|perfect|brilliant)\b|^谢谢/i.test(q)) {
    return A({ text: L("You are welcome. Anything else you want to check before you act?", "Avec plaisir. Souhaitez-vous vérifier autre chose avant d'agir ?", "不客气。行动之前还有什么需要核实的吗？"), source: "Platform rules (demo)", next: suggestionsFor(role).slice(0, 2) }, true);
  }
  if (/who are you|what are you|are you (an? )?(ai|bot|real|human|robot|person)|how do you work|what can you do|what can i ask|^help\b|help me$/i.test(q)) {
    return A({
      text: L("I am the Exchange assistant, and I am an AI. In this demo I run on fixed rules over the demo record, so I can only answer what is on it. In the real product a language model would do this, reading only what you are allowed to see, with the same limits.", "Je suis l'assistant de la plateforme, et je suis une IA. Dans cette démo, je fonctionne avec des règles fixes sur les données de démonstration, donc je ne peux répondre qu'à ce qui s'y trouve. Dans le vrai produit, un modèle de langage ferait ce travail, en lisant uniquement ce que vous avez le droit de voir, avec les mêmes limites.", "我是平台助手，我是人工智能。在本演示中，我依据演示记录中的固定规则作答，所以只能回答记录中有的内容。在正式产品中，将由语言模型完成这项工作，只读取您有权查看的内容，并遵守同样的限制。"),
      lines: lang === "en" ? ["I can explain a grade, compare lots, show what would raise a grade, work out value and payments, explain a risk tier, draft an RFQ or a note, and take you to the right screen.", "I never approve, sign, release money, change a tier, show a location or identity, or give legal advice."] : undefined,
      source: "Platform rules (demo)", next: ["Explain it like I'm new", ...suggestionsFor(role).slice(0, 1)],
    }, true);
  }

  // ---- Guided demo and analogy
  if (/show me around|take me (on )?a tour|guided (demo|tour)|start the (guided )?(demo|tour)|walk me through the demo/i.test(q)) {
    return A({ text: "Opening the guided demo. It lists the seven steps and tells you who to be next. It only points, it never signs.", source: "Guided demo", act: { label: "Open the guided demo", event: "cx-tour-open" }, next: ["How does a deal work?"] });
  }
  if (/like i'?m (new|five|5)|eli5|in simple (words|terms)|analogy|restaurant|explain it simply|simple explanation/i.test(q)) {
    return A({
      text: "Think of a restaurant. The kitchen decides what reaches the menu: fixed rules and named people check every lot, and nobody can talk their way past them. I am front of house: I explain the menu, compare dishes and help you order, but I never cook and I never sign off.",
      lines: [
        "The Trust Grade is the label on each dish: where it came from and how good it is.",
        "The umpire lab is the health inspector, called in when two labs disagree.",
        "The two-person release is a safe with two keys held by different people. Nobody opens it alone.",
      ],
      source: "Published rules (demo)", next: ["How does a deal work?", "Why is lot 0417 Grade A?"],
    });
  }

  const found = lotsIn(q, ctx);

  // ---- Compare lots
  if (/\bcompar|versus|\bvs\b|difference between|比较|对比/.test(lc)) {
    const pick = found.length >= 2 ? found.slice(0, 3) : ctx.lots.slice(0, 2);
    const rows = pick.map((l) => {
      const g = computeGrade(l);
      return { number: l.number, slug: l.slug, grade: g.grade, verified: g.verified, tonnes: l.tonnes, price: l.priceUsdPerLb, term: l.incoterm.split(" ")[0], tier: l.mine.tier };
    });
    const cheap = [...pick].sort((a, b) => a.priceUsdPerLb - b.priceUsdPerLb)[0];
    const nums = pick.map((l) => l.number).join(" / ");
    return A({
      text: L(`Here are lots ${nums} side by side.`, `Voici les lots ${nums} côte à côte.`, `以下是批次 ${nums} 的并列对比。`),
      lines: [L(`Lowest price per lb: lot ${cheap.number}. Price is not a quality signal. The grade and the open checks are.`, `Prix le plus bas par lb : lot ${cheap.number}. Le prix n'est pas un signe de qualité ; la note et les contrôles ouverts le sont.`, `每磅最低价：批次 ${cheap.number}。价格不代表品质，评级和未完成的核查才代表品质。`)],
      card: { kind: "compare", rows }, source: `Evidence records for lots ${nums}`, lots: pick.map((l) => l.number),
      checked: pick.map((l) => `Lot ${l.number} evidence record`),
      sources: pick.map((l) => ({ label: `Open lot ${l.number}`, to: routes.lot.replace("{slug}", l.slug) })),
      next: [`What would 12 tonnes of lot ${pick[0].number} cost?`, `Why is lot ${pick[0].number} Grade ${rows[0].grade}?`],
    }, true);
  }

  // ---- What would raise the grade
  if (/(what|how).*(make|get|raise|reach|become|need|upgrade|improve).*\bgrade a\b|what would (change|raise|improve)|how (can|could|do) (i|we|it|a lot).*(grade a|higher grade)|what('?s| is) missing|missing (checks|evidence)|open checks/.test(lc)) {
    const l = found[0];
    if (!l) return A({ text: "Tell me which lot, for example 'What would make lot 0436 Grade A?'.", source: "Published rules (demo)", next: ["What would make lot 0436 Grade A?"] });
    const g = computeGrade(l);
    const items = CHECK_ORDER.map((k: CheckId) => ({ label: CHECK_LABELS[k], status: l.evidence[k].status, who: l.evidence[k].status === "verified" ? undefined : WHO[k] }));
    const tierNote = l.mine.tier !== "Verified" ? ` The mine must also be tier Verified. This one is ${l.mine.tier}.` : "";
    return A({
      text: g.grade === "A"
        ? `Lot ${l.number} is already Grade A. All six checks are verified.`
        : g.grade === "Blocked"
          ? `Lot ${l.number} is Blocked, so it cannot be traded. A Blocked lot cannot be raised by adding evidence.`
          : `Lot ${l.number} is Grade ${g.grade}. To reach Grade A, all six checks must be verified by independent evidence.${tierNote}`,
      lines: ["Nobody can raise a grade by asking, and I cannot change one. Each check closes when its evidence arrives, and the grade follows from the rules."],
      card: { kind: "checks", lot: l.number, items }, source: `Lot ${l.number} evidence record`, lots: [l.number],
      checked: [`Lot ${l.number} evidence record`, "Published grading rules"],
      sources: [{ label: "Open the Evidence tab", to: tabLink(routes, l, "evidence") }],
      next: [`Compare lots ${l.number} and 0417`, `What is the risk on ${l.mine.name.replace(" (demo)", "")}?`],
    });
  }

  // ---- Risk tier of a mine
  if (/\brisk|signal|on watch|\bwatch\b|mine tier|tier of|why is mine/.test(lc) && !/\bgrade\b/.test(lc)) {
    const letter = q.match(/\bmine\s+([A-HJ-K])\b/i)?.[1]?.toUpperCase();
    const mineName = letter ? `Mine ${letter} (demo)` : found[0]?.mine.name;
    const mine = mines.find((m) => m.name === mineName);
    if (mine) {
      const staff = role === "reviewer";
      return A({
        text: `${mine.name} is tier ${mine.tier}. ${TIER_NOTES[mine.tier]}`,
        lines: staff ? undefined : ["Specific risk signals are visible to back office staff only. Buyers see the tier and the evidence summary."],
        card: { kind: "risk", mine: mine.name, tier: mine.tier, note: mine.note, signals: staff ? mine.signals : undefined, hidden: !staff && mine.signals.length > 0 },
        source: "Mine registry", lots: found.map((l) => l.number),
        next: staff ? ["What is waiting for me?", "How do I explain a dispute?"] : ["Compare lots 0417 and 0412", "Explain it like I'm new"],
      });
    }
  }

  // ---- Why a grade
  if (/\bgrade\b|trust|评级|等级/.test(lc) && /why|how|explain|what|mean|raise|improve|not|pourquoi|comment|expliqu|为什么|怎么|解释|什么/.test(lc)) {
    const l = found[0];
    if (!l) {
      return A({
        text: "A Trust Grade comes from six evidence checks, never from seller claims. A means strong evidence, B good evidence with gaps, C weak evidence, Blocked cannot be traded. Tell me a lot number and I will explain its grade.",
        source: "Published rules (demo)", next: ["Why is lot 0417 Grade A?", "Explain it like I'm new"],
      });
    }
    const g = computeGrade(l);
    const open = g.open.map((k) => dict(lang, CHECK_LABELS[k]).toLowerCase());
    const reason = dict(lang, g.reasonKey).replace("{n}", String(g.verified)).replace("{list}", open.join(", "));
    const items = CHECK_ORDER.map((k: CheckId) => ({ label: CHECK_LABELS[k], status: l.evidence[k].status }));
    return A({
      text: `${L(`Lot ${l.number} is Grade ${g.grade}.`, `Le lot ${l.number} est de grade ${g.grade}.`, `批次 ${l.number} 的评级为 ${g.grade} 级。`)} ${reason}`,
      lines: lang !== "en" ? undefined : g.open.length
        ? ["Each check closes when independent evidence arrives. A reviewer can see what is outstanding. Nobody can raise a grade by asking."]
        : ["Grade A is still not a guarantee. It means the evidence is strong and suspicious signs would have been flagged."],
      card: { kind: "checks", lot: l.number, items }, source: `Lot ${l.number} evidence record`, lots: [l.number],
      checked: [`Lot ${l.number} evidence record`, "Published grading rules"],
      sources: [{ label: "Open the Evidence tab", to: tabLink(routes, l, "evidence") }, { label: "Open the Assay tab", to: tabLink(routes, l, "assay") }],
      next: g.grade === "A" ? [`What would 12 tonnes of lot ${l.number} cost?`, `Compare lots ${l.number} and 0412`] : [`What would make lot ${l.number} Grade A?`, `What is the risk on ${l.mine.name.replace(" (demo)", "")}?`],
    }, true);
  }

  // ---- Assay and labs for a lot
  if (found[0] && /assay|\blabs?\b|tantalum|ta2o5/.test(lc)) {
    const l = found[0];
    const { sellerLab, independentLab } = l.assay;
    return A({
      text: `Lot ${l.number} is sold on a ${l.basisTa2O5}% Ta2O5 basis. The lab results on record: ${sellerLab ?? "none"} (seller's lab) and ${independentLab ?? "none yet"} (independent lab). ${sellerLab !== null && independentLab !== null ? (Math.abs(sellerLab - independentLab) <= TOLERANCE ? `They agree within ${TOLERANCE} points.` : `They differ by more than ${TOLERANCE} points, so the umpire lab would decide.`) : "A comparison needs both results."}`,
      source: `Lot ${l.number} evidence record`, lots: [l.number], sources: [{ label: "Open the Assay tab", to: tabLink(routes, l, "assay") }],
      next: [`What would 12 tonnes of lot ${l.number} cost?`, "How does the assay tolerance work?"],
    });
  }

  // ---- Message to lot
  if (/message|whatsapp|sms|text(ed)? (it|them)|turn .*lot|list (a|my) lot|start a lot/.test(lc)) {
    return A({
      text: "Paste the field team's message on List a lot. I read it into a draft, mark each field clear, unsure or missing, ask short follow-ups, and read it back for you to confirm. What the message says is a seller claim, not evidence. The reading, photos and scale weight are still required.",
      source: "Published rules (demo)", go: { label: "Open List a lot", to: routes.sell }, next: ["What do buyers want right now?"],
    });
  }

  // ---- Demand board
  if (/demand|requirement|looking for|buyers? (are )?(want|ask)|who wants|asking for/.test(lc)) {
    const open = ctx.demand.filter((d) => d.status === "open");
    return A({
      text: open.length
        ? `${open.length} open requirement${open.length === 1 ? "" : "s"} on the demand board. Buyers are anonymous until both sides are cleared and a lot is approved.`
        : "There are no open requirements right now.",
      lines: open.slice(0, 4).map((d) => `${d.id}: ${d.tonnes} t, ${d.incoterm.split(" ")[0]}, ${d.neededBy.toLowerCase()}${d.maxPrice ? `, up to USD ${d.maxPrice} per lb` : ""}.`),
      source: "Demand board", go: { label: "Open the demand board", to: routes.demand }, next: ["Turn a message into a lot"],
    });
  }

  // ---- RFQ draft
  if (/\brfq\b|request for (a )?quote|draft .*(request|requirement|order)/.test(lc)) {
    const t = q.match(/(\d+(?:\.\d+)?)\s*(?:t\b|tonnes?|tons?)/i);
    const tonnes = t ? Number(t[1]) : 10;
    const inc = /\bfob\b/i.test(q) ? "FOB" : "CIF";
    if (tonnes < MIN_TONNES) return A({ text: `The smallest quantity in the demo is ${MIN_TONNES} tonnes.`, source: "Published rules (demo)" });
    return A({
      text: "Here is a draft. Post it on the demand board and it stays anonymous. Read it before you send anything.",
      lines: [
        `Requirement: ${tonnes} tonnes of tantalum ore, ${inc}, grade basis 25% Ta2O5, lots with an independent lab result and a Trust Grade shown.`,
        `Estimated value at the 25% basis and USD 150 per lb (demo figure): ${usd(tonnes * LB_PER_TONNE * 0.25 * 150)}.`,
        "Terms: provisional payment into regulated escrow, released by named people; umpire lab settles any assay gap over 0.5 points.",
      ],
      source: "Published rules (demo)", go: { label: "Post on the demand board", to: routes.demand }, next: ["What do buyers want right now?"],
    });
  }

  // ---- Draft a note for the reviewer
  if (/draft .*note|note (for|to) (the )?(reviewer|back office)|handover note/.test(lc)) {
    const l = found[0];
    return A({
      text: "Here is a draft note. A named person decides. I only wrote it.",
      lines: [
        l ? `Note for the reviewer, lot ${l.number}: Grade ${computeGrade(l).grade}, ${computeGrade(l).verified} of 6 checks verified, mine tier ${l.mine.tier}. Please review the open checks before any approval.` : "Note for the reviewer: please review the open checks on this lot before any approval.",
        "This note is a summary of the record. It is not a recommendation to approve.",
      ],
      source: l ? `Lot ${l.number} evidence record` : "Published rules (demo)", lots: l ? [l.number] : undefined,
    });
  }

  // ---- How the price works / what would it cost
  if (/how (does|do) .*(price|pricing)|price (work|formula)|how is (the )?(price|value) (worked|calculated|set)/.test(lc)) {
    const l = found[0] ?? ctx.lots[0];
    const g = preShipGrade(l);
    return A({
      text: `Value = tonnes x 2,204.62 lb per tonne x Ta2O5 share x price per lb. The price is quoted on a ${l.basisTa2O5}% basis, and the independent lab result replaces the basis when it arrives.`,
      lines: [`Worked example, lot ${l.number}: ${l.tonnes} t x 2,204.62 x ${pct(g)} x USD ${l.priceUsdPerLb} = ${usd(l.tonnes * LB_PER_TONNE * (g / 100) * l.priceUsdPerLb)} (estimate, demo figures).`],
      source: `Lot ${l.number} price record`, lots: [l.number], sources: [{ label: "Open the Price tab", to: tabLink(routes, l, "price") }],
      next: [`What would 6 tonnes of lot ${l.number} cost?`],
    });
  }
  if (/how much|\bcost|total|worth|\bvalue\b|provisional|balance|\bfee\b|what would .*(pay|cost)|\bprice\b|\bpay\b|combien|co[uû]t|prix|多少钱|费用|价格/.test(lc)) {
    const l = found[0];
    if (!l) {
      return A({ text: L("Which lot, and how many tonnes? For example: 'What would 12 tonnes of lot 0417 cost?'", "Quel lot, et combien de tonnes ? Par exemple : « Combien coûteraient 12 tonnes du lot 0417 ? »", "请问是哪个批次、多少吨？例如：“批次 0417 的 12 吨要多少钱？”"), source: "Published rules (demo)", next: ["What would 12 tonnes of lot 0417 cost?"] }, true);
    }
    const tm = q.match(/(\d+(?:[.,]\d+)?)\s*(?:t\b|tonnes?|tons?)\b/i);
    const gm = q.match(/(\d+(?:[.,]\d+)?)\s*%/);
    const tonnes = tm ? Number(tm[1].replace(",", ".")) : l.tonnes;
    const grade = gm ? Number(gm[1].replace(",", ".")) : preShipGrade(l);
    if (tonnes > l.tonnes) return A({ text: `Lot ${l.number} only has ${l.tonnes} tonnes.`, source: `Lot ${l.number} evidence record`, lots: [l.number], next: [`What would ${l.tonnes} tonnes of lot ${l.number} cost?`] });
    if (tonnes < MIN_TONNES) return A({ text: `The smallest quantity in the demo is ${MIN_TONNES} tonnes.`, source: "Published rules (demo)", lots: [l.number] });
    if (grade < 10 || grade > 45) return A({ text: "That grade looks outside the usual range for this ore. Try a figure between 20 and 30 percent.", source: "Published rules (demo)", lots: [l.number] });
    const value = tonnes * LB_PER_TONNE * (grade / 100) * l.priceUsdPerLb;
    const prov = value * PROVISIONAL_SHARE;
    const lbl = {
      qty: L("Quantity", "Quantité", "数量"), gr: L("Grade used", "Teneur utilisée", "采用品位"), pr: L("Price", "Prix", "单价"),
      val: L("Estimated value", "Valeur estimée", "预估价值"), prov: L("Provisional payment (80%) into escrow", "Paiement provisoire (80 %) en séquestre", "预付款（80%）进入托管"),
      bal: L("Balance after the arrival assay", "Solde après l'essai à l'arrivée", "到货化验后的余款"), fee: L(`Platform fee (${PLATFORM_FEE_PCT}% per side, at release)`, `Frais de plateforme (${PLATFORM_FEE_PCT} % par partie, au déblocage)`, `平台费用（每方 ${PLATFORM_FEE_PCT}%，放款时收取）`),
    };
    return A({
      text: L(`Here is the maths for ${tonnes} tonnes of lot ${l.number} at ${pct(grade)} Ta2O5.`, `Voici le calcul pour ${tonnes} tonnes du lot ${l.number} à ${pct(grade)} de Ta2O5.`, `以下是批次 ${l.number} 的 ${tonnes} 吨、Ta2O5 ${pct(grade)} 的计算。`),
      card: {
        kind: "maths", title: `${L("Lot", "Lot", "批次")} ${l.number}`,
        rows: [[lbl.qty, `${tonnes} t`], [lbl.gr, `${pct(grade)} Ta2O5`], [lbl.pr, `USD ${l.priceUsdPerLb} / lb`], [lbl.val, usd(value)], [lbl.prov, usd(prov)], [lbl.bal, usd(value - prov)], [lbl.fee, usd((value * PLATFORM_FEE_PCT) / 100)]],
        note: L("Demo estimate. The final amount is set only after the arrival assay, and named people release each payment.", "Estimation de démonstration. Le montant final n'est fixé qu'après l'essai à l'arrivée, et des personnes nommées débloquent chaque paiement.", "演示用估算。最终金额须在到货化验后确定，每笔付款由指定人员放行。"),
      },
      source: `Lot ${l.number} price record`, lots: [l.number], checked: [`Lot ${l.number} price and grade`, "Demo price rules"],
      sources: [{ label: "Open the Price tab", to: tabLink(routes, l, "price") }],
      next: [`Why is lot ${l.number} Grade ${computeGrade(l).grade}?`, "How does the price work?"],
    }, true);
  }

  // ---- What is waiting / next step / deal status
  if (/\bnext\b|what now|waiting|status|summar|where am i|what do i do|pending|queue|prochaine|en attente|下一步|待处理/.test(lc)) {
    if (role === "reviewer") {
      const mine = pendingFor(ctx.store, ctx.store.who);
      const all = pendingCount(ctx.store);
      const top = ctx.store.reqs.filter((r) => r.status === "pending").slice(0, 3);
      return A({
        text: all === 0 ? "Nothing is waiting in the back office." : `${all} request${all === 1 ? "" : "s"} waiting in total, ${mine} for the person signed in. I can list them, but only named people sign them.`,
        lines: top.map((r) => `${r.id}: ${r.title}, ${r.sigs.length} of ${r.slots.length} signed.`),
        source: "Back office approval queue", go: { label: "Open the back office", to: routes.backoffice }, next: ["What is the risk on Mine B?"],
      });
    }
    const deals = Object.values(ctx.store.deals);
    if (!deals.length) {
      return A({
        text: L(role === "seller" ? "You have no deals yet. You can list a lot, or look at what buyers are asking for." : "You have no deals yet. Open a lot, check its grade and press Reserve.", role === "seller" ? "Vous n'avez pas encore de transaction. Vous pouvez enregistrer un lot ou voir ce que demandent les acheteurs." : "Vous n'avez pas encore de transaction. Ouvrez un lot, vérifiez sa note et appuyez sur Réserver.", role === "seller" ? "您还没有交易。您可以挂牌一个批次，或查看买方的需求。" : "您还没有交易。打开一个批次，查看其评级，然后点击“预订”。"),
        source: "Deal record", go: role === "seller" ? { label: "Open the demand board", to: routes.demand } : { label: "See the lots", to: routes.lots },
        next: role === "seller" ? ["What do buyers want right now?"] : ["Why is lot 0417 Grade A?"],
      }, true);
    }
    const d = deals[0];
    const st = dealStage(d, ctx.store);
    return A({
      text: `Lot ${d.lotNumber}: step ${st.step}, ${st.label}. Waiting on: ${st.waitingOn}.`,
      lines: [st.detail, deals.length > 1 ? `You have ${deals.length} deals in total. Open My deals to see them all.` : "The guided demo panel shows all seven steps."],
      card: { kind: "steps", current: st.step, labels: DEAL_STEPS, waiting: st.waitingOn },
      source: "Deal record", lots: [d.lotNumber], go: { label: "Open the deal", to: routes.deal.replace("{slug}", d.slug) }, next: ["How does a deal work?"],
    });
  }

  // ---- Disputes, umpire, tolerance
  if (/dispute|umpire|tolerance|labs? (differ|disagree)|\bgap\b/.test(lc)) {
    return A({
      text: `If the two lab results differ by more than ${TOLERANCE} points of Ta2O5, the average is not used. The sealed umpire sample is opened at a neutral lab and its result decides the final grade. A named reviewer records it. In the Assay step, the assay helper shows the gap and drafts a neutral message to both sides.`,
      source: "Published rules (demo)", next: ["Explain it like I'm new", "How does a deal work?"],
    });
  }

  // ---- Language
  if (/translate|french|chinese|fran[cç]ais|中文|language/.test(lc)) {
    return A({
      text: "Use the language buttons at the top for French and Chinese. The interface and my main answers switch language. Lot evidence stays in English in this demo. The real product translates it with AI and keeps the original beside the translation.",
      source: "Published rules (demo)",
    });
  }

  // ---- How a trade works
  if (/how (does|do).*(work|trade)|steps?\b|process|walk me through/.test(lc)) {
    return A({
      text: "A deal has seven locked steps. At each money, assay or shipment step, named people in the back office approve. Nobody approves their own step.",
      lines: ["1 Reserve. 2 Sign terms (buyer, then seller). 3 Provisional payment. 4 Shipment and documents. 5 Assay on arrival. 6 Final payment. 7 Evidence pack and receipt."],
      card: { kind: "steps", current: 0, labels: DEAL_STEPS, waiting: "" },
      source: "Published rules (demo)", act: { label: "Open the guided demo", event: "cx-tour-open" }, next: ["Explain it like I'm new", "What would 12 tonnes of lot 0417 cost?"],
    });
  }

  // ---- Glossary
  const term = GLOSSARY.find((g) => lc.includes(g.term.toLowerCase()));
  if (term) return A({ text: `${term.term}: ${term.meaning}`, source: "Glossary", next: ["How does a deal work?"] });

  // ---- Lot summary when a lot is named
  if (found[0]) {
    const l = found[0];
    const g = computeGrade(l);
    return A({
      text: `Lot ${l.number}: ${l.tonnes} t, USD ${l.priceUsdPerLb} per lb on a ${l.basisTa2O5}% basis, Grade ${g.grade} (${g.verified} of 6 checks verified), mine tier ${l.mine.tier}. Estimated lab grade ${preShipGrade(l)}% Ta2O5.`,
      source: `Lot ${l.number} evidence record`, lots: [l.number], go: { label: `Open lot ${l.number}`, to: routes.lot.replace("{slug}", l.slug) },
      next: [`Why is lot ${l.number} Grade ${g.grade}?`, `What would 12 tonnes of lot ${l.number} cost?`],
    });
  }

  return A({
    text: L("That is not on record in this demo, so I will not guess. I can explain a grade, compare lots, show what is waiting, work out a deal's cost, or draft an RFQ or a note.", "Ce n'est pas dans le dossier de cette démo, donc je ne vais pas deviner. Je peux expliquer une note, comparer des lots, montrer ce qui est en attente, calculer le coût d'une transaction ou rédiger une demande ou une note.", "这不在本演示的记录中，所以我不会猜测。我可以解释评级、比较批次、显示待处理事项、计算交易费用，或起草询价和说明。"),
    source: "None", next: suggestionsFor(role).slice(0, 2),
  }, true);
}
