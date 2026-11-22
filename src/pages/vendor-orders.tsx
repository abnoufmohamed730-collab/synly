import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Check, LoaderCircle, Package, X, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { getOwnCenter } from "../services/request-service";
import { getVendorOrders, setOrderStatus, subscribeToVendorOrders, type Order, type OrderStatus } from "../services/order-service";

const statusStyles: Record<OrderStatus, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  accepted: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  rejected: "border-red-400/30 bg-red-400/10 text-red-300",
  fulfilled: "border-green-400/30 bg-green-400/10 text-green-300",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

const statusKeys: Record<OrderStatus, string> = {
  pending: "orders.statusPending",
  accepted: "orders.statusAccepted",
  rejected: "orders.statusRejected",
  fulfilled: "orders.statusFulfilled",
  cancelled: "orders.statusCancelled",
};

export function VendorOrdersPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [centerId, setCenterId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
      if (!user) return;
      let active = true;
      void getOwnCenter(user.id).then((center) => {
        if (!active) return;
        setCenterId(center?.id ?? null);
        setLoading(false);
      });
      return () => { active = false; };
    }, [user?.id]);
  
    const refresh = useCallback(async () => {
      if (!centerId) return;
      try {
        setOrders(await getVendorOrders(centerId));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("orders.loadFailed"));
      } finally {
        setLoading(false);
      }
    }, [centerId, t]);
  
    useEffect(() => {
      void refresh();
    }, [refresh]);
  
    useEffect(() => {
      if (!centerId) return;
      return subscribeToVendorOrders(centerId, () => {
        void refresh();
      });
    }, [centerId, refresh]);

  const updateStatus = async (order: Order, status: OrderStatus, successKey: string) => {
    if (busyId) return;
    setBusyId(order.id);
    try {
      await setOrderStatus(order.id, status);
      toast.success(t(successKey));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.actionFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (value: string) => new Date(value).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t("orders.vendorTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("orders.vendorSubtitle")}</p>
      </div>

      {!centerId && !loading && (
        <Card className="glass-card border-amber-500/20"><CardContent className="p-4 text-sm text-amber-200">{t("screens.notLinkedCenter")}</CardContent></Card>
      )}

      {loading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">{t("orders.loading")}</div>
      ) : centerId && orders.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-14 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-blue-400" />
            <h2 className="text-lg font-semibold text-foreground">{t("orders.vendorEmpty")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("orders.vendorEmptyDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="glass-card">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{t("orders.orderRef", { id: order.id.slice(0, 8) })}</p>
                    <p className="mt-1 font-semibold text-foreground">{t("orders.itemCount", { count: order.items?.length ?? 0 })}</p>
                    <p className="text-xs text-muted-foreground">{t("orders.placedAt", { date: formatDate(order.created_at) })}</p>
                  </div>
                  <Badge variant="outline" className={statusStyles[order.status]}>{t(statusKeys[order.status])}</Badge>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-3">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{item.name_snapshot}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.item_type === "service" ? t("screens.itemService") : t("screens.itemPart")} · {item.quantity} × {t("common.egp")} {Number(item.unit_price).toLocaleString()}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold text-foreground">{t("common.egp")} {Number(item.line_total).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="text-muted-foreground">{t("orders.total")}: <span className="text-lg font-bold text-foreground">{t("common.egp")} {Number(order.total).toLocaleString()}</span></p>
                    <p className="text-xs text-muted-foreground">{t("orders.payOffline")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.status === "pending" && (
                      <>
                        <Button size="sm" disabled={busyId === order.id} onClick={() => void updateStatus(order, "accepted", "orders.acceptedToast")} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                          {busyId === order.id ? <LoaderCircle className="me-1.5 h-4 w-4 animate-spin" /> : <Check className="me-1.5 h-4 w-4" />}
                          {t("orders.accept")}
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyId === order.id} onClick={() => void updateStatus(order, "rejected", "orders.rejectedToast")} className="border-red-500/20 text-red-300 hover:bg-red-500/10">
                          <X className="me-1.5 h-4 w-4" />{t("orders.reject")}
                        </Button>
                      </>
                    )}
                    {order.status === "accepted" && (
                      <Button size="sm" disabled={busyId === order.id} onClick={() => void updateStatus(order, "fulfilled", "orders.fulfilledToast")} className="bg-green-600 text-white hover:bg-green-500">
                        {busyId === order.id ? <LoaderCircle className="me-1.5 h-4 w-4 animate-spin" /> : <PackageCheck className="me-1.5 h-4 w-4" />}
                        {t("orders.fulfil")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("orders.stockNote")}</p>
    </div>
  );
}

export default VendorOrdersPage;