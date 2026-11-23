"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Routes } from "@/lib/routes";
import { lots } from "@/data/lots";
import { answer, suggestionsFor, type Answer } from "@/lib/assistant";
import { useStore } from "@/lib/dealStore";
import { useDemand } from "@/lib/demand";
import { useRole, useT } from "./I18n";

type Msg = { from: "you"; text: string } | ({ from: "ai" } & Answer);

// Where the visitor is, so "this lot" means the lot on screen. Hash routes (hosted demo) or real paths (Next).
function currentHash(): string {
  if (typeof window === "undefined") return "";
  const h = window.location.hash.slice(1);
  if (h) return h;
  return window.location.pathname.match(/\/lots\/([^/]+)/)?.[1] ?? "";
}

// SIMULATED assistant: fixed rules over the demo record, no live AI call.
// COMPLIANCE: it explains, compares and drafts. It never approves, signs, releases money, changes a tier,
// or shows a location or identity. Every answer says it is AI and names the record it used.
export default function Assistant({ routes }: { routes: Routes }) {
  const t = useT();
  const { role } = useRole();
  const store = useStore();
  const demand = useDemand();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState<Msg[]>([]);
  const [hash, setHash] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [log, open]);

  function ask(q: string) {
    const clean = q.trim();
    if (!clean) return;
    const a = answer(clean, { role, hash, lots, store, demand: demand.reqs, routes });
    setLog((l) => [...l, { from: "you", text: clean }, { from: "ai", ...a }]);
    setText("");
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
  };

  const who = role === "seller" ? t("a seller") : role === "reviewer" ? t("back office staff") : t("a buyer");

  return (
    <>
      {!open && (
        <button type="button" className="ask-btn" onClick={() => setOpen(true)} aria-expanded={false} aria-haspopup="dialog">
          {t("Ask the Exchange")}
        </button>
      )}
      {open && (
        <aside className="ask" role="dialog" aria-label={t("Ask the Exchange")}>
          <div className="ask-head">
            <div>
              <strong>{t("Ask the Exchange")}</strong>
              <span className="ask-tag">{t("AI assistant, simulated")}</span>
            </div>
            <button type="button" className="tour-x" onClick={() => setOpen(false)} aria-label={t("Close the assistant")}>
              ×
            </button>
          </div>
          <p className="ask-rule">
            {t("You are viewing as {who}. I explain, compare and draft from the record you may see. I never approve, sign, release money or change a tier. Named people do that.", { who })}
          </p>
          <div className="ask-log" aria-live="polite">
            {log.length === 0 && <p className="ask-empty">{t("Try one of these:")}</p>}
            {log.map((m, i) =>
              m.from === "you" ? (
                <p key={i} className="ask-msg ask-you">
                  {m.text}
                </p>
              ) : (
                <div key={i} className={`ask-msg ask-ai${m.refused ? " is-refusal" : ""}`}>
                  <p>{m.text}</p>
                  {m.lines?.map((l, j) => (
                    <p key={j} className="ask-line">
                      {l}
                    </p>
                  ))}
                  <p className="ask-src">
                    {t("AI answer. Source:")} {m.source}
                  </p>
                  {m.go && (
                    <a className="ask-go" href={m.go.to} onClick={() => setOpen(false)}>
                      {m.go.label}
                    </a>
                  )}
                </div>
              )
            )}
            <div ref={endRef} />
          </div>
          <div className="ask-chips">
            {suggestionsFor(role).map((s) => (
              <button key={s} type="button" className="ask-chip" onClick={() => ask(s)}>
                {t(s)}
              </button>
            ))}
          </div>
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
