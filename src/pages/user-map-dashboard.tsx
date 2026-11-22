import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/language-context";
import { useAuth } from "../context/auth-context";
import { Sidebar } from "../components/sidebar";
import { LanguageSwitcher } from "../components/language-switcher";
import { MapComponent } from "../components/MapComponent";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getCustomerRequests, searchNearbyCenters, subscribeToCustomerRequestChanges, type NearbyCenter, type ServiceRequest } from "../services/request-service";
import { Menu, Car, Siren, Package, Stethoscope, Search, Navigation, Plus, ArrowRight, Wrench, CircleDot, Battery, Fuel, Lock, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const quickActions = [
  { key: "map.towing", icon: Car, color: "bg-blue-500/10 text-blue-400" },
  { key: "map.battery", icon: Battery, color: "bg-green-500/10 text-green-400" },
  { key: "map.tire", icon: CircleDot, color: "bg-amber-500/10 text-amber-400" },
  { key: "map.fuel", icon: Fuel, color: "bg-orange-500/10 text-orange-400" },
  { key: "map.lockout", icon: Lock, color: "bg-purple-500/10 text-purple-400" },
  { key: "map.mechanical", icon: Wrench, color: "bg-rose-500/10 text-rose-400" },
];

const statusTranslationKeys: Record<string, string> = {
  pending: "ops.pending",
  offered: "ops.offered",
  accepted: "ops.accepted",
  in_progress: "ops.inProgress",
  completed: "ops.completed",
  cancelled: "ops.cancelled",
};

export function UserMapDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [openNow, setOpenNow] = useState("all");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [centers, setCenters] = useState<NearbyCenter[]>([]);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    if (!position) return;
    let active = true;
    setNearbyLoading(true);
    const timer = window.setTimeout(() => {
      searchNearbyCenters({
        latitude: position.lat,
        longitude: position.lng,
        radiusKm: 20,
        serviceType,
        openNow: openNow === "all" ? null : openNow === "open",
        query: search,
      }).then((results) => {
        if (active) setCenters(results);
      }).catch(() => {
        if (active) toast.error(t("shops.loadError"));
      }).finally(() => {
        if (active) setNearbyLoading(false);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [position, serviceType, openNow, search, t]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refreshActiveRequest = async () => {
      try {
        const requests = await getCustomerRequests(user.id);
        if (active) setActiveRequest(requests.find((request) => ["pending", "offered", "accepted", "in_progress"].includes(request.status)) ?? null);
      } catch {
        if (active) toast.error(t("screens.activeRequestLoadFailed"));
      }
    };
    void refreshActiveRequest();
    return () => { active = false; };
  }, [user?.id, t]);

  useEffect(() => {
    if (!user) return;
    return subscribeToCustomerRequestChanges(user.id, () => {
      void getCustomerRequests(user.id).then((requests) => {
        const nextActive = requests.find((request) => ["pending", "offered", "accepted", "in_progress"].includes(request.status)) ?? null;
        setActiveRequest((current) => (current?.id === nextActive?.id ? current : nextActive));
      }).catch((error: Error) => toast.error(error.message));
    });
  }, [user?.id]);

  const handleLocate = () => {
    setSheetExpanded(false);
  };

  const handleMapDragStart = () => {
    setSheetExpanded(false);
  };

  const handleSearch = () => {
    if (position) return;
    if (!navigator.geolocation) {
      toast.error(t("shops.locationUnavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => toast.error(t("shops.locationPermission")),
    );
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#090A0F]">
      {/* Ambient glows */}
      <div className="ambient-glow float-slow -top-32 -left-32 h-96 w-96 bg-blue-600/15" />
      <div className="ambient-glow float-slower top-1/3 -right-32 h-96 w-96 bg-orange-500/10" />

      {/* Map */}
      <MapComponent
        zoom={3}
        centers={centers}
        onUserLocation={setPosition}
        onLocate={handleLocate}
        onMapDragStart={handleMapDragStart}
      />

      {/* Top-left: hamburger + language switcher */}
      <div className="absolute top-4 start-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(true)}
          className="glass-btn h-10 w-10 shadow-lg"
          aria-label={t("screens.openMenu")}
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

      {activeRequest && (
        <div className="absolute top-20 inset-x-4 z-40 mx-auto max-w-md glass-sheet rounded-2xl border border-blue-400/20 p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-300">{t("screens.activeRequest")}</p>
              <p className="mt-1 truncate font-semibold text-white">{t(`userRequests.${activeRequest.request_type}`)} · {statusTranslationKeys[activeRequest.status] ? t(statusTranslationKeys[activeRequest.status]) : activeRequest.status.replace(/_/g, " ")}</p>
              <p className="text-xs text-slate-300">{t("screens.offersReceived", { count: activeRequest.offers?.length ?? 0 })}</p>
            </div>
            <Button size="sm" onClick={() => navigate("/user/requests")} className="shrink-0 bg-blue-600 text-white hover:bg-blue-500">{t("common.track")}</Button>
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 p-3 md:p-5 transition-all duration-400 ease-out ${
          sheetExpanded
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-[calc(100%-72px)] opacity-100 pointer-events-auto"
        }`}
      >
        <div className="mx-auto max-w-4xl">
          {/* Drag handle / expand pill */}
          <button
            onClick={() => setSheetExpanded((v) => !v)}
            className="mx-auto mb-3 flex h-6 w-16 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 interactive-scale"
            aria-label={sheetExpanded ? t("screens.collapsePanel") : t("screens.expandPanel")}
          >
            <ChevronUp
              className={cn(
                "h-4 w-4 text-white/70 transition-transform duration-400 ease-out",
                sheetExpanded ? "rotate-0" : "rotate-180"
              )}
            />
          </button>

          <div className="glass-sheet rounded-3xl p-4 md:p-5">
            {/* Greeting */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white md:text-2xl">
                  {t("screens.welcomeBack", { name: user?.businessName?.split(" ")[0] || "there" })}
                </h1>
                <p className="text-sm text-slate-400">{t("map.subtitle")}</p>
              </div>
              <Button
                onClick={() => navigate("/user/requests")}
                className="hidden sm:inline-flex bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Plus className="h-4 w-4 me-2" />
                {t("common.newRequest")}
              </Button>
            </div>

            {/* Bottom sheet grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Large card: Roadside Assistance */}
              <button
                onClick={() => navigate("/user/requests")}
                className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent p-4 text-left transition-all hover:border-orange-500/50 hover:from-orange-500/20 md:col-span-2 interactive-scale"
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
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl transition-all hover:border-blue-500/40 hover:bg-white/10 interactive-scale"
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
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:border-blue-500/30 hover:bg-white/10 interactive-scale"
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", action.color)}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">{t(action.key)}</span>
                </button>
              ))}
            </div>

            {/* Search and service filters */}
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
                onClick={handleSearch}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-500 p-2 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                aria-label={t("common.search")}
              >
                <Navigation className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Select value={serviceType || "all"} onValueChange={(value) => setServiceType(value === "all" ? "" : value)}>
                <SelectTrigger className="glass-input h-10 text-white" aria-label={t("shops.filterServiceAria")}><SelectValue placeholder={t("shops.allServices")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("shops.allServices")}</SelectItem>
                  <SelectItem value="Mechanical Repair">{t("shops.mechanicalRepair")}</SelectItem>
                  <SelectItem value="Auto Electric">{t("shops.autoElectric")}</SelectItem>
                  <SelectItem value="Spare Parts Shop">{t("shops.spareParts")}</SelectItem>
                  <SelectItem value="Towing/Roadside Assistance">{t("shops.towingRoadside")}</SelectItem>
                  <SelectItem value="Gas Station">{t("shops.gasStation")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={openNow} onValueChange={setOpenNow}>
                <SelectTrigger className="glass-input h-10 text-white" aria-label={t("shops.filterAvailabilityAria")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("shops.anyAvailability")}</SelectItem>
                  <SelectItem value="open">{t("shops.openNow")}</SelectItem>
                  <SelectItem value="closed">{t("shops.closed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="mt-2 text-xs text-slate-400" aria-live="polite">
              {!position ? t("screens.allowLocationDiscover") : nearbyLoading ? t("screens.searchingNearby") : t("screens.centersNearby", { count: centers.length })}
            </p>
          </div>
        </div>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} forceDrawer={true} />
    </div>
  );
}