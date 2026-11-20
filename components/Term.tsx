"use client";

import { GLOSSARY } from "@/lib/glossary";
import { useT } from "./I18n";

// Wraps a trade term so tapping or hovering shows a plain-words meaning.
export default function Term({ k, children }: { k: string; children?: React.ReactNode }) {
  const t = useT();
  const g = GLOSSARY.find((x) => x.term === k);
  if (!g) return <>{children ?? k}</>;
  return (
    <span className="term" tabIndex={0}>
      {children ?? t(k)}
      <span className="term-tip" role="tooltip">
        {t(g.meaning)}
      </span>
    </span>
  );
}
