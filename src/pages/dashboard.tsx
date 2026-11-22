import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Users, CheckCircle, DollarSign, Wifi, WifiOff, Clock, Car, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getOwnCenter, getVendorOffers, getVendorRequests, subscribeToCenterRequestChanges, type RequestOffer, type ServiceRequest } from "../services/request-service";

export function DashboardPage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [centerId, setCenterId] = useState<string | null>(null);
  const [status, setStatus] = useState(user?.status || "offline");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (currentCenterId?: string | null) => {
    if (!user) return;
    const center = currentCenterId ? null : await getOwnCenter(user.id);
    const id = currentCenterId ?? center?.id ?? null;
    if (!id) {
      setCenterId(null);
      setRequests([]);
      setOffers([]);
      setLoading(false);
      return;
    }
    if (center) {
      setCenterId(center.id);
      setStatus(center.is_online ? "online" : "offline");
    }
    if (!user.verified) {
      setRequests([]);
      setOffers([]);
      setLoading(false);
      return;
    }
    const [nextRequests, nextOffers] = await Promise.all([getVendorRequests(), getVendorOffers(id)]);
    setRequests(nextRequests);
    setOffers(nextOffers);
    setLoading(false);
  }, [user?.id, user?.verified]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const center = await getOwnCenter(user.id);
        if (!active) return;
        if (!center) {
          setLoading(false);
          return;
        }
        setCenterId(center.id);
        setStatus(center.is_online ? "online" : "offline");
        if (!user.verified) {
          setRequests([]);
          setOffers([]);
          return;
        }
        const [nextRequests, nextOffers] = await Promise.all([getVendorRequests(), getVendorOffers(center.id)]);
        if (active) {
          setRequests(nextRequests);
          setOffers(nextOffers);
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : t("common.dashboardLoadFailed"));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [user?.id, user?.verified]);

  useEffect(() => {
    if (!centerId) return;
    return subscribeToCenterRequestChanges(centerId, () => {
      void refresh(centerId).catch((error: Error) => toast.error(error.message));
    });
  }, [centerId, refresh]);

  const activeRequests = requests.filter((request) => ["pending", "offered", "accepted", "in_progress"].includes(request.status));
  const incomingRequests = requests.filter((request) => ["pending", "offered"].includes(request.status));
  const completedRequests = requests.filter((request) => request.status === "completed");
  const completedOfferIds = new Set(completedRequests.map((request) => request.accepted_offer_id).filter(Boolean));
  const totalEarnings = useMemo(() => offers.filter((offer) => completedOfferIds.has(offer.id)).reduce((sum, offer) => sum + Number(offer.price), 0), [offers, requests]);

  const handleStatusChange = async (checked: boolean) => {
    if (!user) return;
    if (checked && !user.verified) {
      toast.error(t("ops.approvalRequired"));
      return;
    }
    const nextStatus = checked ? "online" : "offline";
    try {
      await updateUser({ status: nextStatus });
      setStatus(nextStatus);
      toast.success(checked ? t("ops.onlineNow") : t("ops.offlineNow"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.availabilityUpdateFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("ops.dashboard")}</h1>
          <p className="text-muted-foreground">{t("ops.dashboardWelcome", { name: user?.businessName?.split(" ")[0] || "Vendor" })}</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          {status === "online" ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-slate-400" />}
          <Label htmlFor="center-online" className="text-sm font-medium text-foreground">{status === "online" ? t("ops.online") : t("ops.offline")}</Label>
          <Switch id="center-online" checked={status === "online"} onCheckedChange={handleStatusChange} disabled={!user?.verified} aria-label={t("common.toggleOnlineStatus")} />
        </div>
      </div>

      {!centerId && !loading && <Card className="glass-card border-amber-500/20"><CardContent className="p-4 text-sm text-amber-200">{t("ops.noCenter")}</CardContent></Card>}
      {user && !user.verified && <Card className="glass-card border-amber-500/20"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-amber-200">{t("ops.pendingVerification")}</p><p className="text-sm text-muted-foreground">{t("ops.pendingVendorDesc")}</p></div><Button variant="outline" onClick={() => navigate("/dashboard/verification")}>{t("ops.uploadDocuments")}</Button></CardContent></Card>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t("ops.activeRequests")} value={loading ? "—" : activeRequests.length} caption={t("ops.activeRequestsCaption")} icon={<Users className="h-5 w-5 text-orange-400" />} />
        <MetricCard title={t("ops.completedJobs")} value={loading ? "—" : completedRequests.length} caption={t("ops.completedJobsCaption")} icon={<CheckCircle className="h-5 w-5 text-green-400" />} />
        <MetricCard title={t("ops.totalEarnings")} value={loading ? "—" : `${t("common.egp")} ${totalEarnings.toLocaleString()}`} caption={t("ops.earningsCaption")} icon={<DollarSign className="h-5 w-5 text-amber-400" />} />
        <MetricCard title={t("ops.availability")} value={status === "online" ? t("ops.online") : t("ops.offline")} caption={t("ops.availabilityCaption")} icon={<TrendingUp className="h-5 w-5 text-blue-400" />} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-xl font-bold text-foreground">{t("ops.liveFeed")}</h2><p className="text-sm text-muted-foreground">{t("ops.approvedArea")}</p></div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/requests")}>{t("ops.openQueue")}<ArrowRight className="ms-2 h-4 w-4" /></Button>
        </div>
        {loading ? <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">{t("ops.loadingRequests")}</div> : incomingRequests.length === 0 ? (
          <Card className="glass-card"><CardContent className="py-12 text-center"><Car className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="mb-2 text-lg font-medium text-foreground">{t("ops.noIncoming")}</h3><p className="text-muted-foreground">{t("ops.noIncomingDesc")}</p></CardContent></Card>
        ) : <div className="space-y-3">{incomingRequests.slice(0, 5).map((request) => <RequestFeedCard key={request.id} request={request} onOpen={() => navigate("/dashboard/requests")} />)}</div>}
      </div>
    </div>
  );
}

function MetricCard({ title, value, caption, icon }: { title: string; value: string | number; caption: string; icon: React.ReactNode }) {
  return <Card className="glass-card glass-glow"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">{icon}</div></CardHeader><CardContent><div className="text-2xl font-bold capitalize text-foreground">{value}</div><p className="text-xs text-muted-foreground">{caption}</p></CardContent></Card>;
}

const urgencyKeys: Record<string, string> = {
  emergency: "userRequests.urgencyEmergency",
  urgent: "userRequests.urgencyUrgent",
  normal: "userRequests.urgencyNormal",
  scheduled: "userRequests.urgencyScheduled",
};

const statusKeys: Record<string, string> = {
  pending: "ops.pending",
  offered: "ops.offered",
  accepted: "ops.accepted",
  in_progress: "ops.inProgress",
  completed: "ops.completed",
  cancelled: "ops.cancelled",
};

function RequestFeedCard({ request, onOpen }: { request: ServiceRequest; onOpen: () => void }) {
  const { t } = useLanguage();
  return (
      <Card className="glass-card glass-glow">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"><Car className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold capitalize text-foreground">{t(`userRequests.${request.request_type}`)}</p>
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-300">{urgencyKeys[request.urgency] ? t(urgencyKeys[request.urgency]) : request.urgency}</Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{new Date(request.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<span className="px-1">·</span><AlertTriangle className="h-3 w-3" />{statusKeys[request.status] ? t(statusKeys[request.status]) : request.status.replace(/_/g, " ")}</div>
          </div>
          <Button variant="outline" size="sm" onClick={onOpen}>{t("common.viewAndRespond")}</Button>
        </CardContent>
      </Card>
    );
}
