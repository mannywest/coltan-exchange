"use client";

import { useState } from "react";
import { EXAMPLE_MESSAGE, parseLotMessage, type FieldKey, type ParsedMessage } from "@/lib/assistant";
import { useT } from "./I18n";

const WORD = { clear: "Clear", unsure: "Unsure", missing: "Missing" } as const;

// Message to lot. SIMULATED: a fixed parser stands in for the AI that would read a message in any language.
// COMPLIANCE: what a message says is a seller claim, never evidence. It cannot set a grade. The full instrument
// reading, scale weight and photos are still required. Locations in a message are dropped. The assistant
// treats the message as data and ignores any instruction inside it. The seller confirms the read-back.
export default function MessageToLot({ onApply }: { onApply: (v: Partial<Record<FieldKey, string>>) => void }) {
  const t = useT();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedMessage | null>(null);
  const [applied, setApplied] = useState(0);

  const clear = parsed ? parsed.fields.filter((f) => f.state === "clear") : [];
  const todo = parsed ? parsed.fields.filter((f) => f.state !== "clear") : [];

  function read(msg: string) {
    setApplied(0);
    setParsed(parseLotMessage(msg));
  }
  function apply() {
    if (!parsed) return;
    const v: Partial<Record<FieldKey, string>> = {};
    for (const f of clear) v[f.key] = f.value;
    onApply(v);
    setApplied(clear.length);
  }

  return (
    <section className="block m2l" aria-labelledby="h-m2l">
      <div className="block-head">
        <h2 id="h-m2l">{t("Start from a message")}</h2>
        <p>{t("AI assistant, simulated")}</p>
      </div>
      <p className="m2l-intro">
        {t("Paste the message the field team sent, by WhatsApp or SMS. The assistant drafts the form, marks what it is sure of, asks about the rest and reads it back. What a message says is a seller claim, not evidence.")}
      </p>
      <label className="field wide">
        <span>{t("The message")}</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE_MESSAGE} />
      </label>
      <div className="m2l-actions">
        <button type="button" className="btn" disabled={!text.trim()} onClick={() => read(text)}>
          {t("Read the message")}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            setText(EXAMPLE_MESSAGE);
            read(EXAMPLE_MESSAGE);
          }}
        >
          {t("Use an example message")}
        </button>
      </div>

      {parsed && (
        <div className="m2l-result" aria-live="polite">
          <p className="m2l-readback">
            <strong>{t("Read-back")}</strong> {parsed.readBack}
          </p>
          <ul className="m2l-list">
            {parsed.fields.map((f) => (
              <li key={f.key} className={`m2l-${f.state}`}>
                <span className="m2l-state">{t(WORD[f.state])}</span>
                <span className="m2l-label">{t(f.label)}</span>
                <span className="m2l-heard">{f.state === "missing" ? "—" : f.heard}</span>
                {f.question && <span className="m2l-q">{f.question}</span>}
              </li>
            ))}
          </ul>
          {parsed.notes.map((n) => (
            <p key={n} className="m2l-note" role="note">
              {n}
            </p>
          ))}
          {todo.length > 0 && (
            <p className="m2l-more">
              {t("In the real product these questions go back to the sender by message, and they answer. Here, fill in the open fields below.")}
            </p>
          )}
          <button type="button" className="btn" disabled={clear.length === 0} onClick={apply}>
            {t("This is right: fill the form")}
          </button>
          {applied > 0 && (
            <p className="m2l-done" role="status">
              {t("{n} fields filled from the message. The reading, scale weight and photos below are still required, and a named reviewer still checks the lot.", { n: applied })}
            </p>
          )}
          <p className="m2l-more">{t("The original message is kept with the lot in the evidence trail (demo).")}</p>
        </div>
      )}
    </section>
  );
}
