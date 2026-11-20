"use client";

import { useId, useState, type ReactNode } from "react";
import { useT } from "./I18n";

// A small "?" that opens a plain-words note. Keeps screens light until the reader wants the detail.
export default function Hint({ children, label }: { children: ReactNode; label?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="hint">
      <button
        type="button"
        className="hint-btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label ? t(label) : t("What does this mean?")}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open && (
        <span id={id} className="hint-body" role="note">
          {children}
        </span>
      )}
    </span>
  );
}
