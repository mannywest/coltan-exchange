"use client";

import { setBuyerLab, setCx, setMethod, type Deal } from "@/lib/dealStore";
import { useT } from "./I18n";

// "Show a problem": starts one deliberate failure so a visitor can see the platform stop a bad deal.
// COMPLIANCE: these only create the situation. A named back office person still decides what happens next.
export default function ProblemPanel({
  slug, deal, canFlagWallet, canGapLab, independent,
}: { slug: string; deal: Deal; canFlagWallet: boolean; canGapLab: boolean; independent: number }) {
  const t = useT();
  if (!canFlagWallet && !canGapLab) return null;
  return (
    <details className="problem">
      <summary>{t("Demo: show a problem")}</summary>
      <p className="reserve-note">{t("See what the platform does when something goes wrong. Each one is made up for the demo and can be undone with Restart.")}</p>
      <div className="problem-actions">
        {canFlagWallet && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              setMethod(slug, "usdt");
              setCx(slug, { wallet: "flagged", screen: "running" });
            }}
          >
            {t("Pay from a flagged wallet")}
          </button>
        )}
        {canGapLab && (
          <button type="button" className="btn btn-quiet" onClick={() => setBuyerLab(slug, (independent + 1.6).toFixed(1))} disabled={deal.buyerLab !== ""}>
            {t("Buyer's lab result is 1.6 points off")}
          </button>
        )}
      </div>
    </details>
  );
}
