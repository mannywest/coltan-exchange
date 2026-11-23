// The demo's "Next step" guide. Plain rules, no AI: it reads the deal state and says who has to act next.
// COMPLIANCE: the guide only moves the viewer to the right screen and picks which named demo person to show.
// It never signs, approves or releases anything. A human still presses every approval button.
import { dealStage } from "./approvals";
import { PEOPLE, hasSigned, slotFor, type Store } from "./dealStore";
import type { Routes } from "./routes";
import { href } from "./routes";

export type Role = "buyer" | "seller" | "reviewer";

export type Step = {
  /** Whose turn it is. */
  actor: Role | "none";
  /** One sentence for the bar. */
  text: string;
  /** Button label, empty when there is nothing to press. */
  button: string;
  /** Screen to open. */
  go: string;
  /** Demo view to switch to. */
  role: Role;
  /** Back office only: which named demo person to show, so the right approval is theirs to sign. */
  who?: string;
  tone: "wait" | "ok" | "stop" | "start";
};

const ACTOR: Record<string, Role | "none"> = { Buyer: "buyer", Seller: "seller", "Back office": "reviewer", Nobody: "none" };
const WHO_WORD: Record<Role, string> = { buyer: "the buyer", seller: "the seller", reviewer: "back office staff" };

export function nextStep(s: Store, role: Role, routes: Routes): Step {
  const deals = Object.values(s.deals).sort((a, b) => b.at - a.at);
  const live = deals.find((d) => dealStage(d, s).tone !== "ok") ?? deals[0];

  if (!live) {
    return {
      actor: "buyer", role: "buyer", go: routes.lots, tone: "start",
      text: role === "buyer" ? "Start here: pick a lot and reserve it." : "No deal yet. A buyer has to reserve a lot first.",
      button: role === "buyer" ? "Browse the lots" : "Go to the lots as the buyer",
    };
  }

  const st = dealStage(live, s);
  const dealHref = href(routes.deal, live.slug);

  if (st.tone === "ok") {
    return {
      actor: "none", role: "buyer", go: dealHref, tone: "ok",
      text: `Lot ${live.lotNumber} deal complete. The evidence pack and receipt are ready.`,
      button: "See the finished deal",
    };
  }
  if (st.tone === "stop") {
    return { actor: "none", role: "buyer", go: dealHref, tone: "stop", text: `Lot ${live.lotNumber}: ${st.label}. ${st.detail}`, button: "Open the deal" };
  }

  const actor = ACTOR[st.waitingOn] ?? "none";
  const target: Role = actor === "none" ? "buyer" : actor;
  const go = target === "buyer" ? dealHref : target === "seller" ? routes.deals : routes.backoffice;
  const head = `Lot ${live.lotNumber}, step ${st.step} of 7: ${st.label}.`;

  let who: string | undefined;
  let signer = "";
  if (target === "reviewer") {
    const req = s.reqs.filter((r) => r.status === "pending" && r.slug === live.slug).sort((a, b) => a.at - b.at)[0];
    if (req) {
      const can = PEOPLE.filter((p) => !hasSigned(req, p.id) && slotFor(req, p));
      const pick = can.find((p) => p.id === s.who) ?? can[0];
      if (pick) { who = pick.id; signer = pick.name; }
    }
  }

  const mine = role === target;
  const text = mine
    ? `${head} Your turn.`
    : `${head} Waiting on ${WHO_WORD[target]}.`;
  const button = mine
    ? target === "reviewer" ? `Open the approval${signer ? ` as ${signer}` : ""}` : "Open it"
    : target === "reviewer" ? `Switch to back office${signer ? ` as ${signer}` : ""}` : `Switch to ${target} and continue`;
  return { actor, role: target, go, who, text, button, tone: "wait" };
}
