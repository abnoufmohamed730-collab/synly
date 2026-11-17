import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, Role } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Checkbox } from "../components/ui/checkbox";
import { FileUpload } from "../components/FileUpload";
import { LocationPicker } from "../components/LocationPicker";
import { motion, AnimatePresence } from "framer-motion";
import { stepVariants } from "../lib/register-constants";
import {
  Car,
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Cog,
  Fuel,
  FileText,
  Clock,
  CreditCard,
  Facebook,
  Instagram,
  MessageCircle,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Users,
  Building2,
  Wrench,
  Zap,
  Leaf,
} from "lucide-react";

const serviceTypes = [
  { value: "Mechanical Repair", labelKey: "register.serviceMechanical" },
  { value: "Auto Electric", labelKey: "register.serviceElectric" },
  { value: "Spare Parts Shop", labelKey: "register.serviceSpareParts" },
  { value: "Towing/Roadside Assistance", labelKey: "register.serviceTowing" },
  { value: "Gas Station", labelKey: "register.serviceGas" },
];

const paymentMethods = [
  { value: "Cash", labelKey: "register.paymentCash" },
  { value: "InstaPay", labelKey: "register.paymentInstaPay" },
  { value: "E-Wallet", labelKey: "register.paymentEWallet" },
  { value: "Vodafone Cash", labelKey: "register.paymentVodafoneCash" },
  { value: "Visa/Mastercard", labelKey: "register.paymentCards" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => String(currentYear - i));

export function RegisterPage() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Account fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // User (car owner) fields
  const [carModel, setCarModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [year, setYear] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [carLicenseFile, setCarLicenseFile] = useState<File | null>(null);
  const [personalIdFile, setPersonalIdFile] = useState<File | null>(null);

  // Vendor fields
  const [businessName, setBusinessName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [emergencyLine, setEmergencyLine] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [commercialRegisterFile, setCommercialRegisterFile] = useState<File | null>(null);
  const [taxIdFile, setTaxIdFile] = useState<File | null>(null);
  const [workingHours, setWorkingHours] = useState("");
  const [paymentMethodsSelected, setPaymentMethodsSelected] = useState<string[]>([]);
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialWhatsApp, setSocialWhatsApp] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");

  const totalSteps = 4;

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!role) {
        newErrors.role = t("register.errorRole");
      }
    }

    if (step === 1) {
      if (!username.trim()) newErrors.username = t("register.errorRequired");
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t("register.errorEmail");
      if (password.length < 6) newErrors.password = t("register.errorPassword");
      if (!phone.trim() || phone.replace(/\D/g, "").length < 8) newErrors.phone = t("register.errorPhone");
    }

    if (step === 2) {
      if (role === "user") {
        if (!carModel.trim()) newErrors.carModel = t("register.errorRequired");
        if (!plateNumber.trim()) newErrors.plateNumber = t("register.errorRequired");
        if (!year) newErrors.year = t("register.errorRequired");
        if (!transmission) newErrors.transmission = t("register.errorRequired");
        if (!fuelType) newErrors.fuelType = t("register.errorRequired");
        if (!emergencyName.trim()) newErrors.emergencyName = t("register.errorRequired");
        if (!emergencyPhone.trim() || emergencyPhone.replace(/\D/g, "").length < 8)
          newErrors.emergencyPhone = t("register.errorPhone");
        if (!carLicenseFile) newErrors.carLicenseFile = t("register.errorFile");
        if (!personalIdFile) newErrors.personalIdFile = t("register.errorFile");
      } else {
        if (!businessName.trim()) newErrors.businessName = t("register.errorRequired");
        if (!serviceType) newErrors.serviceType = t("register.errorRequired");
        if (!phoneNumbers.trim()) newErrors.phoneNumbers = t("register.errorRequired");
        if (!emergencyLine.trim()) newErrors.emergencyLine = t("register.errorRequired");
        if (!coordinates) newErrors.coordinates = t("register.errorRequired");
        if (!commercialRegisterFile) newErrors.commercialRegisterFile = t("register.errorFile");
        if (!taxIdFile) newErrors.taxIdFile = t("register.errorFile");
        if (!workingHours.trim()) newErrors.workingHours = t("register.errorRequired");
        if (paymentMethodsSelected.length === 0) newErrors.paymentMethods = t("register.errorRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setError("");
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsLoading(true);
    setError("");

    try {
      await register({
        role: role!,
        username,
        email,
        password,
        phone,
        carModel,
        plateNumber,
        yearOfManufacture: year,
        transmission,
        fuelType,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
        carLicenseFile,
        personalIdFile,
        businessName,
        serviceType,
        phoneNumbers,
        emergencyLine,
        location: coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : "",
        coordinates,
        commercialRegisterFile,
        taxIdFile,
        workingHours,
        paymentMethods: paymentMethodsSelected,
        socialFacebook,
        socialWhatsApp,
        socialInstagram,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(role === "vendor" ? "/dashboard" : "/user");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentMethodsSelected((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="ambient-glow -top-20 -left-20 h-96 w-96 bg-blue-600/20" />
        <div className="ambient-glow -bottom-20 -right-20 h-96 w-96 bg-orange-500/15" />

        <Card className="glass-card glass-glow border-white/10 rounded-3xl max-w-md w-full shadow-2xl relative z-10">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 border border-green-500/30 text-green-400">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">{t("register.success")}</h2>
            <p className="text-slate-300 text-sm">{t("register.successMessage")}</p>
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
          <img src="/logo.png" alt="Synly" className="h-10 w-10 rounded-xl object-cover" />
          <span className="text-2xl font-black tracking-wider text-white">SYNLY</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center z-10 my-auto py-6">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/10 text-orange-400 text-xs font-semibold backdrop-blur-xl">
            <span>SYNLY</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            {t("register.heroTitle")}
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
            {t("register.heroSubtitle")}
          </p>

          <div className="space-y-4">
            <div className="glass-card glass-glow rounded-xl p-3.5 flex items-center gap-3 interactive-scale">
              <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("register.feature1")}</span>
            </div>
            <div className="glass-card glass-glow rounded-xl p-3.5 flex items-center gap-3 interactive-scale">
              <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("register.feature2")}</span>
            </div>
            <div className="glass-card glass-glow rounded-xl p-3.5 flex items-center gap-3 interactive-scale">
              <CheckCircle className="h-5 w-5 text-sky-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200">{t("register.feature3")}</span>
            </div>
          </div>
        </div>

        {/* Right side - Registration Form */}
        <div className="w-full max-w-xl mx-auto">
          <Card className="glass-card glass-glow border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="space-y-1.5 text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white">{t("register.title")}</CardTitle>
              <CardDescription className="text-slate-400">
                {t("register.subtitle")}
              </CardDescription>

              {/* Progress bar */}
              <div className="pt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>
                    {t("register.step")} {step + 1} {t("register.of")} {totalSteps}
                  </span>
                  <span className="font-semibold text-blue-400">
                    {Math.round(((step + 1) / totalSteps) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              <AnimatePresence mode="wait">
                {/* Step 0: Role Selection */}
                {step === 0 && (
                  <motion.div
                    key="step-role"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-white">{t("register.roleTitle")}</h3>
                      <p className="text-sm text-slate-400">{t("register.roleSubtitle")}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("user")}
                        className={`rounded-2xl border p-5 text-start transition-all interactive-scale ${
                          role === "user"
                            ? "border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                            : "border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-3">
                          <Car className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-white text-sm">{t("register.roleUser")}</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {t("register.roleUserDesc")}
                        </p>
                        {role === "user" && (
                          <CheckCircle className="h-5 w-5 text-blue-400 mt-3" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole("vendor")}
                        className={`rounded-2xl border p-5 text-start transition-all interactive-scale ${
                          role === "vendor"
                            ? "border-orange-500/60 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                            : "border-white/10 bg-white/5 hover:border-orange-500/30 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 mb-3">
                          <Store className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-white text-sm">{t("register.roleVendor")}</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {t("register.roleVendorDesc")}
                        </p>
                        {role === "vendor" && (
                          <CheckCircle className="h-5 w-5 text-orange-400 mt-3" />
                        )}
                      </button>
                    </div>

                    {errors.role && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.role}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Step 1: Account Info */}
                {step === 1 && (
                  <motion.div
                    key="step-account"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-white">{t("register.stepAccount")}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.username")}
                        </Label>
                        <div className="relative">
                          <User className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            id="username"
                            placeholder={t("register.usernamePlaceholder")}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        {errors.username && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.username}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.phone")}
                        </Label>
                        <div className="relative">
                          <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={t("register.phonePlaceholder")}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                        {t("register.email")}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("login.emailPlaceholder")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="glass-input h-11 ps-10 pe-4 interactive-scale"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                        {t("register.password")}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="glass-input h-11 ps-10 pe-4 interactive-scale"
                        />
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.password}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Role-specific details */}
                {step === 2 && role === "user" && (
                  <motion.div
                    key="step-user"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-5"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-white">{t("register.carSpecs")}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="carModel" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.carModel")}
                        </Label>
                        <div className="relative">
                          <Car className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            id="carModel"
                            placeholder={t("register.carModelPlaceholder")}
                            value={carModel}
                            onChange={(e) => setCarModel(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        {errors.carModel && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.carModel}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="plateNumber" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.plateNumber")}
                        </Label>
                        <div className="relative">
                          <FileText className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            id="plateNumber"
                            placeholder={t("register.plateNumberPlaceholder")}
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        {errors.plateNumber && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.plateNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.year")}
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="glass-input h-11 text-white border-white/10 ps-10 interactive-scale">
                              <SelectValue placeholder={t("register.yearPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950/95 border-white/10 text-white backdrop-blur-2xl">
                              {years.map((y) => (
                                <SelectItem key={y} value={y} className="focus:bg-white/10 focus:text-white">
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {errors.year && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.year}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.transmission")}
                        </Label>
                        <RadioGroup
                          value={transmission}
                          onValueChange={setTransmission}
                          className="flex gap-2"
                        >
                          <label
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-all interactive-scale ${
                              transmission === "Manual"
                                ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                            }`}
                          >
                            <RadioGroupItem value="Manual" id="trans-manual" className="sr-only" />
                            <Cog className="h-4 w-4" />
                            <span className="text-sm font-medium">{t("register.transmissionManual")}</span>
                          </label>
                          <label
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-all interactive-scale ${
                              transmission === "Automatic"
                                ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                            }`}
                          >
                            <RadioGroupItem value="Automatic" id="trans-auto" className="sr-only" />
                            <Cog className="h-4 w-4" />
                            <span className="text-sm font-medium">{t("register.transmissionAutomatic")}</span>
                          </label>
                        </RadioGroup>
                        {errors.transmission && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.transmission}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                        {t("register.fuelType")}
                      </Label>
                      <RadioGroup
                        value={fuelType}
                        onValueChange={setFuelType}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                      >
                        {[
                          { value: "Gasoline", label: t("register.fuelGasoline"), icon: Fuel },
                          { value: "Gas", label: t("register.fuelGas"), icon: Fuel },
                          { value: "Electric", label: t("register.fuelElectric"), icon: Zap },
                          { value: "Hybrid", label: t("register.fuelHybrid"), icon: Leaf },
                        ].map((fuel) => (
                          <label
                            key={fuel.value}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-all interactive-scale ${
                              fuelType === fuel.value
                                ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                            }`}
                          >
                            <RadioGroupItem value={fuel.value} className="sr-only" />
                            <fuel.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{fuel.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      {errors.fuelType && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fuelType}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-orange-400" />
                        <h4 className="font-bold text-white text-sm">{t("register.emergencyContact")}</h4>
                      </div>
                      <p className="text-xs text-slate-400">{t("register.emergencyContactDesc")}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyName" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                            {t("register.emergencyName")}
                          </Label>
                          <Input
                            id="emergencyName"
                            placeholder={t("register.emergencyNamePlaceholder")}
                            value={emergencyName}
                            onChange={(e) => setEmergencyName(e.target.value)}
                            className="glass-input h-11 interactive-scale"
                          />
                          {errors.emergencyName && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.emergencyName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                            {t("register.emergencyPhone")}
                          </Label>
                          <Input
                            id="emergencyPhone"
                            type="tel"
                            placeholder={t("register.emergencyPhonePlaceholder")}
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            className="glass-input h-11 interactive-scale"
                          />
                          {errors.emergencyPhone && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.emergencyPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FileUpload
                        label={t("register.carLicense")}
                        description={t("register.carLicenseDesc")}
                        value={carLicenseFile}
                        onChange={setCarLicenseFile}
                        error={errors.carLicenseFile}
                      />
                      <FileUpload
                        label={t("register.personalId")}
                        description={t("register.personalIdDesc")}
                        value={personalIdFile}
                        onChange={setPersonalIdFile}
                        error={errors.personalIdFile}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Vendor details */}
                {step === 2 && role === "vendor" && (
                  <motion.div
                    key="step-vendor"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-5"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-white">{t("register.businessInfo")}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.businessName")}
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            id="businessName"
                            placeholder={t("register.businessNamePlaceholder")}
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        {errors.businessName && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.businessName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serviceType" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.serviceType")}
                        </Label>
                        <div className="relative">
                          <Wrench className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Select value={serviceType} onValueChange={setServiceType}>
                            <SelectTrigger className="glass-input h-11 text-white border-white/10 ps-10 interactive-scale">
                              <SelectValue placeholder={t("register.selectServiceType")} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950/95 border-white/10 text-white backdrop-blur-2xl">
                              {serviceTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="focus:bg-white/10 focus:text-white">
                                  {t(type.labelKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {errors.serviceType && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.serviceType}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumbers" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.phoneNumbers")}
                        </Label>
                        <div className="relative">
                          <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            id="phoneNumbers"
                            type="tel"
                            placeholder={t("register.phoneNumbersPlaceholder")}
                            value={phoneNumbers}
                            onChange={(e) => setPhoneNumbers(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        {errors.phoneNumbers && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.phoneNumbers}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyLine" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {t("register.emergencyLine")}
                        </Label>
                        <div className="relative">
                          <AlertCircle className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            id="emergencyLine"
                            type="tel"
                            placeholder={t("register.emergencyLinePlaceholder")}
                            value={emergencyLine}
                            onChange={(e) => setEmergencyLine(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        {errors.emergencyLine && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.emergencyLine}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                        {t("register.mapLocation")}
                      </Label>
                      <p className="text-xs text-slate-400">{t("register.mapLocationDesc")}</p>
                      <LocationPicker value={coordinates} onChange={setCoordinates} />
                      {errors.coordinates && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.coordinates}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FileUpload
                        label={t("register.commercialRegister")}
                        description={t("register.commercialRegisterPlaceholder")}
                        value={commercialRegisterFile}
                        onChange={setCommercialRegisterFile}
                        accept=".pdf,image/*"
                        error={errors.commercialRegisterFile}
                      />
                      <FileUpload
                        label={t("register.taxId")}
                        description={t("register.taxIdPlaceholder")}
                        value={taxIdFile}
                        onChange={setTaxIdFile}
                        accept=".pdf,image/*"
                        error={errors.taxIdFile}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workingHours" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                        {t("register.workingHours")}
                      </Label>
                      <div className="relative">
                        <Clock className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          id="workingHours"
                          placeholder={t("register.workingHoursPlaceholder")}
                          value={workingHours}
                          onChange={(e) => setWorkingHours(e.target.value)}
                          className="glass-input h-11 ps-10 pe-4 interactive-scale"
                        />
                      </div>
                      {errors.workingHours && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.workingHours}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                        {t("register.paymentMethods")}
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.value}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-all interactive-scale ${
                              paymentMethodsSelected.includes(method.value)
                                ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                            }`}
                          >
                            <Checkbox
                              checked={paymentMethodsSelected.includes(method.value)}
                              onCheckedChange={() => togglePaymentMethod(method.value)}
                              className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <span className="text-sm font-medium">{t(method.labelKey)}</span>
                          </label>
                        ))}
                      </div>
                      {errors.paymentMethods && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.paymentMethods}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        <h4 className="font-bold text-white text-sm">{t("register.socialMedia")}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
                          {t("register.optional")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{t("register.socialMediaDesc")}</p>

                      <div className="space-y-3">
                        <div className="relative">
                          <Facebook className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            placeholder={t("register.facebookPlaceholder")}
                            value={socialFacebook}
                            onChange={(e) => setSocialFacebook(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        <div className="relative">
                          <MessageCircle className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            placeholder={t("register.whatsappPlaceholder")}
                            value={socialWhatsApp}
                            onChange={(e) => setSocialWhatsApp(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                        <div className="relative">
                          <Instagram className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            placeholder={t("register.instagramPlaceholder")}
                            value={socialInstagram}
                            onChange={(e) => setSocialInstagram(e.target.value)}
                            className="glass-input h-11 ps-10 pe-4 interactive-scale"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <motion.div
                    key="step-review"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-white">{t("register.reviewTitle")}</h3>
                      <p className="text-sm text-slate-400">{t("register.reviewSubtitle")}</p>
                    </div>

                    {/* Account info */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-400" />
                          {t("register.accountInfo")}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          {t("register.edit")}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <ReviewItem label={t("register.username")} value={username} />
                        <ReviewItem label={t("register.email")} value={email} />
                        <ReviewItem label={t("register.phone")} value={phone} />
                        <ReviewItem label={t("register.password")} value="••••••••" />
                      </div>
                    </div>

                    {/* Role-specific info */}
                    {role === "user" ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-400" />
                            {t("register.carInfo")}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            {t("register.edit")}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <ReviewItem label={t("register.carModel")} value={carModel} />
                          <ReviewItem label={t("register.plateNumber")} value={plateNumber} />
                          <ReviewItem label={t("register.year")} value={year} />
                          <ReviewItem label={t("register.transmission")} value={transmission} />
                          <ReviewItem label={t("register.fuelType")} value={fuelType} />
                          <ReviewItem label={t("register.emergencyName")} value={emergencyName} />
                          <ReviewItem label={t("register.emergencyPhone")} value={emergencyPhone} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                          <FileText className="h-3.5 w-3.5 text-green-400" />
                          <span>{t("register.carLicense")}: {carLicenseFile?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <FileText className="h-3.5 w-3.5 text-green-400" />
                          <span>{t("register.personalId")}: {personalIdFile?.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-orange-400" />
                            {t("register.businessInfo")}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            {t("register.edit")}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <ReviewItem label={t("register.businessName")} value={businessName} />
                          <ReviewItem label={t("register.serviceType")} value={serviceType} />
                          <ReviewItem label={t("register.phoneNumbers")} value={phoneNumbers} />
                          <ReviewItem label={t("register.emergencyLine")} value={emergencyLine} />
                          <ReviewItem label={t("register.workingHours")} value={workingHours} />
                          <ReviewItem
                            label={t("register.mapLocation")}
                            value={coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : t("register.notProvided")}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {paymentMethodsSelected.map((m) => (
                            <span key={m} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              {m}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                          <FileText className="h-3.5 w-3.5 text-green-400" />
                          <span>{t("register.commercialRegister")}: {commercialRegisterFile?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <FileText className="h-3.5 w-3.5 text-green-400" />
                          <span>{t("register.taxId")}: {taxIdFile?.name}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 pt-2">
                {step > 0 && (
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 interactive-scale flex-1"
                  >
                    <ArrowLeft className="me-2 h-4 w-4 rtl:-scale-x-100" />
                    {t("register.back")}
                  </Button>
                )}

                {step < totalSteps - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 border border-white/10 interactive-scale flex-1"
                  >
                    {t("register.next")}
                    <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/25 border border-white/10 interactive-scale flex-1"
                  >
                    {isLoading ? t("register.creating") : t("register.submit")}
                    {!isLoading && <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" />}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 text-center">
            <p className="text-sm text-slate-400">
              {t("register.haveAccount")}{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4">
                {t("register.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-white truncate">{value || "—"}</p>
    </div>
  );
}
