"use client";

import { SLOT_LABEL, fmtTime, personName, type Req } from "@/lib/dealStore";
import { useRole, useT } from "./I18n";

// What the buyer or seller sees while a named person has to approve something.
// COMPLIANCE: the person who asks can never be the person who approves. They see the status only.
export default function ApprovalStatus({
  req,
  backofficeHref,
  onAskAgain,
  doneText,
}: {
  req: Req | undefined;
  backofficeHref: string;
  onAskAgain?: () => void;
  doneText?: string;
}) {
  const t = useT();
  const { setRole } = useRole();
  if (!req) return null;

  if (req.status === "approved") {
    return (
      <p className="outcome ok" role="status">
        {doneText ?? t("Approved")} <small>{req.id}</small>
      </p>
    );
  }
  if (req.status === "rejected") {
    return (
      <div className="approval is-rejected" role="status">
        <p className="approval-head">
          <b>{req.id}</b> {t("Not approved")}
        </p>
        <p>{t("Reason from {who}: {reason}", { who: personName(req.decidedBy ?? ""), reason: req.reason ?? "" })}</p>
        {onAskAgain && (
          <button type="button" className="btn btn-quiet" onClick={onAskAgain}>
            {t("Ask again")}
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="approval" role="status" aria-live="polite">
      <p className="approval-head">
        <b>{req.id}</b> {t("Waiting for approval in the back office")}
      </p>
      <ul className="approval-slots">
        {req.slots.map((slot) => {
          const sig = req.sigs.find((x) => x.slot === slot);
          return (
            <li key={slot}>
              <span>{t(SLOT_LABEL[slot])}</span>
              {sig ? (
                <b className="sign-done">
                  {t("Signed by {who} at {time}", { who: personName(sig.personId), time: fmtTime(sig.at) })}
                </b>
              ) : (
                <em>{t("Waiting")}</em>
              )}
            </li>
          );
        })}
      </ul>
      <p className="reserve-note">
        {t("You cannot approve this yourself. Back office staff check it first. Target reply: 4 working hours (demo).")}
      </p>
      <a className="btn btn-quiet" href={backofficeHref} onClick={() => setRole("reviewer")}>
        {t("Demo: open the back office")}
      </a>
    </div>
  );
}
