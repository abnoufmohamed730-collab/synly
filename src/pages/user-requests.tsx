import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Car, Clock, MapPin, LocateFixed, Check, X, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  acceptRequestOffer,
  cancelServiceRequest,
  createServiceRequest,
  getCustomerRequests,
  getCustomerVehicles,
  subscribeToCustomerRequestChanges,
  type NewServiceRequest,
  type RequestType,
  type RequestUrgency,
  type ServiceRequest,
} from "../services/request-service";

const requestTypes: RequestType[] = [
  "towing",
  "battery",
  "tire",
  "fuel",
  "lockout",
  "mechanical",
  "maintenance",
  "spare_parts",
  "other",
];

const activeStatuses = ["pending", "offered", "accepted"];

const statusTranslationKeys: Record<string, string> = {
  pending: "ops.pending",
  offered: "ops.offered",
  accepted: "ops.accepted",
  in_progress: "ops.inProgress",
  completed: "ops.completed",
  cancelled: "ops.cancelled",
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  offered: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  accepted: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  in_progress: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  completed: "border-green-400/30 bg-green-400/10 text-green-300",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  return (
    <Badge variant="outline" className={statusStyles[status] ?? statusStyles.pending}>
      {statusTranslationKeys[status] ? t(statusTranslationKeys[status]) : status.replace(/_/g, " ")}
    </Badge>
  );
}

export function UserRequestsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const preferredType = requestTypes.includes(searchParams.get("type") as RequestType) ? (searchParams.get("type") as RequestType) : "mechanical";
  const assignedCenterId = searchParams.get("center") || null;
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [vehicles, setVehicles] = useState<Array<{ id: string; make: string | null; model: string; year: number | null; plate_number: string }>>([]);
  const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionRequestId, setActionRequestId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    requestType: preferredType,
    urgency: "emergency" as RequestUrgency,
    description: "",
    address: "",
    vehicleId: "none",
    latitude: "",
    longitude: "",
    scheduledAt: "",
  });

  const refreshRequests = useCallback(async () => {
    if (!user) return;
    const result = await getCustomerRequests(user.id);
    setRequests(result);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const [savedVehicles, savedRequests] = await Promise.all([getCustomerVehicles(user.id), getCustomerRequests(user.id)]);
        if (!active) return;
        setVehicles(savedVehicles);
        setRequests(savedRequests);
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : t("ops.requestFailed"));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
        return () => { active = false; };
      }, [user?.id, t]);

  useEffect(() => {
    if (!user) return;
    return subscribeToCustomerRequestChanges(user.id, () => {
      void refreshRequests().catch((error: Error) => toast.error(error.message));
    });
  }, [user?.id, refreshRequests]);

  useEffect(() => {
    setForm((current) => ({ ...current, requestType: preferredType }));
    if (assignedCenterId) setCreateOpen(true);
  }, [preferredType, assignedCenterId]);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error(t("ops.locationFailed"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) })),
      () => toast.error(t("ops.locationPermission")),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !form.latitude || !form.longitude) {
      toast.error(t("screens.invalidLocation"));
      return;
    }
    setSaving(true);
    try {
      const request: NewServiceRequest = {
        requestType: form.requestType,
        urgency: form.urgency,
        description: form.description,
        latitude,
        longitude,
        address: form.address,
        vehicleId: form.vehicleId === "none" ? null : form.vehicleId,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        assignedCenterId,
      };
      await createServiceRequest(request);
      await refreshRequests();
      setCreateOpen(false);
      setForm((current) => ({ ...current, description: "", address: "", scheduledAt: "" }));
      toast.success(t("ops.requestsSent"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("screens.createFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!window.confirm(t("ops.confirmAcceptOffer"))) return;
    setActionRequestId(offerId);
    try {
      await acceptRequestOffer(offerId);
      await refreshRequests();
      toast.success(t("ops.offerAccepted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("screens.acceptFailed"));
    } finally {
      setActionRequestId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!window.confirm(t("ops.confirmCancelRequest"))) return;
    setActionRequestId(requestId);
    try {
      await cancelServiceRequest(requestId);
      await refreshRequests();
      toast.success(t("ops.requestCancelled"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("screens.cancelFailed"));
    } finally {
      setActionRequestId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("ops.myRequests")}</h1>
          <p className="text-muted-foreground">{t("ops.myRequestsDesc")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600">
          <Plus className="me-2 h-4 w-4" />{t("ops.newRequest")}
        </Button>
      </div>

      {loading ? <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">{t("ops.loadingMyRequests")}</div> : requests.length === 0 ? (
        <Card className="glass-card"><CardContent className="py-14 text-center">
          <Car className="mx-auto mb-4 h-12 w-12 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">{t("ops.noRequestsYet")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("ops.noRequestsDesc")}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="glass-card">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Car className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold capitalize text-foreground">{t(`userRequests.${request.request_type}`)}</h2><StatusBadge status={request.status} /></div>
                    <p className="mt-1 text-sm text-muted-foreground">{request.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(request.created_at).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{request.address || `${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}`}</span>
                      <span className="capitalize">{t(`userRequests.urgency${request.urgency.charAt(0).toUpperCase()}${request.urgency.slice(1)}`)}</span>
                    </div>
                  </div>
                  {activeStatuses.includes(request.status) && <Button variant="outline" size="sm" disabled={actionRequestId === request.id} onClick={() => void handleCancel(request.id)} className="shrink-0 border-white/10 text-muted-foreground hover:text-red-400"><X className="me-1.5 h-4 w-4" />{t("ops.cancelRequest")}</Button>}
                </div>

                {request.offers?.length ? <div className="grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2">
                  {request.offers.map((offer) => (
                    <div key={offer.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-semibold text-foreground">{offer.service_centers?.name ?? t("screens.serviceCenter")}</p><p className="text-xs text-muted-foreground">{offer.service_centers?.service_type}</p></div>
                        <StatusBadge status={offer.status} />
                      </div>
                      <p className="mt-3 text-xl font-bold text-orange-300">{offer.currency} {Number(offer.price).toFixed(2)}</p>
                      {offer.message && <p className="mt-1 text-sm text-muted-foreground">{offer.message}</p>}
                      {offer.estimated_arrival_minutes !== null && <p className="mt-2 text-xs text-muted-foreground">{t("ops.estimatedArrival", { minutes: offer.estimated_arrival_minutes })}</p>}
                      {offer.status === "pending" && ["pending", "offered"].includes(request.status) && <Button size="sm" disabled={actionRequestId === offer.id} className="mt-3 bg-blue-600 text-white hover:bg-blue-500" onClick={() => void handleAcceptOffer(offer.id)}><Check className="me-1.5 h-4 w-4" />{t("ops.acceptOffer")}</Button>}
                    </div>
                  ))}
                </div> : request.status === "pending" || request.status === "offered" ? <p className="border-t border-white/10 pt-3 text-xs text-muted-foreground">{t("ops.waitingOffers")}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>{t("ops.createRequest")}</DialogTitle><DialogDescription>{t("ops.requestPrivacy")}</DialogDescription></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("ops.serviceType")}</Label><Select value={form.requestType} onValueChange={(value: RequestType) => setForm({ ...form, requestType: value })}><SelectTrigger aria-label={t("ops.serviceType")}><SelectValue /></SelectTrigger><SelectContent>{requestTypes.map((value) => <SelectItem key={value} value={value}>{t(`userRequests.${value}`)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>{t("ops.urgency")}</Label><Select value={form.urgency} onValueChange={(value: RequestUrgency) => setForm({ ...form, urgency: value })}><SelectTrigger aria-label={t("ops.urgency")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="emergency">{t("userRequests.urgencyEmergency")}</SelectItem><SelectItem value="urgent">{t("userRequests.urgencyUrgent")}</SelectItem><SelectItem value="normal">{t("userRequests.urgencyNormal")}</SelectItem><SelectItem value="scheduled">{t("userRequests.urgencyScheduled")}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="requestDescription">{t("ops.descriptionRequired")}</Label><Textarea id="requestDescription" required minLength={5} maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t("screens.descriptionPlaceholder")} /></div>
            <div className="space-y-2"><Label htmlFor="requestAddress">{t("screens.addressLabel")}</Label><Input id="requestAddress" maxLength={300} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder={t("screens.addressPlaceholder")} /></div>
            {vehicles.length > 0 && <div className="space-y-2"><Label>{t("screens.vehicleOptional")}</Label><Select value={form.vehicleId} onValueChange={(value) => setForm({ ...form, vehicleId: value })}><SelectTrigger aria-label={t("screens.vehicleOptional")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t("screens.noVehicle")}</SelectItem>{vehicles.map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ")} · {vehicle.plate_number}</SelectItem>)}</SelectContent></Select></div>}
            {form.urgency === "scheduled" && <div className="space-y-2"><Label htmlFor="scheduledAt">{t("screens.preferredTime")}</Label><Input id="scheduledAt" type="datetime-local" min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></div>}
            <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label>{t("screens.requestLocation")}</Label><Button type="button" variant="outline" size="sm" onClick={locate}><LocateFixed className="me-1.5 h-4 w-4" />{t("ops.locate")}</Button></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="requestLatitude" className="text-xs text-muted-foreground">{t("screens.latitude")}</Label><Input id="requestLatitude" type="number" step="any" required value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></div><div className="space-y-1"><Label htmlFor="requestLongitude" className="text-xs text-muted-foreground">{t("screens.longitude")}</Label><Input id="requestLongitude" type="number" step="any" required value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></div></div></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{t("ops.cancel")}</Button><Button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">{saving ? <LoaderCircle className="me-2 h-4 w-4 animate-spin" /> : <Plus className="me-2 h-4 w-4" />}{saving ? t("screens.sending") : t("ops.sendRequest")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}