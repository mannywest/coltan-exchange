"use client";

import { useT } from "./I18n";

// Two named people must each sign before money moves. Each button is a demo stand-in for that person.
// COMPLIANCE: release needs two named humans. No AI signer exists.
export default function SignPanel({
  title,
  a,
  r,
  onSign,
}: {
  title: string;
  a: boolean;
  r: boolean;
  onSign: (who: "a" | "r") => void;
}) {
  const t = useT();
  const n = (a ? 1 : 0) + (r ? 1 : 0);
  return (
    <div className="sign">
      <p className="sign-title">{t(title)}</p>
      <p className="reserve-note">{t("Approval request: needs 2 of 2 named people. {n} of 2 signed.", { n })}</p>
      <ul className="sign-list">
        <li>
          <span>{t("Named approver")}</span>
          {a ? (
            <b className="sign-done">{t("Signed")}</b>
          ) : (
            <button type="button" className="btn btn-quiet" onClick={() => onSign("a")}>
              {t("Sign as approver (demo)")}
            </button>
          )}
        </li>
        <li>
          <span>{t("Named reviewer")}</span>
          {r ? (
            <b className="sign-done">{t("Signed")}</b>
          ) : (
            <button type="button" className="btn btn-quiet" onClick={() => onSign("r")}>
              {t("Sign as reviewer (demo)")}
            </button>
          )}
        </li>
      </ul>
    </div>
  );
}
