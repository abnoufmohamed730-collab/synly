import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Car, ArrowRight, CheckCircle, MapPin } from "lucide-react";

const serviceTypes = [
  "Mechanical Repair",
  "Auto Electric",
  "Spare Parts Shop",
  "Towing/Roadside Assistance",
  "Gas Station",
];

export function RegisterPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    serviceType: "",
    commercialRegister: "",
    location: "",
    operatingHours: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/user");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="ambient-glow -top-20 -left-20 h-96 w-96 bg-blue-600/20" />
        <div className="ambient-glow -bottom-20 -right-20 h-96 w-96 bg-orange-500/15" />

        <Card className="glass-card border-white/10 rounded-3xl max-w-md w-full shadow-2xl relative z-10">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 border border-green-500/30 text-green-400">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">{t("register.success")}</h2>
            <p className="text-slate-300 text-sm">
              {t("register.successMessage")}
            </p>
            <div className="flex items-center justify-center pt-2">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <span>SYNLY VENDOR</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            {t("register.heroTitle")}
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
            {t("register.heroSubtitle")}
          </p>

          <div className="space-y-4">
            <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("register.feature1")}</span>
            </div>
            <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("register.feature2")}</span>
            </div>
            <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-sky-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("register.feature3")}</span>
            </div>
          </div>
        </div>

        {/* Right side - Registration Form */}
        <div className="w-full max-w-xl mx-auto">
          <Card className="glass-card border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="space-y-1.5 text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white">{t("register.title")}</CardTitle>
              <CardDescription className="text-slate-400">
                {t("register.subtitle")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      {t("register.businessName")}
                    </Label>
                    <Input
                      id="businessName"
                      placeholder={t("register.businessNamePlaceholder")}
                      value={formData.businessName}
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                      className="glass-input h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      {t("register.email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("login.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="glass-input h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      {t("register.password")}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="glass-input h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceType" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      {t("register.serviceType")}
                    </Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(value) => handleInputChange("serviceType", value)}
                    >
                      <SelectTrigger className="glass-input h-11 text-white border-white/10">
                        <SelectValue placeholder={t("register.selectServiceType")} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950/95 border-white/10 text-white backdrop-blur-2xl">
                        {serviceTypes.map((type) => (
                          <SelectItem key={type} value={type} className="focus:bg-white/10 focus:text-white">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commercialRegister" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    {t("register.commercialRegister")}
                  </Label>
                  <Input
                    id="commercialRegister"
                    placeholder={t("register.commercialRegisterPlaceholder")}
                    value={formData.commercialRegister}
                    onChange={(e) => handleInputChange("commercialRegister", e.target.value)}
                    className="glass-input h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    {t("register.location")}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="location"
                      placeholder={t("register.locationPlaceholder")}
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="glass-input h-11 ps-9 pe-4"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingHours" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    {t("register.operatingHours")}
                  </Label>
                  <Input
                    id="operatingHours"
                    placeholder={t("register.hoursPlaceholder")}
                    value={formData.operatingHours}
                    onChange={(e) => handleInputChange("operatingHours", e.target.value)}
                    className="glass-input h-11"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/25 border border-white/10 mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? t("register.creating") : t("register.register")}
                  {!isLoading && <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" />}
                </Button>
              </form>

              <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-sm text-slate-400">
                  {t("register.haveAccount")}{" "}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4">
                    {t("register.signIn")}
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