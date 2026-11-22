import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Car, Battery, Fuel, Lock, Wrench, CircleDot, MapPin, ArrowRight, Plus, Clock, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { getCustomerRequests, searchNearbyCenters, type NearbyCenter, type ServiceRequest } from "../services/request-service";

const quickActions = [
  { key: "userRequests.towing", icon: Car, color: "bg-blue-500/10 text-blue-400" },
  { key: "userRequests.battery", icon: Battery, color: "bg-green-500/10 text-green-400" },
  { key: "userRequests.tire", icon: CircleDot, color: "bg-amber-500/10 text-amber-400" },
  { key: "userRequests.fuel", icon: Fuel, color: "bg-orange-500/10 text-orange-400" },
  { key: "userRequests.lockout", icon: Lock, color: "bg-purple-500/10 text-purple-400" },
  { key: "userRequests.mechanical", icon: Wrench, color: "bg-rose-500/10 text-rose-400" },
];

const statusTranslationKeys: Record<string, string> = {
  pending: "ops.pending",
  offered: "ops.offered",
  accepted: "ops.accepted",
  in_progress: "ops.inProgress",
  completed: "ops.completed",
  cancelled: "ops.cancelled",
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  offered: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  accepted: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  in_progress: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  completed: "border-green-500/30 bg-green-500/10 text-green-300",
  cancelled: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

export function UserDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [centers, setCenters] = useState<NearbyCenter[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getCustomerRequests(user.id).then((result) => {
      if (active) setRequests(result);
    }).catch((error: Error) => {
      if (active) toast.error(error.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  const findNearby = () => {
    if (!navigator.geolocation) {
      toast.error(t("ops.locationFailed"));
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const next = { lat: coords.latitude, lng: coords.longitude };
      setPosition(next);
      void searchNearbyCenters({ latitude: next.lat, longitude: next.lng, radiusKm: 20 })
        .then(setCenters)
        .catch((error: Error) => toast.error(error.message));
    }, () => toast.error(t("shops.locationPermission")), { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t("screens.welcomeBack", { name: user?.businessName?.split(" ")[0] || "there" })}</h1><p className="text-muted-foreground">{t("screens.helpToday")}</p></div>
        <Button onClick={() => navigate("/user/requests")} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"><Plus className="me-2 h-4 w-4" />{t("ops.newRequest")}</Button>
      </div>

      <div><h2 className="mb-3 text-lg font-bold text-foreground">{t("screens.requestAssistance")}</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{quickActions.map((action) => <button key={action.key} onClick={() => navigate("/user/requests")} className="glass-card group rounded-xl p-4 text-center transition-colors hover:border-primary/40"><span className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-lg ${action.color} transition-transform group-hover:scale-105`}><action.icon className="h-5 w-5" /></span><span className="text-sm font-medium text-foreground">{t(action.key)}</span></button>)}</div></div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-foreground">{t("screens.nearbyCenters")}</h2><div className="flex gap-2"><Button variant="outline" size="sm" onClick={findNearby}><LocateFixed className="me-1.5 h-4 w-4" />{position ? t("screens.refresh") : t("screens.useLocation")}</Button><Button variant="outline" size="sm" onClick={() => navigate("/user/shops")}>{t("screens.viewAll")}<ArrowRight className="ms-1 h-4 w-4" /></Button></div></div>
          {!position ? <Card className="glass-card"><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("screens.nearbyPrompt")}</CardContent></Card> : centers.length === 0 ? <Card className="glass-card"><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("screens.noNearbyCenters")}</CardContent></Card> : centers.slice(0, 3).map((center) => <Card key={center.id} className="glass-card"><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium text-foreground">{center.name}</p><p className="text-xs text-muted-foreground">{center.service_type} · {center.distance_km.toFixed(1)} {t("common.km")}</p></div><Badge variant="outline" className={center.open_now ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-slate-500/30 bg-slate-500/10 text-slate-300"}>{center.open_now ? t("common.openNow") : t("shops.closed")}</Badge></CardContent></Card>)}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-foreground">{t("screens.myRecentRequests")}</h2><Button variant="outline" size="sm" onClick={() => navigate("/user/requests")}>{t("screens.viewAll")}<ArrowRight className="ms-1 h-4 w-4" /></Button></div>
          {loading ? <Card className="glass-card"><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("screens.loadingRequests")}</CardContent></Card> : requests.slice(0, 3).map((request) => <Card key={request.id} className="glass-card"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><p className="font-medium capitalize text-foreground">{t(`userRequests.${request.request_type}`)}</p><Badge variant="outline" className={statusStyles[request.status] || statusStyles.pending}>{statusTranslationKeys[request.status] ? t(statusTranslationKeys[request.status]) : request.status.replace(/_/g, " ")}</Badge></div><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{request.description}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{new Date(request.created_at).toLocaleString()}</p></CardContent></Card>)}
          {!loading && requests.length === 0 && <Card className="glass-card"><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("screens.noRequestsCreate")}</CardContent></Card>}
        </div>
      </div>
      <Card className="glass-card border-primary/20"><CardContent className="flex items-center gap-3 p-4"><MapPin className="h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-medium text-foreground">{t("screens.needHelpNow")}</p><p className="text-xs text-muted-foreground">{t("screens.needHelpNowDesc")}</p></div><Button className="ms-auto shrink-0" variant="outline" onClick={() => navigate("/user/requests")}>{t("screens.getHelp")}</Button></CardContent></Card>
    </div>
  );
}