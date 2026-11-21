"use client";

import type { Lot } from "@/lib/grade";
import type { Routes } from "@/lib/routes";
import { href } from "@/lib/routes";
import { ago, sellerSign, submitShipment, toggleDoc, useStore } from "@/lib/dealStore";
import { SHIP_DOCS, dealStage } from "@/lib/approvals";
import { useRole, useT } from "./I18n";

// "My deals" for a buyer, "Deals on my lots" for a seller. The seller countersigns here.
// COMPLIANCE: a deal is not live until both sides have signed. Part-lot sales need the seller's agreement.
export default function Deals({ lots, routes }: { lots: Lot[]; routes: Routes }) {
  const t = useT();
  const s = useStore();
  const { role } = useRole();
  const seller = role === "seller";
  const deals = Object.values(s.deals).sort((a, b) => b.at - a.at);

  return (
    <section className="review-desk">
      <h1>{seller ? t("Deals on my lots") : t("My deals")}</h1>
      <p className="listing-intro">
        {seller
          ? t("Buyers who reserved your lots. You countersign the locked terms before any money moves.")
          : t("Every lot you reserved, where it is now, and who has to act next.")}
      </p>
      {deals.length === 0 ? (
        <div className="empty">
          <h2>{t("No deals yet")}</h2>
          <p>{seller ? t("When a buyer reserves one of your lots it appears here.") : t("Reserve a lot and it appears here, so you can come back to it.")}</p>
          <a className="btn btn-quiet" href={routes.lots}>{t("Browse the lots")}</a>
        </div>
      ) : (
        <ul className="deal-cards">
          {deals.map((d) => {
            const lot = lots.find((l) => l.slug === d.slug);
            const st = dealStage(d, s);
            const canCountersign = seller && d.buyerSigned && !d.sellerSigned && st.waitingOn === "Seller";
            return (
              <li key={d.slug} className={`deal-card tone-${st.tone}`}>
                <div>
                  <h2>
                    {t("Lot")} {d.lotNumber} <small>{d.qty} t · {lot?.sellerAlias}</small>
                  </h2>
                  <p>
                    <b>
                      {t("Step {n} of 7", { n: st.step })}: {t(st.label)}
                    </b>
                    <small>{st.detail}</small>
                  </p>
                  <p className="reserve-note">
                    {st.waitingOn === "Nobody" ? t("Nothing more to do.") : t("Waiting on: {who}", { who: t(st.waitingOn) })} · {t("Reserved {when}", { when: ago(d.at) })}
                  </p>
                </div>
                {seller && st.step === 4 && st.waitingOn === "Seller" && (
                  <fieldset className="ship-docs">
                    <legend>{t("Attach the export documents (demo: a tick stands in for the upload)")}</legend>
                    {SHIP_DOCS.map((doc) => (
                      <label key={doc} className="check-row">
                        <input type="checkbox" checked={d.docs.includes(doc)} onChange={() => toggleDoc(d.slug, doc)} />
                        <span>{t(doc)}</span>
                      </label>
                    ))}
                    <button type="button" className="btn" disabled={d.docs.length < SHIP_DOCS.length} onClick={() => submitShipment(d.slug)}>
                      {t("Submit the shipment record (demo)")}
                    </button>
                  </fieldset>
                )}
                <div className="deal-card-actions">
                  {canCountersign && (
                    <button type="button" className="btn" onClick={() => sellerSign(d.slug)}>
                      {t("Countersign terms (demo)")}
                    </button>
                  )}
                  <a className="btn btn-quiet" href={href(routes.deal, d.slug)}>
                    {t("Open the deal")}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
