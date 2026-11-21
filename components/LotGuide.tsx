"use client";

import type { Lot } from "@/lib/grade";
import { assayVerdict } from "@/lib/grade";
import { LB_PER_TONNE, PLATFORM_FEE_PCT, PROVISIONAL_SHARE, lotValue, preShipGrade } from "@/lib/price";
import { useT } from "./I18n";
import Hint from "./Hint";

// Three plain-language blocks for a first-time reader: how the price works, how long a deal takes,
// and what happens if something goes wrong. All figures are demo figures.
export default function LotGuide({ lot, total, show }: { lot: Lot; total: number; show: "price" | "wrong" }) {
  const t = useT();
  const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-GB")}`;
  const ore = lot.tonnes * LB_PER_TONNE;
  const tested = preShipGrade(lot);
  const metal = ore * (tested / 100);

  // If both labs are in and agree, the final grade is their average; the demo shows what that does to the total.
  const v = assayVerdict(lot);
  const labAvg =
    v.tone === "ok" && lot.assay.sellerLab !== null && lot.assay.independentLab !== null
      ? (lot.assay.sellerLab + lot.assay.independentLab) / 2
      : null;
  const adjusted = labAvg !== null ? lotValue(lot.tonnes, labAvg, lot.priceUsdPerLb) : null;

  const stages: [string, string][] = [
    ["Lot held for you", `${lot.holdHours} ${t("hours")}`],
    ["Terms signed", t("1 to 2 days")],
    ["Funds into escrow", t("about 2 days")],
    ["Shipment and custody log", t("7 to 14 days")],
    ["Final assay", t("5 to 7 days")],
    ["Named approver releases payment", t("1 day")],
  ];

  return (
    <>
      {show === "price" && (
        <>
      <section className="block" aria-labelledby="h-price">
        <div className="block-head">
          <h2 id="h-price">{t("How the price works")}</h2>
          <p>{t("Demo figures")}</p>
        </div>
        <p className="assay-intro">
          {t("You pay for the tantalum metal in the ore.")}
          <Hint>{t("You pay for the tantalum metal in the ore, not the weight of the rock. The price is per pound of Ta2O5.")}</Hint>
        </p>
        <table className="assay price-table">
          <caption className="sr-only">{t("How the price works")}</caption>
          <tbody>
            <tr>
              <th scope="row">{t("Ore weight")}</th>
              <td className="num">{Math.round(ore).toLocaleString("en-GB")} lb</td>
              <td>{t("{n} tonnes x 2,204.62 lb", { n: lot.tonnes })}</td>
            </tr>
            <tr>
              <th scope="row">{t("Metal in the ore")}</th>
              <td className="num">{Math.round(metal).toLocaleString("en-GB")} lb</td>
              <td>{t("Ore weight x {b}% (the independent lab result; the price basis is {p}%)", { b: tested.toFixed(1), p: lot.basisTa2O5 })}</td>
            </tr>
            <tr>
              <th scope="row">{t("Price")}</th>
              <td className="num">USD {lot.priceUsdPerLb}</td>
              <td>{t("per lb Ta2O5")}</td>
            </tr>
            <tr>
              <th scope="row">{t("Estimated total")}</th>
              <td className="num">{usd(total)}</td>
              <td>{t("{p}% goes into escrow first", { p: PROVISIONAL_SHARE * 100 })}</td>
            </tr>
          </tbody>
        </table>
        <p className="assay-note">
          {adjusted !== null && labAvg !== null
            ? t("When the labs report, the final grade replaces the basis. Both labs agree here, so the average ({a}%) would make the total {x}.", {
                a: labAvg.toFixed(2).replace(/0$/, ""),
                x: usd(adjusted),
              })
            : t("When the labs report, the confirmed grade replaces the basis, so the final total can move up or down.")}{" "}
          {t("Demo rule: the platform fee is {f}% of the final total from each side, charged only when payment is released. The platform never holds your money and never trades for itself.", {
            f: PLATFORM_FEE_PCT,
          })}
        </p>
        {/* COMPLIANCE: price, fee and escrow shares are demo figures. Payments run through a regulated escrow partner. */}
      </section>

      <section className="block" aria-labelledby="h-time">
        <div className="block-head">
          <h2 id="h-time">{t("How long a deal takes")}</h2>
          <p>{t("About 3 to 4 weeks (demo)")}</p>
        </div>
        <ol className="dealtime">
          {stages.map(([name, d]) => (
            <li key={name}>
              <span>{t(name)}</span>
              <b>{d}</b>
            </li>
          ))}
        </ol>
      </section>

        </>
      )}
      {show === "wrong" && (
      <section className="block" aria-labelledby="h-wrong">
        <div className="block-head">
          <h2 id="h-wrong">{t("If something goes wrong")}</h2>
          <p>{t("A named person decides, never AI")}</p>
        </div>
        {/* COMPLIANCE: disputes touch payments and origin claims. AI may summarise evidence only; a named human decides. */}
        <dl className="wrong">
          <div>
            <dt>{t("The labs disagree by more than 0.5 points")}</dt>
            <dd>{t("The sealed umpire sample is opened. Its result sets the final grade and price.")}</dd>
          </div>
          <div>
            <dt>{t("Weight, seal or custody does not match on arrival")}</dt>
            <dd>{t("Payment stays in escrow. A named Reviewer looks at the custody log and decides.")}</dd>
          </div>
          <div>
            <dt>{t("Evidence turns out to be false or the goods are not the lot")}</dt>
            <dd>{t("The deal is paused, the lot is blocked and a named Compliance officer decides what happens next.")}</dd>
          </div>
        </dl>
      </section>
      )}
    </>
  );
}
