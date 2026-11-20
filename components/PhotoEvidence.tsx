"use client";

import type { Lot } from "@/lib/grade";
import { MIN_PHOTOS, photoSet, type PhotoKind } from "@/lib/photos";
import { fmtDateTime } from "@/lib/format";
import { useT } from "./I18n";

// Simple line drawings stand in for the photos in this demo.
export function Art({ kind }: { kind: PhotoKind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 160 120" role="img" aria-hidden="true" {...common}>
      {kind === "scale" && (
        <>
          <path d="M48 86C48 50 62 44 80 44s32 6 32 42" />
          <rect x="24" y="86" width="112" height="14" />
          <rect x="58" y="104" width="44" height="10" />
          <path d="M66 109h6M80 109h6M92 109h4" />
        </>
      )}
      {kind === "xrf" && (
        <>
          <rect x="46" y="14" width="68" height="92" rx="8" />
          <rect x="54" y="24" width="52" height="42" />
          <path d="M60 34h40M60 42h30M60 50h36M60 58h22" />
          <circle cx="80" cy="84" r="7" />
        </>
      )}
      {kind === "bags" && (
        <>
          <rect x="26" y="40" width="44" height="64" rx="2" />
          <rect x="90" y="40" width="44" height="64" rx="2" />
          <rect x="36" y="28" width="24" height="12" />
          <rect x="100" y="28" width="24" height="12" />
          <path d="M34 62h28M34 72h20M98 62h28M98 72h20" />
        </>
      )}
      {kind === "handover" && (
        <>
          <path d="M80 18a22 22 0 0 1 22 22c0 20-22 46-22 46s-22-26-22-46a22 22 0 0 1 22-22z" />
          <circle cx="80" cy="40" r="8" />
          <path d="M26 104h108M40 98v12M80 98v12M120 98v12" />
        </>
      )}
    </svg>
  );
}

export default function PhotoEvidence({ lot }: { lot: Lot }) {
  const t = useT();
  const slots = photoSet(lot);
  const have = slots.filter((s) => s.present).length;
  return (
    <section className="block" aria-labelledby="h-photos">
      <div className="block-head">
        <h2 id="h-photos">{t("Photo evidence")}</h2>
        <p>
          {t("{a} of {b} required photos", { a: have, b: slots.length })}
        </p>
      </div>
      <ul className="photos">
        {slots.map((s) => (
          <li key={s.kind} className={s.present ? "photo" : "photo is-missing"}>
            <div className="photo-art">
              {s.present ? <Art kind={s.kind} /> : <span>{t("Missing")}</span>}
            </div>
            <h3>{t(s.title)}</h3>
            <p>{t(s.what)}</p>
            {s.present && s.at ? (
              <p className="photo-meta">
                {fmtDateTime(s.at)}, {s.by}. {t("Location data removed.")}
              </p>
            ) : (
              <p className="photo-meta">{t("Not on file for this lot.")}</p>
            )}
          </li>
        ))}
      </ul>
      {/* COMPLIANCE: buyers see cleaned copies only. Originals and exact locations stay with a few named people. */}
      <p className="assay-note">
        {have >= MIN_PHOTOS
          ? t("Enough photos are on file for buyers to see this lot.")
          : t("Too few photos are on file. Buyers cannot see a lot with fewer than three.")}{" "}
        {t("Photos back up the other checks and never raise a grade on their own, because they can be reused or staged. Buyers see copies with location data removed, checked for people. The drawings above are placeholders for real field photos.")}
      </p>
    </section>
  );
}
