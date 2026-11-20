"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ACCESS_HASH } from "@/lib/access";
import { useT } from "./I18n";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const KEY = "cx-access";

// A private-demo screen. The visitor must ask Plerosis for the access code.
// COMPLIANCE: this keeps casual visitors out of a demo. It is not a security control for real client data;
// real use needs proper sign-in and Cloudflare Access or similar in front.
export default function AccessGate({ children, wordmarkHref = "#" }: { children: React.ReactNode; wordmarkHref?: string }) {
  const t = useT();
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let ok = false;
    try {
      ok = window.sessionStorage.getItem(KEY) === ACCESS_HASH;
    } catch {
      /* storage can be unavailable; the visitor just enters the code again */
    }
    setState(ok ? "open" : "locked");
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const h = await sha256(code.trim());
      await new Promise((r) => setTimeout(r, Math.min(3000, 400 + tries * 600))); // slows repeated guesses
      if (h === ACCESS_HASH) {
        try {
          window.sessionStorage.setItem(KEY, ACCESS_HASH);
        } catch {
          /* ignore */
        }
        setState("open");
      } else {
        setTries((n) => n + 1);
        setError(t("That code is not right. Ask Plerosis for the access code."));
      }
    } catch {
      setError(t("This browser cannot check the code. Try a current version of Chrome, Safari or Edge."));
    } finally {
      setBusy(false);
    }
  }

  if (state === "open") return <>{children}</>;
  if (state === "checking") return null;

  return (
    <main className="gate">
      <div className="gate-card">
        <p className="wordmark">Plerosis</p>
        <h1>{t("Private demo")}</h1>
        <p>{t("Coltan Exchange is shown by invitation. Enter the access code you were given.")}</p>
        <form onSubmit={submit}>
          <label htmlFor="gate-code">{t("Access code")}</label>
          <input
            id="gate-code"
            type="password"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-describedby={error ? "gate-error" : undefined}
          />
          {error && (
            <p id="gate-error" className="gate-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy || code.trim() === ""}>
            {busy ? t("Checking…") : t("Open the demo")}
          </button>
        </form>
        <p className="gate-help">{t("No code? Ask Plerosis and we will send one.")}</p>
        <p className="gate-foot">{t("Prepared by Plerosis with AI assistance")} · {t("Demo only. Not an offer to trade.")}</p>
      </div>
    </main>
  );
}
