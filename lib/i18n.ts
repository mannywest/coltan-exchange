export type Lang = "en" | "fr" | "zh";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "zh", label: "中文" },
];

// English text is the key. See lib/i18n-dict.ts for the translations.
export { DICT } from "./i18n-dict";
