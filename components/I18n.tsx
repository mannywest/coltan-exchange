"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICT, LANGS, type Lang } from "@/lib/i18n";

type Vars = Record<string, string | number>;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

// Demo state survives a page refresh within the same tab. Storage can be blocked, so it is optional.
function stored(k: string): string | null {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function store(k: string, v: string) {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {}
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const setLang = (l: Lang) => {
    setLangState(l);
    store("cx-lang", l);
  };
  useEffect(() => {
    const l = stored("cx-lang");
    if (l === "fr" || l === "zh") setLangState(l);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

// t("English text {n}", { n: 3 }). The English text is the key. Unknown text stays English.
export function useT() {
  const { lang } = useContext(Ctx);
  return (s: string, vars?: Vars): string => {
    let out = lang === "en" ? s : (DICT[s]?.[lang] ?? s);
    if (vars) for (const k of Object.keys(vars)) out = out.split(`{${k}}`).join(String(vars[k]));
    return out;
  };
}

export type Role = "visitor" | "buyer" | "seller" | "reviewer";
export const ROLES: { id: Role; label: string }[] = [
  { id: "visitor", label: "Visitor" },
  { id: "buyer", label: "Buyer" },
  { id: "seller", label: "Seller" },
  { id: "reviewer", label: "Reviewer" },
];
// COMPLIANCE: "cleared" stands in for passing counterparty screening. In the real product
// it comes from a reviewer's decision, never from a button.
const RoleCtx = createContext<{ role: Role; setRole: (r: Role) => void; cleared: boolean; setCleared: (c: boolean) => void }>({
  role: "visitor",
  setRole: () => {},
  cleared: false,
  setCleared: () => {},
});
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("visitor");
  const [cleared, setClearedState] = useState(false);
  useEffect(() => {
    const r = stored("cx-role");
    if (r === "buyer" || r === "seller" || r === "reviewer") setRoleState(r);
    if (stored("cx-cleared") === "1") setClearedState(true);
  }, []);
  const setRole = (r: Role) => {
    setRoleState(r);
    store("cx-role", r);
  };
  const setCleared = (c: boolean) => {
    setClearedState(c);
    store("cx-cleared", c ? "1" : "0");
  };
  return <RoleCtx.Provider value={{ role, setRole, cleared, setCleared }}>{children}</RoleCtx.Provider>;
}
export function useRole() {
  return useContext(RoleCtx);
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={lang === l.code}
          lang={l.code === "zh" ? "zh-Hans" : l.code}
          onClick={() => setLang(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
