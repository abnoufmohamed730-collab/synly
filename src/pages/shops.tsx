import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MapPin, Phone, Navigation, Wrench, Search, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { searchNearbyCenters, type NearbyCenter } from "../services/request-service";

export function ShopsPage() {
  const navigate = useNavigate();
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
        if (active) toast.error(error.message || "Could not load nearby service centers.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [position, query, serviceType, openFilter]);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Location access is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => {
        toast.error("Allow location access to search nearby centers.");
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
          <h1 className="text-3xl font-bold text-foreground">Nearby Service Centers</h1>
          <p className="text-muted-foreground">Search approved centers by service, availability, and distance</p>
        </div>
        <Button onClick={locate} disabled={locating} variant="outline" className="rounded-xl border-white/10">
          <LocateFixed className="me-2 h-4 w-4" />{locating ? "Locating…" : position ? "Refresh location" : "Use my location"}
        </Button>
      </div>

      <div className="glass-card grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-[1fr_220px_180px]">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search service centers" placeholder="Search name or service" value={query} onChange={(event) => setQuery(event.target.value)} className="glass-input ps-10" />
        </div>
        <Select value={serviceType || "all"} onValueChange={(value) => setServiceType(value === "all" ? "" : value)}>
          <SelectTrigger aria-label="Filter service type" className="glass-input"><SelectValue placeholder="All services" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            <SelectItem value="Mechanical Repair">Mechanical repair</SelectItem>
            <SelectItem value="Auto Electric">Auto electric</SelectItem>
            <SelectItem value="Spare Parts Shop">Spare parts</SelectItem>
            <SelectItem value="Towing/Roadside Assistance">Towing / roadside</SelectItem>
            <SelectItem value="Gas Station">Gas station</SelectItem>
          </SelectContent>
        </Select>
        <Select value={openFilter} onValueChange={setOpenFilter}>
          <SelectTrigger aria-label="Filter availability" className="glass-input"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any availability</SelectItem>
            <SelectItem value="open">Open now</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!position ? (
        <Card className="glass-card"><CardContent className="py-14 text-center">
          <MapPin className="mx-auto mb-4 h-11 w-11 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Share your location to find nearby help</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your live location stays on this device unless you attach it to a service request.</p>
        </CardContent></Card>
      ) : loading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">Searching approved service centers…</div>
      ) : centers.length === 0 ? (
        <Card className="glass-card"><CardContent className="py-14 text-center">
          <MapPin className="mx-auto mb-4 h-11 w-11 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">No matching centers nearby</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try another service filter or expand your search from the map.</p>
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
                    {center.open_now ? "Open now" : center.is_online ? "Available" : "Offline"}
                  </Badge>
                </div>
                <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{center.distance_km.toFixed(1)} km</span>
                  {center.address && <span className="truncate">{center.address}</span>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openRequest(center)} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600">
                    <Wrench className="me-2 h-4 w-4" />Request service
                  </Button>
                  {center.phone_e164 && <a href={`tel:${center.phone_e164.replace(/[^0-9+]/g, "")}`} aria-label={`Call ${center.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-foreground hover:bg-white/5"><Phone className="h-4 w-4" /></a>}
                  <a href={`https://www.openstreetmap.org/directions?from=${position.lat},${position.lng}&to=${center.latitude},${center.longitude}`} target="_blank" rel="noreferrer" aria-label={`Directions to ${center.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-foreground hover:bg-white/5"><Navigation className="h-4 w-4" /></a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
