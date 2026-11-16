import { useNavigate } from "react-router-dom";
import { Wrench, ArrowRight, ShieldCheck, Zap, Car } from "lucide-react";
import { useLanguage } from "../context/language-context";
import { LanguageSwitcher } from "../components/language-switcher";

export function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#090A0F] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow Effects (iPhone ambient glow) */}
      <div className="ambient-glow float-slow top-1/4 -start-20 w-96 h-96 bg-blue-600/20" />
      <div className="ambient-glow float-slower bottom-10 -end-20 w-96 h-96 bg-orange-500/15" />

      {/* Top Header / Logo & Language Switcher */}
      <header className="flex items-center justify-between z-10 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/10">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-wider text-white">
            SYNLY
          </span>
        </div>

        {/* Global Language Switcher */}
        <LanguageSwitcher />
      </header>

      {/* Hero Content */}
      <main className="max-w-3xl mx-auto text-center z-10 my-auto py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-white/10 text-orange-400 text-xs font-semibold mb-6 backdrop-blur-xl shadow-lg">
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          <span>{t("welcome.tagline")}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
          {t("welcome.title1")}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-orange-400">
            {t("welcome.titleHighlight")}
          </span>
        </h1>

        <p className="text-slate-300 text-base md:text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
          {t("welcome.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 border border-white/10"
          >
            <span>{t("welcome.cta")}</span>
            <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
          </button>
        </div>
      </main>

      {/* Footer Features (Glassmorphism Cards) */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full z-10 pt-6">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-slate-200">{t("welcome.feature1")}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-slate-200">{t("welcome.feature2")}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-slate-200">{t("welcome.feature3")}</span>
        </div>
      </footer>
    </div>
  );
}