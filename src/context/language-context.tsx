import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, useEffect } from "react";
import { translations, type Lang } from "../lib/translations";
import { supabase } from "../integrations/supabase/client";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Lang {
  try {
    const stored = localStorage.getItem("synly-locale");
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // Browser storage can be unavailable (privacy mode); fall back to the browser locale.
  }
  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setCurrentLang] = useState<Lang>(getInitialLanguage);

  const setLang = useCallback((next: Lang) => {
    setCurrentLang(next);
    try {
      localStorage.setItem("synly-locale", next);
    } catch {
      // Persisting the locale is best-effort when storage is unavailable.
    }
    // Persist the choice on the profile once a session exists. RLS scopes this to the signed-in user.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void supabase.from("profiles").update({ locale: next }).eq("user_id", data.session.user.id);
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("synly-locale", lang);
    } catch {
      // Ignore storage failures; the document direction below still applies for this session.
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let str = translations[lang][key] ?? translations.en[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}