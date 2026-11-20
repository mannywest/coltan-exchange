"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICT, LANGS, type Lang } from "@/lib/i18n";

type Vars = Record<string, string | number>;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
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
