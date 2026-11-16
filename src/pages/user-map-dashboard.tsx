import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/language-context";
import { useAuth } from "../context/auth-context";
import { Sidebar } from "../components/sidebar";
import { LanguageSwitcher } from "../components/language-switcher";
import { MapComponent } from "../components/MapComponent";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Menu,
  Car,
  Store,
  Siren,
  Package,
  Stethoscope,
  Search,
  Navigation,
  Plus,
  ArrowRight,
  Wrench,
  CircleDot,
  Battery,
  Fuel,
  Lock,
  Clock,
} from "lucide-react";
import { cn } from "../lib/utils";

const quickActions = [
  { key: "map.towing", icon: Car, color: "bg-blue-500/10 text-blue-400" },
  { key: "map.battery", icon: Battery, color: "bg-green-500/10 text-green-400" },
  { key: "map.tire", icon: CircleDot, color: "bg-amber-500/10 text-amber-400" },
  { key: "map.fuel", icon: Fuel, color: "bg-orange-500/10 text-orange-400" },
  { key: "map.lockout", icon: Lock, color: "bg-purple-500/10 text-purple-400" },
  { key: "map.mechanical", icon: Wrench, color: "bg-rose-500/10 text-rose-400" },
];

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <Badge className={map[status] || map.pending} variant="outline">
      {t(`common.${status}`)}
    </Badge>
  );
}

export function UserMapDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="relative h-screen overflow-hidden bg-[#090A0F]">
      {/* Ambient glows */}
      <div className="ambient-glow float-slow -top-32 -left-32 h-96 w-96 bg-blue-600/15" />
      <div className="ambient-glow float-slower top-1/3 -right-32 h-96 w-96 bg-orange-500/10" />

      {/* Map */}
      <MapComponent center={[30.0444, 31.2357]} zoom={15} />

      {/* Top-left: hamburger + language switcher */}
      <div className="absolute top-4 start-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(true)}
          className="glass-btn h-10 w-10 shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <LanguageSwitcher />
      </div>

      {/* Top-right: mode badge + avatar */}
      <div className="absolute top-4 end-4 z-30 flex items-center gap-2">
        <Badge
          variant="outline"
          className="gap-1.5 border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-xl shadow-lg"
        >
          <Car className="h-3.5 w-3.5" />
          {t("common.userMode")}
        </Badge>
        <div className="glass-btn h-10 w-10 rounded-full shadow-lg">
          <span className="text-sm font-bold text-blue-300">
            {user?.businessName?.charAt(0).toUpperCase() || "A"}
          </span>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 z-30 p-3 md:p-5">
        <div className="mx-auto max-w-4xl">
          {/* Drag handle */}
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />

          <div className="glass-sheet rounded-3xl p-4 md:p-5">
            {/* Greeting */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white md:text-2xl">{t("map.greeting")}</h1>
                <p className="text-sm text-slate-400">{t("map.subtitle")}</p>
              </div>
              <Button
                onClick={() => navigate("/user/requests")}
                className="hidden sm:inline-flex bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("common.newRequest")}
              </Button>
            </div>

            {/* Bottom sheet grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Large card: Roadside Assistance */}
              <button
                onClick={() => navigate("/user/requests")}
                className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent p-4 text-left transition-all hover:border-orange-500/50 hover:from-orange-500/20 md:col-span-2"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 transition-transform group-hover:scale-105">
                    <Siren className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-white">{t("map.roadside")}</p>
                    <p className="text-sm text-slate-400">{t("map.roadsideDesc")}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-300 transition-colors group-hover:bg-orange-500/30">
                    {t("map.roadsideCta")}
                    <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                  </div>
                </div>
              </button>

              {/* Spare Parts Orders */}
              <button
                onClick={() => navigate("/user/shops")}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl transition-all hover:border-blue-500/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-105">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t("map.spareParts")}</p>
                    <p className="text-xs text-slate-400">{t("map.sparePartsDesc")}</p>
                  </div>
                </div>
              </button>

              {/* Diagnostics & Inspection */}
              <button
                onClick={() => navigate("/user/shops")}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl transition-all hover:border-blue-500/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-105">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t("map.diagnostics")}</p>
                    <p className="text-xs text-slate-400">{t("map.diagnosticsDesc")}</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Quick actions row */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => navigate("/user/requests")}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:border-blue-500/30 hover:bg-white/10"
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", action.color)}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">{t(action.key)}</span>
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative mt-4">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={t("map.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input h-12 ps-11 pe-12 text-sm placeholder:text-slate-500"
              />
              <button
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-500 p-2 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                aria-label={t("common.search")}
              >
                <Navigation className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} forceDrawer={true} />
    </div>
  );
}
