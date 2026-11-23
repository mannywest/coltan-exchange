"use client";

import { useState } from "react";
import { disputeHelp } from "@/lib/assistant";
import { useT } from "./I18n";

// Assay helper. SIMULATED: fixed rules and a template, no live AI call.
// COMPLIANCE: it applies the published tolerance and drafts neutral wording. It never decides the outcome,
// picks a side or records a result. A named reviewer records the result in the back office.
export default function DisputeHelper({
  lotNumber,
  buyerLab,
  independent,
  umpire,
}: {
  lotNumber: string;
  buyerLab: number;
  independent: number;
  umpire?: number;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const h = disputeHelp(lotNumber, { buyerLab, independent, umpire });
  if (!h) return null;
  return (
    <aside className="helper" aria-label={t("Assay helper")}>
      <p className="helper-tag">
        <strong>{t("Assay helper")}</strong> <span>{t("AI assistant, simulated")}</span>
      </p>
      {h.lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      <p className="helper-next">{h.next}</p>
      <label className="field">
        <span>{t("Draft message to both sides")}</span>
        <textarea readOnly rows={11} value={h.draft} />
      </label>
      <button
        type="button"
        className="btn btn-quiet"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(h.draft);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
      >
        {copied ? t("Copied") : t("Copy the draft")}
      </button>
      <p className="helper-foot">{t("A named reviewer records the outcome. The helper only explains and drafts.")}</p>
    </aside>
  );
}
