import { useLanguage } from "../context/language-context";
import { cn } from "../lib/utils";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl p-0.5 shadow-lg",
        className
      )}
    >
      <button
        onClick={() => setLang("en")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 interactive-scale",
          lang === "en"
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
            : "text-slate-400 hover:text-white"
        )}
        aria-label={t("common.switchToEnglish")}
      >
        EN
      </button>
      <button
        onClick={() => setLang("ar")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 interactive-scale",
          lang === "ar"
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
            : "text-slate-400 hover:text-white"
        )}
        aria-label={t("common.switchToArabic")}
      >
        عربي
      </button>
    </div>
  );
}

export function LanguageSwitcherIcon({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
        className
      )}
      aria-label={t("common.switchLanguage")}
    >
      <Languages className="h-4 w-4 text-blue-400" />
      {lang === "en" ? "EN" : "عربي"}
    </button>
  );
}
