"use client";

import { useState, type FormEvent } from "react";
import type { Status } from "@/lib/grade";
import { mines } from "@/data/mines";
import { MIN_PHOTOS, PHOTO_SLOTS, type PhotoKind } from "@/lib/photos";
import type { Routes } from "@/lib/routes";
import Mark from "./Mark";
import { Art } from "./PhotoEvidence";
import { useT } from "./I18n";
import MessageToLot from "./MessageToLot";
import type { FieldKey } from "@/lib/assistant";
import { clearResponding, useDemand } from "@/lib/demand";

const LOT_NUMBER = "0445";
const FACTOR = 1.22; // handheld Ta reading x 1.22 = estimated Ta2O5
const TARGET = 23; // the trader's own minimum, percent Ta2O5

export default function SellForm({ routes }: { routes: Routes }) {
  const t = useT();
  const [tonnes, setTonnes] = useState("");
  const [incoterm, setIncoterm] = useState("CIF Demo Port");
  const [price, setPrice] = useState("");
  const [operator, setOperator] = useState("");
  const [mineName, setMineName] = useState("");
  const [ta, setTa] = useState("");
  const [reading, setReading] = useState("");
  const [weight, setWeight] = useState("");
  const [photos, setPhotos] = useState<Record<PhotoKind, boolean>>({ scale: false, xrf: false, bags: false, handover: false });
  const [sent, setSent] = useState(false);
  const demand = useDemand();
  const resp = demand.reqs.find((r) => r.id === demand.responding);
  // A seller who said "I can supply" arrives with the quantity and delivery term filled in (once per request).
  const [seenResp, setSeenResp] = useState("");
  if (resp && seenResp !== resp.id) {
    setSeenResp(resp.id);
    setTonnes(String(resp.tonnes));
    setIncoterm(resp.incoterm);
  }

  // The seller confirmed the read-back. Only fields the assistant was sure of arrive. These are seller claims, not evidence.
  function applyMessage(v: Partial<Record<FieldKey, string>>) {
    if (v.tonnes) setTonnes(v.tonnes);
    if (v.incoterm) setIncoterm(v.incoterm);
    if (v.price) setPrice(v.price);
    if (v.ta) setTa(v.ta);
    if (v.operator) setOperator(v.operator);
    if (v.mine) setMineName(v.mine);
  }

  const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
  const tn = num(tonnes);
  const pr = num(price);
  const taN = num(ta);
  const wN = num(weight);
  const mine = mines.find((m) => m.name === mineName);
  // COMPLIANCE: only Verified and Watch mines can supply lots. Blocked and Unverified cannot.
  const mineOk = !!mine && (mine.tier === "Verified" || mine.tier === "Watch");
  const est = taN > 0 ? Math.round(taN * FACTOR * 10) / 10 : NaN;
  const lines = reading.split("\n").filter((l) => l.trim()).length;
  const diff = tn > 0 && wN > 0 ? Math.abs(wN - tn) / tn * 100 : NaN;
  const photoCount = Object.values(photos).filter(Boolean).length;

  const items: { label: string; status: Status; note: string }[] = [
    {
      label: t("Lot details"),
      status: tn > 0 && pr > 0 && operator.trim() ? "verified" : "missing",
      note: t("Tonnes, price and operator are filled in."),
    },
    {
      label: t("Mine can supply lots"),
      status: !mine ? "missing" : mineOk ? "verified" : "failed",
      note: mine && !mineOk ? t("{tier} mines cannot supply lots.", { tier: t(mine.tier) }) : t("The mine is Verified or Watch."),
    },
    {
      label: t("Handheld reading"),
      status: taN > 0 && taN <= 65 ? "verified" : taN > 65 ? "failed" : "missing",
      note: taN > 65 ? t("That Ta reading is not plausible. Check the instrument.") : t("A Ta reading is entered."),
    },
    {
      label: t("Full instrument reading"),
      status: lines >= 3 ? "verified" : lines > 0 ? "partial" : "missing",
      note: t("Every element line, not only Ta (at least 3 lines)."),
    },
    {
      label: t("Scale weight matches"),
      status: diff <= 1 ? "verified" : diff > 1 ? "failed" : "missing",
      note: diff > 1 ? t("The scale weight differs from the listed tonnes by {p}%.", { p: diff.toFixed(1) }) : t("Within 1% of the listed tonnes."),
    },
    {
      label: t("Photos"),
      status: photoCount >= MIN_PHOTOS ? "verified" : photoCount > 0 ? "partial" : "missing",
      note: t("At least {n} of 4 photos.", { n: MIN_PHOTOS }),
    },
  ];
  const ready = items.every((i) => i.status === "verified");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ready) setSent(true);
  }

  function reset() {
    setSent(false);
    setTonnes(""); setPrice(""); setOperator(""); setMineName(""); setTa(""); setReading(""); setWeight("");
    setPhotos({ scale: false, xrf: false, bags: false, handover: false });
  }

  if (sent) {
    return (
      <section className="review-desk">
        <h1>{t("List a lot")}</h1>
        <div className="case" role="status" style={{ marginTop: 32, maxWidth: 640 }}>
          <p className="reserved-title">{t("Lot {n} submitted (demo)", { n: LOT_NUMBER })}</p>
          <p style={{ marginTop: 8 }}>
            {t("It goes to a named reviewer. Buyers cannot see it until the reviewer approves it. Nothing is saved in this demo.")}
          </p>
          <p style={{ marginTop: 12 }}>
            <a href={routes.review}>{t("Open the reviewer desk")}</a>
          </p>
          <button type="button" className="btn btn-quiet" onClick={reset} style={{ width: "auto" }}>
            {t("List another lot")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="lot">
      <div className="lot-grid">
        <header className="hero hero-plain">
          <div className="hero-copy">
            <p className="lot-id">{t("Lot {n} (demo)", { n: LOT_NUMBER })}</p>
            <h1>{t("List a lot")}</h1>
            <p className="reason">
              {t("Record the lot the way the field team does. A named reviewer checks it before any buyer sees it.")}
            </p>
          </div>
        </header>

        <form className="body" id="sell-form" onSubmit={submit}>
          {resp && (
            <p className="demand-banner" role="status">
              {t("Responding to {id}: {n} tonnes, {term}. The buyer stays anonymous. Nothing is agreed until both sides are cleared and a named reviewer approves the lot.", {
                id: resp.id, n: resp.tonnes, term: resp.incoterm.split(" ")[0],
              })}{" "}
              <button type="button" className="btn-link" onClick={clearResponding}>
                {t("Stop responding")}
              </button>
            </p>
          )}
          <MessageToLot onApply={applyMessage} />
          <section className="block" aria-labelledby="h-basics">
            <div className="block-head">
              <h2 id="h-basics">{t("Lot details")}</h2>
              <p>{t("Grade basis is fixed at 25% Ta2O5")}</p>
            </div>
            <div className="fields">
              <label className="field">
                <span>{t("Quantity (tonnes)")}</span>
                <input inputMode="decimal" value={tonnes} onChange={(e) => setTonnes(e.target.value)} />
              </label>
              <label className="field">
                <span>{t("Delivery")}</span>
                <select value={incoterm} onChange={(e) => setIncoterm(e.target.value)}>
                  <option>CIF Demo Port</option>
                  <option>FOB Demo Port</option>
                </select>
              </label>
              <label className="field">
                <span>{t("Asking price (USD per lb Ta2O5)")}</span>
                <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label className="field">
                <span>{t("Operator who took the reading")}</span>
                <input value={operator} onChange={(e) => setOperator(e.target.value)} />
              </label>
              <label className="field wide">
                <span>{t("Source mine")}</span>
                <select value={mineName} onChange={(e) => setMineName(e.target.value)}>
                  <option value="">{t("Choose a mine")}</option>
                  {mines.map((m) => (
                    <option key={m.name} value={m.name} disabled={m.tier === "Blocked" || m.tier === "Unverified"}>
                      {m.name}, {t(m.tier)}
                      {m.tier === "Blocked" || m.tier === "Unverified" ? ` (${t("cannot supply lots")})` : ""}
                    </option>
                  ))}
                </select>
                <small>{t("The app records the location for reviewers. Buyers never see it.")}</small>
              </label>
            </div>
          </section>

          <section className="block" aria-labelledby="h-capture">
            <div className="block-head">
              <h2 id="h-capture">{t("Field reading")}</h2>
              <p>{t("Handheld XRF")}</p>
            </div>
            <div className="fields">
              <label className="field">
                <span>{t("Ta reading (%)")}</span>
                <input inputMode="decimal" value={ta} onChange={(e) => setTa(e.target.value)} />
              </label>
              <div className="field estimate" aria-live="polite">
                <span>{t("Estimated Ta2O5 (Ta x 1.22)")}</span>
                <strong className={est < TARGET ? "is-low" : undefined}>{Number.isNaN(est) ? "—" : `${est.toFixed(1)}%`}</strong>
                <small>
                  {Number.isNaN(est)
                    ? t("Enter the Ta reading.")
                    : est < TARGET
                      ? t("Below your {n}% target. A handheld cannot give a true Ta2O5, so a lab must confirm.", { n: TARGET })
                      : t("Above your {n}% target. A lab must still confirm it.", { n: TARGET })}
                </small>
              </div>
              <label className="field wide">
                <span>{t("Full instrument reading (every element line)")}</span>
                <textarea rows={5} value={reading} onChange={(e) => setReading(e.target.value)} placeholder={"Ta 20.6\nNb ...\nU ...\nSn ..."} />
              </label>
              <label className="field">
                <span>{t("Scale weight (tonnes)")}</span>
                <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </label>
            </div>
          </section>

          <section className="block" aria-labelledby="h-photos-sell">
            <div className="block-head">
              <h2 id="h-photos-sell">{t("Photos")}</h2>
              <p>{t("{a} of 4 added", { a: photoCount })}</p>
            </div>
            <ul className="photos on-dark">
              {PHOTO_SLOTS.map((s) => (
                <li key={s.kind} className="photo">
                  <button
                    type="button"
                    className="photo-art photo-add"
                    aria-pressed={photos[s.kind]}
                    onClick={() => setPhotos((p) => ({ ...p, [s.kind]: !p[s.kind] }))}
                  >
                    {photos[s.kind] ? <Art kind={s.kind} /> : <span>{t("Add photo")}</span>}
                  </button>
                  <h3>{t(s.title)}</h3>
                  <p>{t(s.what)}</p>
                  <p className="photo-meta">{photos[s.kind] ? t("Added (demo). Tap to remove.") : t("Not added yet.")}</p>
                </li>
              ))}
            </ul>
          </section>
        </form>

        <aside className="rail" aria-label={t("Ready to submit?")}>
          <h2>{t("Ready to submit?")}</h2>
          <ul className="pack">
            {items.map((i) => (
              <li key={i.label}>
                <Mark status={i.status} />
                <span>
                  {i.label}
                  <small className="item-note">{i.note}</small>
                </span>
                <span />
              </li>
            ))}
          </ul>
          <div className="reserve">
            <button type="submit" form="sell-form" className="btn" disabled={!ready}>
              {t("Submit for review")}
            </button>
            <p className="reserve-note">
              {t("A named reviewer decides. AI can summarise and flag, but it never approves a lot.")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
