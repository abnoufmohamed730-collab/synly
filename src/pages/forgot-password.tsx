import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, LockKeyhole, MessageCircle, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { usePasswordRecovery } from "../hooks/use-password-recovery";

const otpLength = 6;

export function ForgotPasswordPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const recovery = usePasswordRecovery();
  const [otp, setOtp] = useState(Array(otpLength).fill(""));
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const isArabic = lang === "ar";

  const errorText: Record<string, string> = {
    "phone-invalid": t("recovery.errorPhone"),
    "otp-invalid": t("recovery.errorOtp"),
    "otp-expired": t("recovery.errorExpired"),
    "password-mismatch": t("recovery.errorMismatch"),
    "password-too-short": t("recovery.errorPassword"),
    "request-failed": t("recovery.errorGeneric"),
  };

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    const result = await recovery.requestCode();
    if (result) {
      setOtp(Array(otpLength).fill(""));
      toast.success(t("recovery.codeSent"));
      otpRefs.current[0]?.focus();
    }
  };

  const updateOtp = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setOtp((current) => current.map((digit, i) => i === index ? "" : digit));
      return;
    }
    const chars = digits.slice(0, otpLength - index).split("");
    setOtp((current) => {
      const next = [...current];
      chars.forEach((digit, offset) => { next[index + offset] = digit; });
      return next;
    });
    otpRefs.current[Math.min(index + chars.length, otpLength - 1)]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < otpLength - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, otpLength);
    if (!pasted) return;
    event.preventDefault();
    setOtp([...pasted, ...Array(otpLength - pasted.length).fill("")]);
    otpRefs.current[Math.min(pasted.length, otpLength - 1)]?.focus();
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    const valid = await recovery.verifyCode(otp.join(""));
    if (valid) toast.success(t("recovery.otpVerified"));
  };

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();
    const success = await recovery.resetPassword(password, confirmation);
    if (success) toast.success(t("recovery.resetSuccess"));
  };

  const strength = password.length === 0 ? 0 : Math.min(4,
    Number(password.length >= 8) + Number(/[A-Z]/.test(password)) + Number(/[a-z]/.test(password)) + Number(/[0-9]/.test(password)) + Number(/[^A-Za-z0-9]/.test(password))
  );
  const maskedPhone = recovery.challenge?.phone.replace(/(\+\d{1,3})\d+(\d{2})$/, "$1••••••$2") ?? recovery.phone;
  const steps = [t("recovery.stepPhone"), t("recovery.stepOtp"), t("recovery.stepPassword")];
  const currentStep = recovery.step === "phone" ? 0 : recovery.step === "otp" ? 1 : 2;

  const changeChannel = async (channel: "whatsapp" | "sms") => {
    const challenge = await recovery.requestCode(channel);
    if (challenge) {
      setOtp(Array(otpLength).fill(""));
      toast.success(t("recovery.codeSent"));
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#090A0F] p-4 text-white md:p-8">
      <div className="ambient-glow float-slow -start-24 -top-24 h-96 w-96 bg-blue-600/20" />
      <div className="ambient-glow float-slower -bottom-24 -end-24 h-96 w-96 bg-orange-500/15" />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-2">
        <Link to="/login" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Synly" className="h-10 w-10 rounded-xl object-cover" />
          <span className="text-2xl font-black tracking-wider">SYNLY</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="relative z-10 my-auto w-full py-8">
        <section key={recovery.step} className="glass-card glass-glow mx-auto w-full max-w-lg animate-[page-enter-active_.35s_ease-out] overflow-hidden rounded-3xl border-white/10 shadow-2xl">
          <div className="p-6 pb-4 sm:p-8 sm:pb-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-300">
                {recovery.step === "phone" && <ShieldCheck className="h-6 w-6" />}
                {recovery.step === "otp" && <MessageCircle className="h-6 w-6" />}
                {recovery.step === "password" && <LockKeyhole className="h-6 w-6" />}
                {recovery.step === "complete" && <CheckCircle2 className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">{t("recovery.eyebrow")}</p>
                <p className="mt-1 text-sm text-slate-400">{t("recovery.subtitle")}</p>
              </div>
            </div>

            {recovery.step !== "complete" && (
              <div className="mb-7 grid grid-cols-3 gap-2" aria-label={t("recovery.progress")}>
                {steps.map((step, index) => (
                  <div key={step} className="space-y-2">
                    <div className={`h-1 rounded-full ${index <= currentStep ? "bg-gradient-to-r from-blue-500 to-orange-400" : "bg-white/10"}`} />
                    <p className={`text-[10px] font-medium sm:text-xs ${index === currentStep ? "text-white" : "text-slate-500"}`}>{step}</p>
                  </div>
                ))}
              </div>
            )}

            {recovery.step === "phone" && (
              <>
                <h1 className="text-2xl font-bold">{t("recovery.title")}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("recovery.phoneDescription")}</p>
                <form onSubmit={handleRequest} className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-phone" className="text-xs font-semibold uppercase tracking-wider text-slate-300">{t("recovery.phoneLabel")}</Label>
                    <div className="relative">
                      <Phone className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="recovery-phone" type="tel" autoComplete="tel" dir="ltr" value={recovery.phone} onChange={(event) => { recovery.setPhone(event.target.value); recovery.setError(null); }} placeholder="+20 100 123 4567" className="glass-input h-12 ps-10 text-white" />
                    </div>
                    <p className="text-xs text-slate-500">{t("recovery.countryHint")}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">{t("recovery.channelLabel")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => recovery.setChannel("whatsapp")} aria-pressed={recovery.channel === "whatsapp"} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all ${recovery.channel === "whatsapp" ? "border-green-400/40 bg-green-500/10 text-green-300 shadow-lg shadow-green-950/30" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </button>
                      <button type="button" onClick={() => recovery.setChannel("sms")} aria-pressed={recovery.channel === "sms"} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all ${recovery.channel === "sms" ? "border-blue-400/40 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-950/30" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                        <Smartphone className="h-4 w-4" /> SMS
                      </button>
                    </div>
                  </div>
                  {recovery.error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{errorText[recovery.error]}</p>}
                  <Button type="submit" disabled={recovery.loading} className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 font-bold text-white shadow-lg shadow-blue-950/40">
                    {recovery.loading ? <><span className="me-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{t("recovery.sending")}</> : <>{t("recovery.sendCode")}<ArrowRight className={`ms-2 h-4 w-4 ${isArabic ? "rotate-180" : ""}`} /></>}
                  </Button>
                </form>
              </>
            )}

            {recovery.step === "otp" && (
              <>
                <h1 className="text-2xl font-bold">{t("recovery.verifyTitle")}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("recovery.verifyDescription")} <span dir="ltr" className="inline-block font-semibold text-white">{maskedPhone}</span></p>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-slate-300">{recovery.channel === "whatsapp" ? <MessageCircle className="h-4 w-4 text-green-400" /> : <Smartphone className="h-4 w-4 text-blue-400" />}{recovery.channel === "whatsapp" ? "WhatsApp" : "SMS"}</span>
                  <span className="text-[11px] text-slate-400">{t("recovery.codeSentSecurely")}</span>
                </div>
                <form onSubmit={handleVerify} className="mt-6 space-y-5">
                  <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
                    {otp.map((digit, index) => (
                      <input key={index} ref={(element) => { otpRefs.current[index] = element; }} value={digit} onChange={(event) => updateOtp(index, event.target.value)} onKeyDown={(event) => handleOtpKeyDown(index, event)} onPaste={handleOtpPaste} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} aria-label={t("recovery.digitLabel", { number: index + 1 })} className="h-12 w-10 rounded-xl border border-white/10 bg-white/5 text-center text-xl font-bold text-white outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 sm:h-14 sm:w-12" />
                    ))}
                  </div>
                  {recovery.error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-300">{errorText[recovery.error]}</p>}
                  <Button type="submit" disabled={recovery.loading || otp.join("").length !== otpLength} className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 font-bold text-white">
                    {recovery.loading ? t("recovery.verifying") : t("recovery.verifyCode")}<ArrowRight className={`ms-2 h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                  </Button>
                </form>
                <div className="mt-5 flex flex-col items-center gap-3 text-sm">
                  {recovery.remainingSeconds > 0 ? <p className="text-slate-400">{t("recovery.resendIn")} <span className="font-mono font-semibold text-blue-300">00:{String(recovery.remainingSeconds).padStart(2, "0")}</span></p> : <button type="button" onClick={() => void recovery.requestCode()} disabled={recovery.loading} className="font-semibold text-blue-300 hover:text-blue-200">{t("recovery.resendCode")}</button>}
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                    <span>{t("recovery.switchChannel")}</span>
                    <button type="button" disabled={recovery.loading || recovery.remainingSeconds > 0} onClick={() => void changeChannel(recovery.channel === "sms" ? "whatsapp" : "sms")} className="font-semibold text-orange-300 disabled:cursor-not-allowed disabled:opacity-40">{recovery.channel === "whatsapp" ? "SMS" : "WhatsApp"}</button>
                  </div>
                </div>
                <button type="button" onClick={recovery.backToPhone} className="mt-5 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft className={`h-3.5 w-3.5 ${isArabic ? "rotate-180" : ""}`} />{t("recovery.changePhone")}</button>
              </>
            )}

            {recovery.step === "password" && (
              <>
                <h1 className="text-2xl font-bold">{t("recovery.newPasswordTitle")}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("recovery.newPasswordDescription")}</p>
                <form onSubmit={handleReset} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">{t("recovery.newPassword")}</Label>
                    <div className="relative">
                      <LockKeyhole className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); recovery.setError(null); }} className="glass-input h-12 ps-10 pe-12 text-white" />
                      <button type="button" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")} className="absolute end-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                    <div className="flex gap-1.5" aria-label={t("recovery.passwordStrength")}>
                      {[1, 2, 3, 4].map((level) => <span key={level} className={`h-1 flex-1 rounded-full transition-colors ${strength >= level ? strength < 2 ? "bg-red-400" : strength < 3 ? "bg-orange-400" : "bg-green-400" : "bg-white/10"}`} />)}
                    </div>
                    <p className="text-xs text-slate-500">{t(strength < 2 ? "recovery.strengthWeak" : strength < 3 ? "recovery.strengthFair" : strength < 4 ? "recovery.strengthGood" : "recovery.strengthStrong")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">{t("recovery.confirmPassword")}</Label>
                    <div className="relative">
                      <LockKeyhole className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="confirm-password" type={showConfirmation ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); recovery.setError(null); }} className="glass-input h-12 ps-10 pe-12 text-white" />
                      <button type="button" onClick={() => setShowConfirmation((show) => !show)} aria-label={showConfirmation ? t("login.hidePassword") : t("login.showPassword")} className="absolute end-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white">{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  {recovery.error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{errorText[recovery.error]}</p>}
                  <Button type="submit" disabled={recovery.loading} className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 font-bold text-white">
                    {recovery.loading ? t("recovery.saving") : t("recovery.savePassword")}<Check className="ms-2 h-4 w-4" />
                  </Button>
                </form>
              </>
            )}

            {recovery.step === "complete" && (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-green-400/20 bg-green-500/10 text-green-300"><CheckCircle2 className="h-8 w-8" /></div>
                <h1 className="mt-5 text-2xl font-bold">{t("recovery.completeTitle")}</h1>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{t("recovery.completeDescription")}</p>
                <Button onClick={() => navigate("/login", { replace: true })} className="mt-7 h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 font-bold text-white">{t("recovery.goToLogin")}<ArrowRight className={`ms-2 h-4 w-4 ${isArabic ? "rotate-180" : ""}`} /></Button>
              </div>
            )}
          </div>
          {recovery.step !== "complete" && <div className="border-t border-white/10 bg-white/[0.02] px-6 py-4 text-center sm:px-8"><Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"><ArrowLeft className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />{t("recovery.backToLogin")}</Link></div>}
        </section>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
