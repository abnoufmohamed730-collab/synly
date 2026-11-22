import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MapPin, Phone, Navigation, Wrench, Search, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/language-context";
import { searchNearbyCenters, type NearbyCenter } from "../services/request-service";

export function ShopsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [centers, setCenters] = useState<NearbyCenter[]>([]);
  const [query, setQuery] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [openFilter, setOpenFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!position) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchNearbyCenters({
        latitude: position.lat,
        longitude: position.lng,
        radiusKm: 50,
        serviceType,
        openNow: openFilter === "all" ? null : openFilter === "open",
        query,
      }).then((results) => {
        if (active) setCenters(results);
      }).catch((error: Error) => {
        if (active) toast.error(error.message || t("shops.loadError"));
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [position, query, serviceType, openFilter, t]);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error(t("shops.locationUnavailable"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => {
        toast.error(t("shops.locationPermission"));
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  const openRequest = (center: NearbyCenter) => {
    const type = center.service_type.toLowerCase().includes("tow") ? "towing"
      : center.service_type.toLowerCase().includes("spare") || center.service_type.toLowerCase().includes("part") ? "spare_parts"
      : center.service_type.toLowerCase().includes("gas") ? "fuel"
      : center.service_type.toLowerCase().includes("electric") ? "battery"
      : "mechanical";
    const params = new URLSearchParams({ center: center.id, type });
    navigate(`/user/requests?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("shops.title")}</h1>
          <p className="text-muted-foreground">{t("shops.subtitle")}</p>
        </div>
        <Button onClick={locate} disabled={locating} variant="outline" className="rounded-xl border-white/10">
          <LocateFixed className="me-2 h-4 w-4" />{locating ? t("shops.locating") : position ? t("shops.refreshLocation") : t("shops.useMyLocation")}
        </Button>
      </div>

      <div className="glass-card grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-[1fr_220px_180px]">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={t("shops.searchAria")} placeholder={t("shops.searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} className="glass-input ps-10" />
        </div>
        <Select value={serviceType || "all"} onValueChange={(value) => setServiceType(value === "all" ? "" : value)}>
          <SelectTrigger aria-label={t("shops.filterServiceAria")} className="glass-input"><SelectValue placeholder={t("shops.allServices")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("shops.allServices")}</SelectItem>
            <SelectItem value="Mechanical Repair">{t("shops.mechanicalRepair")}</SelectItem>
            <SelectItem value="Auto Electric">{t("shops.autoElectric")}</SelectItem>
            <SelectItem value="Spare Parts Shop">{t("shops.spareParts")}</SelectItem>
            <SelectItem value="Towing/Roadside Assistance">{t("shops.towingRoadside")}</SelectItem>
            <SelectItem value="Gas Station">{t("shops.gasStation")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={openFilter} onValueChange={setOpenFilter}>
          <SelectTrigger aria-label={t("shops.filterAvailabilityAria")} className="glass-input"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("shops.anyAvailability")}</SelectItem>
            <SelectItem value="open">{t("shops.openNow")}</SelectItem>
            <SelectItem value="closed">{t("shops.closed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!position ? (
        <Card className="glass-card"><CardContent className="py-14 text-center">
          <MapPin className="mx-auto mb-4 h-11 w-11 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">{t("shops.shareLocationTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("shops.privacyNote")}</p>
        </CardContent></Card>
      ) : loading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">{t("shops.searching")}</div>
      ) : centers.length === 0 ? (
        <Card className="glass-card"><CardContent className="py-14 text-center">
          <MapPin className="mx-auto mb-4 h-11 w-11 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{t("shops.noResultsTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("shops.noResultsDesc")}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {centers.map((center) => (
            <Card key={center.id} className="glass-card overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground">{center.name}</p>
                    <p className="text-sm text-muted-foreground">{center.service_type}</p>
                  </div>
                  <Badge variant="outline" className={center.open_now ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-slate-500/30 bg-slate-500/10 text-slate-300"}>
                    {center.open_now ? t("shops.openNow") : center.is_online ? t("shops.available") : t("shops.offline")}
                  </Badge>
                </div>
                <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{center.distance_km.toFixed(1)} {t("common.km")}</span>
                  {center.address && <span className="truncate">{center.address}</span>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openRequest(center)} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600">
                    <Wrench className="me-2 h-4 w-4" />{t("shops.requestService")}
                  </Button>
                  {center.phone_e164 && <a href={`tel:${center.phone_e164.replace(/[^0-9+]/g, "")}`} aria-label={t("shops.callAria", { name: center.name })} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-foreground hover:bg-white/5"><Phone className="h-4 w-4" /></a>}
                  <a href={`https://www.openstreetmap.org/directions?from=${position.lat},${position.lng}&to=${center.latitude},${center.longitude}`} target="_blank" rel="noreferrer" aria-label={t("shops.directionsAria", { name: center.name })} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-foreground hover:bg-white/5"><Navigation className="h-4 w-4" /></a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}