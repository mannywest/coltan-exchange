"use client";

import { useEffect } from "react";
import { demoAddress, demoBlock, demoGrid, short } from "@/lib/chain";
import { CONFIRMATIONS, NETWORK_FEE_USDT, type Cx } from "@/lib/chainState";
import { useT } from "./I18n";
import SignPanel from "./SignPanel";

const usdt = (n: number) => `${Math.round(n).toLocaleString("en-GB")} USDT`;

function Qr({ seed }: { seed: string }) {
  const t = useT();
  const g = demoGrid(seed);
  return (
    <svg viewBox="0 0 25 25" className="qr" role="img" aria-label={t("Demo QR code. Not scannable.")} shapeRendering="crispEdges">
      <rect width="25" height="25" fill="#fff" />
      {g.map((row, y) => row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#090B0C" /> : null)))}
    </svg>
  );
}

// COMPLIANCE: wallet screening, stablecoin custody and release rights are shown as a simulation only.
// Real use needs a lawyer's opinion, a licensed partner and a plan for frozen funds. No AI approves or releases.
export default function UsdtFlow({
  lotNumber,
  amount,
  cx,
  setCx,
  provApproved,
  onFunded,
  onReleased,
}: {
  lotNumber: string;
  amount: number;
  cx: Cx;
  setCx: (p: Partial<Cx>) => void;
  provApproved: boolean;
  onFunded: () => void;
  onReleased: () => void;
}) {
  const t = useT();
  const buyer = demoAddress("buyer-wallet");
  const flagged = demoAddress("flagged-wallet");
  const contract = demoAddress(`lot-${lotNumber}`);

  // Screening takes a moment, as it would in real life.
  useEffect(() => {
    if (cx.screen !== "running") return;
    const id = setTimeout(() => setCx({ screen: cx.wallet === "flagged" ? "flagged" : "passed" }), 1800);
    return () => clearTimeout(id);
  }, [cx.screen, cx.wallet, setCx]);

  // Confirmations tick up one at a time, then the payment is confirmed.
  useEffect(() => {
    if (cx.pay !== "confirming") return;
    const id = setTimeout(() => {
      if (cx.confs + 1 >= CONFIRMATIONS) {
        setCx({ pay: "confirmed", confs: CONFIRMATIONS });
        onFunded();
      } else setCx({ confs: cx.confs + 1 });
    }, 1100);
    return () => clearTimeout(id);
  }, [cx.pay, cx.confs, setCx, onFunded]);

  if (provApproved) {
    return <p className="outcome ok">{t("Provisional payment released from the contract to the seller.")}</p>;
  }

  if (cx.wallet === "none") {
    return (
      <div className="wallet">
        <p className="wallet-head">{t("Demo Wallet")}</p>
        <p>{t("Coltan Exchange (demo) wants to connect to your wallet.")}</p>
        <dl className="chain-facts">
          <div>
            <dt>{t("Wallet")}</dt>
            <dd><code>{short(buyer)}</code></dd>
          </div>
          <div>
            <dt>{t("Balance")}</dt>
            <dd>{t("{n} USDT (demo)", { n: "2,000,000" })}</dd>
          </div>
        </dl>
        <div className="wallet-actions">
          <button type="button" className="btn btn-quiet" onClick={() => setCx({ wallet: "ok", screen: "running" })}>
            {t("Connect wallet")}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setCx({ wallet: "flagged", screen: "running" })}>
            {t("Try a flagged demo wallet")}
          </button>
        </div>
      </div>
    );
  }

  if (cx.screen === "running") {
    return (
      <p className="outcome" role="status" aria-live="polite">
        {t("Checking wallet {w} against screening lists (demo)…", { w: short(cx.wallet === "flagged" ? flagged : buyer) })}
      </p>
    );
  }

  if (cx.screen === "flagged") {
    return (
      <div role="status">
        <p className="outcome warn">
          {t("Wallet {w} was flagged. Funds are paused and cannot be sent. A named Compliance officer reviews this.", { w: short(flagged) })}
        </p>
        <button type="button" className="btn btn-quiet" onClick={() => setCx({ wallet: "none", screen: "idle" })}>
          {t("Use a different wallet")}
        </button>
      </div>
    );
  }

  const block = demoBlock(`lot-${lotNumber}-fund`);
  return (
    <div className="pay">
      <p className="outcome ok">
        {t("Wallet {w} passed screening (demo). Real screening is planned for a later phase.", { w: short(buyer) })}
      </p>
      {cx.pay === "idle" && (
        <div className="pay-box">
          <Qr seed={`lot-${lotNumber}-qr`} />
          <dl className="chain-facts">
            <div>
              <dt>{t("Send exactly")}</dt>
              <dd>{usdt(amount)}</dd>
            </div>
            <div>
              <dt>{t("To contract")}</dt>
              <dd><code>{short(contract)}</code></dd>
            </div>
            <div>
              <dt>{t("Payment window")}</dt>
              <dd>{t("30 minutes (demo)")}</dd>
            </div>
            <div>
              <dt>{t("Status")}</dt>
              <dd>{t("Waiting for payment")}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn-quiet" onClick={() => setCx({ pay: "confirming", confs: 0 })}>
            {t("Send {amount} from my wallet (demo)", { amount: usdt(amount) })}
          </button>
        </div>
      )}
      {cx.pay === "confirming" && (
        <p className="outcome" role="status" aria-live="polite">
          {t("Payment seen. Confirming on the network: {n} of {m} confirmations.", { n: cx.confs, m: CONFIRMATIONS })}
        </p>
      )}
      {cx.pay === "confirmed" && (
        <>
          <p className="outcome ok">
            {t("Payment confirmed in block {b}. Network fee {f} USDT (demo). The contract now holds {amount}.", {
              b: block.toLocaleString("en-GB"),
              f: NETWORK_FEE_USDT,
              amount: usdt(amount),
            })}
          </p>
          <SignPanel
            title="Release the provisional payment"
            a={cx.sigA}
            r={cx.sigR}
            onSign={(who) => {
              const next = { sigA: who === "a" ? true : cx.sigA, sigR: who === "r" ? true : cx.sigR };
              setCx(next);
              if (next.sigA && next.sigR) onReleased();
            }}
          />
        </>
      )}
    </div>
  );
}
