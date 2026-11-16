import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Car, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/user";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-white flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="ambient-glow float-slow -top-24 -start-24 h-96 w-96 bg-blue-600/20" />
      <div className="ambient-glow float-slower -bottom-24 -end-24 h-96 w-96 bg-orange-500/15" />

      {/* Top Header with Logo and Language Switcher */}
      <header className="flex items-center justify-between z-10 w-full max-w-6xl mx-auto py-2">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 border border-white/10">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-wider text-white">SYNLY</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center z-10 my-auto py-6">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/10 text-orange-400 text-xs font-semibold backdrop-blur-xl">
            <span>{t("login.brandSubtitle")}</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            {t("login.heroTitle")}
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
            {t("login.heroSubtitle")}
          </p>

          <div className="space-y-4">
            <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("login.feature1")}</span>
            </div>
            <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("login.feature2")}</span>
            </div>
            <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-sky-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("login.feature3")}</span>
            </div>
          </div>
        </div>

        {/* Right side - Glassmorphism Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="glass-card border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="space-y-1.5 text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white">{t("login.title")}</CardTitle>
              <CardDescription className="text-slate-400">
                {t("login.subtitle")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    {t("login.email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("login.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input h-12 ps-10 pe-4"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    {t("login.password")}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input h-12 ps-10 pe-4"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 border border-white/10"
                  disabled={isLoading}
                >
                  {isLoading ? t("login.signingIn") : t("login.signIn")}
                  {!isLoading && <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" />}
                </Button>
              </form>

              <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-sm text-slate-400">
                  {t("login.noAccount")}{" "}
                  <Link to="/register" className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-4">
                    {t("login.register")}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}