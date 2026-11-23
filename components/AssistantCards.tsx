"use client";

import type { Card } from "@/lib/assistant";
import { STATUS_WORD, type Status } from "@/lib/grade";
import { GRADE_COLOUR, GRADE_LABEL } from "@/lib/ui";
import { useT } from "./I18n";

const SEG: Record<Status, string> = { verified: "var(--verified)", partial: "var(--amber)", missing: "var(--faint)", failed: "var(--blocked)" };

function Segments({ items }: { items: { status: Status }[] }) {
  return (
    <span className="ac-seg" aria-hidden="true">
      {items.map((it, i) => (
        <i key={i} style={{ background: SEG[it.status] }} />
      ))}
    </span>
  );
}

// Small answer cards shown inside the assistant. All figures come from the demo record.
// COMPLIANCE: a card never shows a location or an identity. Risk signals are shown to back office staff only.
export default function AnswerCard({ card }: { card: Card }) {
  const t = useT();

  if (card.kind === "compare") {
    return (
      <ul className="ac ac-compare" aria-label={t("Lots side by side")}>
        {card.rows.map((r) => (
          <li key={r.number}>
            <div className="ac-line">
              <strong>
                {t("Lot")} {r.number}
              </strong>
              <span className="ac-grade" style={{ borderColor: GRADE_COLOUR[r.grade], color: GRADE_COLOUR[r.grade] }}>
                {r.grade} · {t(GRADE_LABEL[r.grade])}
              </span>
            </div>
            <div className="ac-line ac-muted">
              <span>{t("{n} of 6 checks verified", { n: r.verified })}</span>
            </div>
            <div className="ac-line ac-muted">
              {r.tonnes} t · USD {r.price} / lb · {r.term} · {t(r.tier)}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (card.kind === "checks") {
    return (
      <div className="ac" role="group" aria-label={t("Evidence checks for lot {n}", { n: card.lot })}>
        <Segments items={card.items} />
        <ul className="ac-list">
          {card.items.map((it) => (
            <li key={it.label} className={`ac-st-${it.status}`}>
              <span className="ac-name">{t(it.label)}</span>
              <span className="ac-word">{t(STATUS_WORD[it.status])}</span>
              {it.who && <span className="ac-who">{t("Needs {who}", { who: it.who })}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (card.kind === "maths") {
    return (
      <div className="ac" role="group" aria-label={card.title}>
        <dl className="ac-maths">
          {card.rows.map(([k, v], i) => (
            <div key={k} className={i === 3 ? "is-total" : undefined}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="ac-note">{card.note}</p>
      </div>
    );
  }

  if (card.kind === "steps") {
    return (
      <ol className="ac ac-steps" aria-label={t("Deal steps")}>
        {card.labels.map((l, i) => (
          <li key={l} className={card.current && i + 1 < card.current ? "is-done" : card.current === i + 1 ? "is-now" : undefined}>
            {t(l)}
          </li>
        ))}
        {card.waiting && card.waiting !== "Nobody" && <li className="ac-wait">{t("Waiting on: {who}", { who: t(card.waiting) })}</li>}
      </ol>
    );
  }

  return (
    <div className="ac" role="group" aria-label={card.mine}>
      <div className="ac-line">
        <strong>{card.mine}</strong>
        <span className="ac-grade">{t(card.tier)}</span>
      </div>
      <p className="ac-note">{card.note}</p>
      {card.signals && card.signals.length > 0 && (
        <ul className="ac-signals">
          {card.signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {card.signals && card.signals.length === 0 && <p className="ac-note">{t("No open risk signals.")}</p>}
      {card.hidden && <p className="ac-note">{t("Specific signals are visible to back office staff only.")}</p>}
    </div>
  );
}
