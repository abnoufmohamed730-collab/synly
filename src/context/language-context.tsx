import { createContext, useCallback, useContext, useState, type ReactNode, useEffect } from "react";
import { translations, type Lang } from "../lib/translations";
import { supabase } from "../integrations/supabase/client";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Lang {
  const stored = localStorage.getItem("synly-locale");
  if (stored === "ar" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setCurrentLang] = useState<Lang>(getInitialLanguage);
  const setLang = useCallback((next: Lang) => {
    setCurrentLang(next);
    localStorage.setItem("synly-locale", next);
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void supabase.from("profiles").update({ locale: next }).eq("user_id", data.session.user.id);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("synly-locale", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = (key: string, params?: Record<string, string | number>) => {
    let str = translations[lang][key] ?? translations.en[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}