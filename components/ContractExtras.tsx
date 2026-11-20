"use client";

import { useState } from "react";
import { demoHash, short } from "@/lib/chain";
import { CONVERT_FEE_PCT, CONVERT_RATE } from "@/lib/chainState";
import { useT } from "./I18n";

const n0 = (n: number) => Math.round(n).toLocaleString("en-GB");

// The seller's side of the same payment: what arrives, and the choice to keep USDT or convert it.
// COMPLIANCE: conversion to cash goes through a licensed partner in real life, with its own checks. Demo rate and fee.
export function SellerView({ amount, final }: { amount: number; final: boolean }) {
  const t = useT();
  const [mode, setMode] = useState<"keep" | "convert">("keep");
  const net = amount * CONVERT_RATE * (1 - CONVERT_FEE_PCT / 100);
  return (
    <section className="chain" aria-labelledby="h-seller">
      <h2 id="h-seller">{t("Seller's view (simulated)")}</h2>
      <p className="outcome ok">
        {final
          ? t("Total received: USDT {n}. The deal is complete.", { n: n0(amount) })
          : t("Incoming payment: USDT {n} received from the contract.", { n: n0(amount) })}
      </p>
      <fieldset className="method">
        <legend>{t("What do you want to do with it?")}</legend>
        <label className="check-row">
          <input type="radio" name="seller-mode" checked={mode === "keep"} onChange={() => setMode("keep")} />
          <span>{t("Keep it as USDT")}</span>
        </label>
        <label className="check-row">
          <input type="radio" name="seller-mode" checked={mode === "convert"} onChange={() => setMode("convert")} />
          <span>{t("Convert to USD and pay to a bank or mobile money account")}</span>
        </label>
      </fieldset>
      {mode === "convert" && (
        <dl className="chain-facts">
          <div>
            <dt>{t("Demo rate")}</dt>
            <dd>1 USDT = {CONVERT_RATE} USD</dd>
          </div>
          <div>
            <dt>{t("Conversion fee (demo)")}</dt>
            <dd>{CONVERT_FEE_PCT}%</dd>
          </div>
          <div>
            <dt>{t("You receive")}</dt>
            <dd>USD {n0(net)}</dd>
          </div>
        </dl>
      )}
      <p className="reserve-note">{t("Conversion would run through a licensed partner, with its own identity checks. Not connected in this demo.")}</p>
    </section>
  );
}

// A receipt with the certificate fingerprint. The download is a plain text file made in the browser.
export function Receipt({ lotNumber, paid, ta, fee }: { lotNumber: string; paid: number; ta: number; fee: number }) {
  const t = useT();
  const no = `DEMO-${lotNumber}-0001`;
  const tx = demoHash(`lot-${lotNumber}-final`);
  const lines = [
    `DEMO RECEIPT ${no}`,
    `Lot ${lotNumber}`,
    `Final grade ${ta.toFixed(2)}% Ta2O5`,
    `Total paid USDT ${n0(paid)} (demo)`,
    `Platform fee USDT ${n0(fee)} (demo)`,
    `Final transaction ${tx}`,
    `Certificate fingerprint ${demoHash(`cert-${lotNumber}`, 3)}`,
    "Demo data. Not a real payment. Prepared by Plerosis with AI assistance.",
  ];
  function download() {
    try {
      const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${no}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* downloads can be blocked in a preview; the receipt stays on screen */
    }
  }
  return (
    <section className="chain receipt" aria-labelledby="h-receipt">
      <h2 id="h-receipt">{t("Payment receipt (demo)")}</h2>
      <dl className="chain-facts">
        <div><dt>{t("Receipt no.")}</dt><dd>{no}</dd></div>
        <div><dt>{t("Lot")}</dt><dd>{lotNumber}</dd></div>
        <div><dt>{t("Final grade")}</dt><dd>{ta.toFixed(2)}% Ta2O5</dd></div>
        <div><dt>{t("Total paid")}</dt><dd>USDT {n0(paid)}</dd></div>
        <div><dt>{t("Platform fee (demo)")}</dt><dd>USDT {n0(fee)}</dd></div>
        <div><dt>{t("Final transaction")}</dt><dd><code>{short(tx)}</code></dd></div>
        <div><dt>{t("Certificate fingerprint")}</dt><dd><code>{short(demoHash(`cert-${lotNumber}`, 3))}</code></dd></div>
      </dl>
      <button type="button" className="btn btn-quiet" onClick={download}>
        {t("Download receipt (demo)")}
      </button>
    </section>
  );
}
