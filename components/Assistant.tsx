"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Routes } from "@/lib/routes";
import { lots } from "@/data/lots";
import { NO_MEMORY, answer, nudgeFor, suggestionsFor, type Answer, type Memory } from "@/lib/assistant";
import { useStore } from "@/lib/dealStore";
import { useDemand } from "@/lib/demand";
import { useLang, useRole, useT } from "./I18n";
import AnswerCard from "./AssistantCards";

type Msg = { id: number; from: "you"; text: string } | { id: number; from: "ai"; a: Answer; done: boolean };

// Where the visitor is, so "this lot" means the lot on screen. Hash routes (hosted demo) or real paths (Next).
function currentHash(): string {
  if (typeof window === "undefined") return "";
  const h = window.location.hash.slice(1);
  if (h) return h;
  return window.location.pathname.match(/\/lots\/([^/]+)/)?.[1] ?? "";
}

// A four-point spark: the mark for "this is AI" on the button, the panel and every answer.
function Spark() {
  return (
    <svg className="ask-spark" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5 14.5 9.5 22.5 12 14.5 14.5 12 22.5 9.5 14.5 1.5 12 9.5 9.5Z" />
    </svg>
  );
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function AiMsg({ a, done, onDone, onTick, ask, close }: { a: Answer; done: boolean; onDone: () => void; onTick: () => void; ask: (q: string) => void; close: () => void }) {
  const t = useT();
  const [skip] = useState(() => done || reducedMotion());
  const words = useMemo(() => a.text.split(" "), [a.text]);
  const [phase, setPhase] = useState<"think" | "type" | "done">(skip ? "done" : "think");
  const [n, setN] = useState(skip ? words.length : 0);

  useEffect(() => {
    if (skip && !done) onDone();
  }, [skip, done, onDone]);
  useEffect(() => {
    if (phase !== "think") return;
    const id = setTimeout(() => setPhase("type"), 600 + (a.checked?.length ?? 1) * 160);
    return () => clearTimeout(id);
  }, [phase, a.checked?.length]);
  useEffect(() => {
    if (phase !== "type") return;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      if (i >= words.length) {
        clearInterval(id);
        setN(words.length);
        setPhase("done");
        onDone();
      } else setN(i);
      onTick();
    }, 26);
    return () => clearInterval(id);
  }, [phase, words.length, onDone, onTick]);

  if (phase === "think") {
    return (
      <div className="ask-msg ask-ai is-thinking" role="status">
        <span className="ask-aitag">
          <Spark /> AI
        </span>
        <ul className="ask-think">
          {(a.checked ?? [a.source]).map((c, i) => (
            <li key={c} style={{ animationDelay: `${i * 140}ms` }}>
              {t("Checking")} {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const typing = phase === "type";
  return (
    <div className={`ask-msg ask-ai${a.refused ? " is-refusal" : ""}`}>
      <span className="ask-aitag">
        <Spark /> AI
      </span>
      <p aria-hidden={typing || undefined}>{typing ? words.slice(0, n).join(" ") : a.text}</p>
      {typing && <p className="sr-only">{a.text}</p>}
      {!typing && (
        <>
          {a.lines?.map((l, j) => (
            <p key={j} className="ask-line">
              {l}
            </p>
          ))}
          {a.card && <AnswerCard card={a.card} />}
          {a.english && <p className="ask-src">{t("Shown in English in this demo.")}</p>}
          <p className="ask-src">
            {t("AI answer. Source:")} {a.source}
          </p>
          {(a.sources?.length || a.go || a.act) && (
            <div className="ask-links">
              {a.sources?.map((s) => (
                <a key={s.to + s.label} className="ask-go" href={s.to} onClick={close}>
                  {s.label}
                </a>
              ))}
              {a.go && (
                <a className="ask-go" href={a.go.to} onClick={close}>
                  {a.go.label}
                </a>
              )}
              {a.act && (
                <button
                  type="button"
                  className="ask-go"
                  onClick={() => {
                    window.dispatchEvent(new Event(a.act!.event));
                    close();
                  }}
                >
                  {a.act.label}
                </button>
              )}
            </div>
          )}
          {a.next && a.next.length > 0 && (
            <div className="ask-next" aria-label={t("Follow-up questions")}>
              {a.next.slice(0, 2).map((q) => (
                <button key={q} type="button" className="ask-chip" onClick={() => ask(q)}>
                  {t(q)}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// SIMULATED assistant: fixed rules over the demo record, no live AI call. It is visibly marked as AI everywhere.
// COMPLIANCE: it explains, compares and drafts. It never approves, signs, releases money, changes a tier,
// or shows a location or identity. Every answer says it is AI and names the record it used.
export default function Assistant({ routes }: { routes: Routes }) {
  // A new conversation starts when the demo view changes, so a buyer's chat never carries over to a seller's or the back office's.
  const { role } = useRole();
  return <AssistantPanel key={role} routes={routes} />;
}

function AssistantPanel({ routes }: { routes: Routes }) {
  const t = useT();
  const { lang } = useLang();
  const { role } = useRole();
  const store = useStore();
  const demand = useDemand();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState<Msg[]>([]);
  const [hash, setHash] = useState("");
  const memory = useRef<Memory>(NO_MEMORY);
  const seq = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nudge = nudgeFor({ role, hash, lots, store, demand: demand.reqs, routes });

  useEffect(() => {
    const on = () => setHash(currentHash());
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const toEnd = () => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(toEnd, [log, open]);

  function ask(q: string) {
    const clean = q.trim();
    if (!clean) return;
    const a = answer(clean, { role, hash, lots, store, demand: demand.reqs, routes, lang, memory: memory.current });
    memory.current = { lots: a.lots ?? memory.current.lots, lastQ: a.asked };
    const id = ++seq.current;
    setLog((l) => [...l, { id, from: "you", text: clean }, { id: id + 0.5, from: "ai", a, done: false }]);
    setText("");
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
  };
  const markDone = (id: number) => setLog((l) => l.map((m) => (m.id === id && m.from === "ai" ? { ...m, done: true } : m)));

  const who = role === "seller" ? t("a seller") : role === "reviewer" ? t("back office staff") : t("a buyer");

  return (
    <>
      {!open && (
        <button type="button" className="ask-btn" onClick={() => setOpen(true)} aria-expanded={false} aria-haspopup="dialog">
          <Spark />
          <span>{t("Ask the Exchange")}</span>
          <span className="ask-aibadge">AI</span>
          {nudge && <span className="ask-dot" aria-label={t("Something is waiting for you")} />}
        </button>
      )}
      {open && (
        <aside className="ask" role="dialog" aria-label={t("Ask the Exchange")}>
          <div className="ask-head">
            <div>
              <strong>
                <Spark /> {t("Ask the Exchange")}
              </strong>
              <span className="ask-tag">
                <b className="ask-aibadge">AI</b> {t("AI assistant, simulated")}
              </span>
            </div>
            <button type="button" className="tour-x" onClick={() => setOpen(false)} aria-label={t("Close the assistant")}>
              ×
            </button>
          </div>
          <p className="ask-rule">
            {t("You are viewing as {who}. I explain, compare and draft from the record you may see. I never approve, sign, release money or change a tier. Named people do that.", { who })}
          </p>
          <div className="ask-log" ref={logRef} role="log" aria-live="polite">
            {log.length === 0 && (
              <>
                {nudge && (
                  <p className="ask-nudge">
                    <Spark /> {nudge.text}{" "}
                    {nudge.go && (
                      <a href={nudge.go.to} onClick={() => setOpen(false)}>
                        {nudge.go.label}
                      </a>
                    )}
                  </p>
                )}
                <p className="ask-empty">{t("Try one of these:")}</p>
              </>
            )}
            {log.map((m) =>
              m.from === "you" ? (
                <p key={m.id} className="ask-msg ask-you">
                  {m.text}
                </p>
              ) : (
                <AiMsg key={m.id} a={m.a} done={m.done} onDone={() => markDone(m.id)} onTick={toEnd} ask={ask} close={() => setOpen(false)} />
              )
            )}
          </div>
          {log.length === 0 && (
            <div className="ask-chips">
              {suggestionsFor(role).map((s) => (
                <button key={s} type="button" className="ask-chip" onClick={() => ask(s)}>
                  {t(s)}
                </button>
              ))}
            </div>
          )}
          <form className="ask-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="ask-input">
              {t("Your question")}
            </label>
            <input id="ask-input" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Ask about a lot, a step or a rule")} autoComplete="off" />
            <button type="submit" className="btn" disabled={!text.trim()}>
              {t("Ask")}
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
