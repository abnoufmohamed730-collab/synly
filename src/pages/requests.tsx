import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth-context";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Send, X, MapPin, Clock, Car, LoaderCircle, Play, CheckCircle, Navigation } from "lucide-react";
import { toast } from "sonner";
import { declineServiceRequest, getOwnCenter, getVendorOffers, getVendorRequests, submitRequestOffer, subscribeToCenterRequestChanges, transitionServiceRequest, type RequestOffer, type RequestStatus, type ServiceRequest } from "../services/request-service";

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "New" },
  { value: "offered", label: "Offered" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusStyle: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  offered: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  accepted: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  in_progress: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  completed: "border-green-400/30 bg-green-400/10 text-green-300",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

export function RequestsPage() {
  const { user } = useAuth();
  const [centerId, setCenterId] = useState<string | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [arrival, setArrival] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (currentCenterId?: string) => {
    if (!user) return;
    const [nextRequests, center] = await Promise.all([
      getVendorRequests(),
      currentCenterId ? Promise.resolve(null) : getOwnCenter(user.id),
    ]);
    const id = currentCenterId ?? center?.id;
    if (!id) {
      setRequests(nextRequests);
      setLoading(false);
      return;
    }
    setCenterId(id);
    setRequests(nextRequests);
    setOffers(await getVendorOffers(id));
    setLoading(false);
  }, [user?.id, user?.verified]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const center = await getOwnCenter(user.id);
        const [nextRequests, nextOffers] = await Promise.all([
          getVendorRequests(),
          center ? getVendorOffers(center.id) : Promise.resolve([]),
        ]);
        if (!active) return;
        setCenterId(center?.id ?? null);
        setRequests(nextRequests);
        setOffers(nextOffers);
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load requests.");
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

  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? null;
  const filteredRequests = useMemo(() => requests.filter((request) => selectedStatus === "all" || request.status === selectedStatus), [requests, selectedStatus]);
  const ownOfferByRequest = useMemo(() => new Map(offers.map((offer) => [offer.request_id, offer])), [offers]);

  if (user && !user.verified) return <Card className="glass-card border-amber-500/20"><CardContent className="p-6"><h1 className="text-2xl font-bold text-amber-200">Pending Verification</h1><p className="mt-2 text-sm text-muted-foreground">Customer requests and offer actions unlock after your center is approved.</p><Button className="mt-4" variant="outline" onClick={() => window.location.assign("/dashboard/verification")}>Upload documents</Button></CardContent></Card>;

  const handleSendOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest) return;
    const price = Number(offerPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid offer price.");
      return;
    }
    setSaving(true);
    try {
      await submitRequestOffer(selectedRequest.id, price, offerMessage, arrival ? Number(arrival) : null);
      await refresh(centerId ?? undefined);
      setSelectedRequestId(null);
      toast.success("Your offer was sent to the customer.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the offer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await declineServiceRequest(requestId);
      await refresh(centerId ?? undefined);
      setSelectedRequestId(null);
      toast.success("Request declined for your center.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not decline this request.");
    }
  };

  const handleTransition = async (requestId: string, status: "in_progress" | "completed") => {
    try {
      await transitionServiceRequest(requestId, status);
      await refresh(centerId ?? undefined);
      toast.success(status === "completed" ? "Job marked complete." : "Job started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update request status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Requests Management</h1><p className="text-muted-foreground">Respond to eligible customer requests and manage assigned jobs.</p></div>
        <Badge variant="outline" className="w-fit border-blue-400/20 bg-blue-400/10 text-blue-300"><span className="me-2 h-2 w-2 animate-pulse rounded-full bg-blue-400" />Live queue</Badge>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {statusTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl">{tab.label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={selectedStatus} className="mt-5">
          {loading ? <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">Loading request queue…</div> : filteredRequests.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-14 text-center"><Car className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h2 className="mb-2 text-lg font-semibold text-foreground">No requests found</h2><p className="text-muted-foreground">New matching requests will appear here when your center is online.</p></CardContent></Card>
          ) : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{filteredRequests.map((request) => {
            const ownOffer = ownOfferByRequest.get(request.id);
            return <Card key={request.id} className="glass-card"><CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted-foreground">Request {request.id.slice(0, 8)}</p><h2 className="mt-1 text-lg font-semibold capitalize text-foreground">{request.request_type.replace(/_/g, " ")}</h2></div><Badge variant="outline" className={statusStyle[request.status]}>{request.status.replace(/_/g, " ")}</Badge></div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{request.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Badge variant="secondary" className="capitalize">{request.urgency}</Badge><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(request.created_at).toLocaleString()}</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{request.address || `${request.latitude.toFixed(3)}, ${request.longitude.toFixed(3)}`}</span></div>
              {ownOffer && <div className="rounded-xl border border-blue-400/15 bg-blue-400/5 p-3 text-sm"><span className="font-semibold text-foreground">Your offer: {ownOffer.currency} {Number(ownOffer.price).toFixed(2)}</span><span className="ms-2 capitalize text-blue-300">{ownOffer.status}</span></div>}
              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                <Button variant="outline" size="sm" onClick={() => { setSelectedRequestId(request.id); setOfferPrice(""); setOfferMessage(""); setArrival(""); }}>View details</Button>
                {(["pending", "offered"].includes(request.status) && !ownOffer) && <Button size="sm" onClick={() => { setSelectedRequestId(request.id); setOfferPrice(""); setOfferMessage(""); setArrival(""); }} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"><Send className="me-1.5 h-4 w-4" />Send offer</Button>}
                {(["pending", "offered"].includes(request.status) && !ownOffer) && <Button variant="outline" size="sm" onClick={() => void handleDecline(request.id)} className="border-red-500/20 text-red-400 hover:bg-red-500/10"><X className="me-1 h-4 w-4" />Decline</Button>}
                {request.status === "accepted" && request.assigned_center_id === centerId && <Button size="sm" onClick={() => void handleTransition(request.id, "in_progress")} className="bg-blue-600 text-white hover:bg-blue-500"><Play className="me-1.5 h-4 w-4" />Start job</Button>}
                {request.status === "in_progress" && request.assigned_center_id === centerId && <Button size="sm" onClick={() => void handleTransition(request.id, "completed")} className="bg-green-600 text-white hover:bg-green-500"><CheckCircle className="me-1.5 h-4 w-4" />Complete job</Button>}
              </div>
            </CardContent></Card>;
          })}</div>}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequestId(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          {selectedRequest && <>
            <DialogHeader><DialogTitle className="capitalize">{selectedRequest.request_type.replace(/_/g, " ")} request</DialogTitle><DialogDescription>Request {selectedRequest.id.slice(0, 8)} · {new Date(selectedRequest.created_at).toLocaleString()}</DialogDescription></DialogHeader>
            <div className="space-y-4"><div className="flex flex-wrap gap-2"><Badge variant="outline" className={statusStyle[selectedRequest.status]}>{selectedRequest.status.replace(/_/g, " ")}</Badge><Badge variant="secondary" className="capitalize">{selectedRequest.urgency}</Badge>{selectedRequest.scheduled_at && <Badge variant="secondary">Scheduled {new Date(selectedRequest.scheduled_at).toLocaleString()}</Badge>}</div><p className="whitespace-pre-wrap text-sm text-foreground">{selectedRequest.description}</p><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="flex items-center gap-2 text-sm font-medium text-foreground"><MapPin className="h-4 w-4 text-blue-400" />{selectedRequest.address || "Request location"}</p><p className="mt-1 text-xs text-muted-foreground">{selectedRequest.latitude}, {selectedRequest.longitude}</p><a className="mt-2 inline-flex items-center text-xs text-blue-300 hover:text-blue-200" href={`https://www.openstreetmap.org/?mlat=${selectedRequest.latitude}&mlon=${selectedRequest.longitude}#map=16/${selectedRequest.latitude}/${selectedRequest.longitude}`} target="_blank" rel="noreferrer"><Navigation className="me-1.5 h-3.5 w-3.5" />Open map</a></div>
              {selectedRequest.status === "pending" || selectedRequest.status === "offered" ? ownOfferByRequest.has(selectedRequest.id) ? <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 text-sm text-blue-200">You have already sent an offer for this request.</div> : <form onSubmit={handleSendOffer} className="space-y-3 border-t border-white/10 pt-4"><h3 className="font-semibold text-foreground">Send a price offer</h3><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="offerPrice">Offer price (EGP)</Label><Input id="offerPrice" type="number" min="0.01" step="0.01" required value={offerPrice} onChange={(event) => setOfferPrice(event.target.value)} placeholder="Enter amount" /></div><div className="space-y-2"><Label htmlFor="offerArrival">Estimated arrival (minutes)</Label><Input id="offerArrival" type="number" min="0" max="1440" value={arrival} onChange={(event) => setArrival(event.target.value)} placeholder="Optional" /></div></div><div className="space-y-2"><Label htmlFor="offerMessage">Message (optional)</Label><Textarea id="offerMessage" value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} placeholder="What is included in your offer?" /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setSelectedRequestId(null)}>Close</Button><Button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">{saving && <LoaderCircle className="me-2 h-4 w-4 animate-spin" />}Send offer</Button></DialogFooter></form> : null}
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
