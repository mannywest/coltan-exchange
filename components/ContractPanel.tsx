"use client";

import { demoAddress, demoHash, short } from "@/lib/chain";
import { useT } from "./I18n";

export type ChainEvent = { label: string; who: string; seed: string };
export type StatementRow = { label: string; amount: number };
export type Notice = { subject: string; body: string };

// A simulated smart-contract escrow, shown beside the deal steps when the buyer picks USDT.
// COMPLIANCE: stablecoin payment is a later-phase idea. Real use needs a lawyer's opinion, wallet
// screening, a licensed custody or payment partner and Tether-freeze planning. Nothing here moves money.
export default function ContractPanel({
  lotNumber,
  events,
  statement,
  notices,
}: {
  lotNumber: string;
  events: ChainEvent[];
  statement: StatementRow[];
  notices: Notice[];
}) {
  const t = useT();
  const addr = demoAddress(`lot-${lotNumber}`);
  return (
    <section className="chain" aria-labelledby="h-chain">
      <h2 id="h-chain">{t("Smart contract escrow (simulated)")}</h2>
      <p className="chain-banner">
        {t("Simulation only. No real blockchain, wallet or money. It shows how a contract would behave.")}
      </p>
      <dl className="chain-facts">
        <div>
          <dt>{t("Contract address")}</dt>
          <dd><code>{short(addr)}</code></dd>
        </div>
        <div>
          <dt>{t("Network")}</dt>
          <dd>{t("Demo network (not real)")}</dd>
        </div>
        <div>
          <dt>{t("Token")}</dt>
          <dd>{t("USDT (1 USDT = 1 USD, demo)")}</dd>
        </div>
        <div>
          <dt>{t("Who can release money")}</dt>
          <dd>{t("Needs 2 named people from: Approver, Reviewer, Compliance officer. No AI key.")}</dd>
        </div>
      </dl>
      <h3>{t("Escrow statement")}</h3>
      <table className="statement">
        <tbody>
          {statement.map((r) => (
            <tr key={r.label}>
              <th scope="row">{t(r.label)}</th>
              <td className="num">{Math.round(r.amount).toLocaleString("en-GB")} USDT</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>{t("Contract log")}</h3>
      <ol className="chain-log">
        {events.map((e) => (
          <li key={e.seed}>
            <span>{t(e.label)}</span>
            <small>{t(e.who)}</small>
            <code>{short(demoHash(`lot-${lotNumber}-${e.seed}`))}</code>
          </li>
        ))}
      </ol>
      {notices.length > 0 && (
        <>
          <h3>{t("Notifications (demo)")}</h3>
          <ul className="notices">
            {[...notices].reverse().map((n) => (
              <li key={n.subject}>
                <b>{t(n.subject)}</b>
                <span>{t(n.body)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="reserve-note">
        {t("The contract only carries out what named people approve. It cannot judge an assay result or decide a dispute.")}
      </p>
      <p className="reserve-note">
        {t("Planned later: wallet screening, a licensed payment partner, and a plan for frozen funds.")}
      </p>
    </section>
  );
}
