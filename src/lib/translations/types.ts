export type Lang = "en" | "ar";

export type TranslationDict = Record<string, string>;

export interface TranslationModule {
  en: TranslationDict;
  ar: TranslationDict;
}
