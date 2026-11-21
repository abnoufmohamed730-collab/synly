import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, user, role, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password, remember);
      toast.success(t("auth.sessionActive"));

      const defaultTarget = role === "vendor" ? "/dashboard" : "/user";
      const destination = location.state?.from?.pathname || defaultTarget;

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-white flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="ambient-glow float-slow -top-24 -start-24 h-96 w-96 bg-blue-600/20 pointer-events-none" />
      <div className="ambient-glow float-slower -bottom-24 -end-24 h-96 w-96 bg-orange-500/15 pointer-events-none" />

      {/* Top Header with Logo and Language Switcher */}
      <header className="flex items-center justify-between z-10 w-full max-w-6xl mx-auto py-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Synly"
            className="h-10 w-10 rounded-xl object-cover transition-transform group-hover:scale-105"
          />
          <span className="text-2xl font-black tracking-wider text-white">SYNLY</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center z-10 my-auto py-6">
        {/* Left side - Branding & Hero */}
        <div className="hidden lg:block space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/10 text-orange-400 text-xs font-semibold backdrop-blur-xl">
            <Zap className="h-3.5 w-3.5 text-orange-400" />
            <span>{t("login.brandSubtitle")}</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            {t("login.heroTitle")}
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
            {t("login.heroSubtitle")}
          </p>

          <div className="space-y-4">
            <div className="glass-card glass-glow rounded-xl p-3.5 flex items-center gap-3 interactive-scale">
              <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("login.feature1")}</span>
            </div>
            <div className="glass-card glass-glow rounded-xl p-3.5 flex items-center gap-3 interactive-scale">
              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("login.feature2")}</span>
            </div>
            <div className="glass-card glass-glow rounded-xl p-3.5 flex items-center gap-3 interactive-scale">
              <CheckCircle className="h-5 w-5 text-sky-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("login.feature3")}</span>
            </div>
          </div>
        </div>

        {/* Right side - Glassmorphism Login Card */}
        <div className="w-full max-w-md mx-auto">
          {isAuthenticated && user ? (
            /* Already signed in banner */
            <Card className="glass-card glass-glow border-white/10 rounded-3xl shadow-2xl p-6 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user.businessName || user.username}</h3>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t("auth.sessionActive")}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <Button
                  onClick={() => navigate(role === "vendor" ? "/dashboard" : "/user")}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                >
                  {t("login.signIn")}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="w-full h-11 rounded-xl border-white/10 text-slate-300 hover:bg-white/5"
                >
                  {t("auth.signOut")}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="glass-card glass-glow border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <CardHeader className="space-y-1.5 text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white">{t("login.title")}</CardTitle>
                <CardDescription className="text-slate-400">
                  {t("login.subtitle")}
                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-5 pt-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-shake">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
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
                        className="glass-input h-12 ps-10 pe-4 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      {t("login.password")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("login.passwordPlaceholder")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input h-12 ps-10 pe-12 text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute end-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <Link to="/forgot-password" className="text-xs font-semibold text-blue-300 transition-colors hover:text-orange-300">
                        {t("login.forgotPassword")}
                      </Link>
                    </div>
                  </div>

                  {/* Uber/inDrive style "Keep me signed in" toggle */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-start gap-3 transition-colors hover:bg-white/10">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-blue-500/40 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="remember" className="flex-1 cursor-pointer select-none">
                      <p className="text-xs font-semibold text-white">{t("auth.keepMeSignedIn")}</p>
                      <p className="text-[11px] text-slate-400">{t("auth.keepMeSignedInDesc")}</p>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 border border-white/10 interactive-scale"
                    disabled={isLoading}
                  >
                    {isLoading ? t("login.signingIn") : t("login.signIn")}
                    {!isLoading && <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" />}
                  </Button>
                </form>

                <div className="pt-3 border-t border-white/10 text-center">
                  <p className="text-sm text-slate-400">
                    {t("login.noAccount")}{" "}
                    <Link
                      to="/register"
                      className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-4 transition-colors"
                    >
                      {t("login.register")}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <div className="h-4" />
    </div>
  );
}

export default LoginPage;
