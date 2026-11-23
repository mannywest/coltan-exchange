"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Routes } from "@/lib/routes";
import { BUYER, personName, useStore } from "@/lib/dealStore";
import { MAX_TONNES, NEEDED_BY, postDemand, removeDemand, respond, setPaused, useDemand, type DemandReq, type Incoterm } from "@/lib/demand";
import { MIN_TONNES } from "@/lib/price";
import { useRole, useT } from "./I18n";

// Demand board: what buyers are asking for, anonymous until both sides are cleared.
// COMPLIANCE: a requirement is not a deal and not an offer to trade. No matching happens here. A lot still needs
// a named reviewer's approval, and both sides must be cleared (simulated in this demo, required in the real product).
// Pausing or removing a requirement is a back office action and goes in the audit log.
export default function DemandBoard({ routes }: { routes: Routes }) {
  const t = useT();
  const { role } = useRole();
  const s = useStore();
  const d = useDemand();
  const [tonnes, setTonnes] = useState("");
  const [incoterm, setIncoterm] = useState<Incoterm>("CIF Demo Port");
  const [needed, setNeeded] = useState<string>(NEEDED_BY[0]);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sure, setSure] = useState<string | null>(null);
  useEffect(() => {
    if (!sure) return;
    const id = setTimeout(() => setSure(null), 4000);
    return () => clearTimeout(id);
  }, [sure]);

  const staff = role === "reviewer";
  const who = personName(s.who);
  const visible = d.reqs.filter((r) => staff || r.status === "open" || (role === "buyer" && r.mine));
  const intro =
    role === "seller"
      ? t("What buyers are asking for. Buyers are anonymous. Say you can supply and the form to list a lot opens with the quantity filled in.")
      : staff
        ? t("Every requirement, with who posted it. You can pause or remove one. Each action is written to the audit log.")
        : t("Tell sellers what you need. Your name stays hidden until both sides are cleared and a lot is approved.");

  function post(e: FormEvent) {
    e.preventDefault();
    const tn = tonnes.trim() === "" ? NaN : Number(tonnes);
    const raw = price.trim() === "" ? null : Number(price);
    const pr = raw !== null && Number.isNaN(raw) ? -1 : raw;
    const err = postDemand({ tonnes: tn, incoterm, neededBy: needed, maxPrice: pr });
    setError(err);
    setDone(!err);
    if (!err) {
      setTonnes("");
      setPrice("");
    }
  }

  const label = (r: DemandReq) => (staff ? r.buyer : r.mine ? t("You") : t("Anonymous buyer"));

  return (
    <section className="review-desk demand">
      <h1>{t("Demand board")}</h1>
      <p className="listing-intro">{intro}</p>

      {role === "buyer" && (
        <form className="case demand-form" onSubmit={post}>
          <h2>{t("Post a requirement")}</h2>
          <div className="fields">
            <label className="field">
              <span>{t("Quantity (tonnes)")}</span>
              <input inputMode="decimal" value={tonnes} onChange={(e) => setTonnes(e.target.value)} placeholder={`${MIN_TONNES} to ${MAX_TONNES}`} />
            </label>
            <label className="field">
              <span>{t("Delivery")}</span>
              <select value={incoterm} onChange={(e) => setIncoterm(e.target.value as Incoterm)}>
                <option>CIF Demo Port</option>
                <option>FOB Demo Port</option>
              </select>
            </label>
            <label className="field">
              <span>{t("Needed")}</span>
              <select value={needed} onChange={(e) => setNeeded(e.target.value)}>
                {NEEDED_BY.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("Highest price (USD per lb Ta2O5), optional")}</span>
              <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>
          </div>
          {error && (
            <p className="demand-error" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="demand-ok" role="status">
              {t("Posted. Sellers see it without your name. Nothing is agreed.")}
            </p>
          )}
          <button type="submit" className="btn">
            {t("Post requirement")}
          </button>
          <p className="demand-note">
            {t("A requirement is not an offer or a deal. Both sides must be cleared and a lot approved before anything is agreed. Clearing is simulated in this demo.")}
          </p>
        </form>
      )}

      {visible.length === 0 ? (
        <div className="empty">
          <h2>{t("No requirements yet")}</h2>
          <p>{t("When a buyer posts what they need, it appears here.")}</p>
        </div>
      ) : (
        <ul className="demand-list">
          {visible.map((r) => (
            <li key={r.id} className={`demand-card${r.status === "paused" ? " is-paused" : ""}`}>
              <div className="demand-top">
                <span className="demand-id">{r.id}</span>
                <span className="demand-status">{r.status === "paused" ? t("Paused") : t("Open")}</span>
              </div>
              <p className="demand-qty">
                <strong>{r.tonnes}</strong> {t("tonnes")}
              </p>
              <p className="demand-meta">
                {r.incoterm.split(" ")[0]} · {r.basis}% Ta2O5 · {t(r.neededBy)}
                {r.maxPrice ? ` · ${t("up to USD {p} per lb", { p: r.maxPrice })}` : ""}
              </p>
              <p className="demand-who">{label(r)}</p>
              {r.interested && (role === "buyer" ? r.mine : staff) && (
                <p className="demand-note">{t("A seller has said they can supply. Nothing is agreed and no lot is approved yet.")}</p>
              )}
              <div className="demand-actions">
                {role === "seller" && r.status === "open" &&
                  (r.interested ? (
                    <a className="btn btn-quiet" href={routes.sell}>
                      {t("You can supply. Open List a lot")}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        respond(r.id);
                        window.location.href = routes.sell;
                      }}
                    >
                      {t("I can supply")}
                    </button>
                  ))}
                {staff && (
                  <>
                    <button type="button" className="btn btn-quiet" onClick={() => setPaused(r.id, r.status === "open", who)}>
                      {r.status === "open" ? t("Pause") : t("Reopen")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => (sure === r.id ? (setSure(null), removeDemand(r.id, who)) : setSure(r.id))}
                    >
                      {sure === r.id ? t("Click again to remove") : t("Remove")}
                    </button>
                  </>
                )}
                {role === "buyer" && r.mine && (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => (sure === r.id ? (setSure(null), removeDemand(r.id, BUYER)) : setSure(r.id))}
                  >
                    {sure === r.id ? t("Click again to remove") : t("Remove my requirement")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {staff && <p className="demand-note">{t("Signed in as {name}. Actions here are logged in the back office audit log.", { name: who })}</p>}
    </section>
  );
}
