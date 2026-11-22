import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ShoppingBag, LoaderCircle, Package, X } from "lucide-react";
import { toast } from "sonner";
import { getCustomerOrders, setOrderStatus, subscribeToCustomerOrders, type Order, type OrderStatus } from "../services/order-service";

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

export function UserOrdersPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setOrders(await getCustomerOrders(user.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return subscribeToCustomerOrders(user.id, () => {
      void refresh();
    });
  }, [user?.id, refresh]);

  const cancelOrder = async (order: Order) => {
    if (busyId) return;
    setBusyId(order.id);
    try {
      await setOrderStatus(order.id, "cancelled");
      setConfirmingId(null);
      toast.success(t("orders.cancelledToast"));
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("orders.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("orders.subtitle")}</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-white/10">
          <Link to="/user/catalog"><ShoppingBag className="me-2 h-4 w-4" />{t("orders.browseCatalog")}</Link>
        </Button>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">{t("orders.loading")}</div>
      ) : orders.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-14 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-blue-400" />
            <h2 className="text-lg font-semibold text-foreground">{t("orders.empty")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("orders.emptyDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const cancellable = order.status === "pending" || order.status === "accepted";
            return (
              <Card key={order.id} className="glass-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{t("orders.orderRef", { id: order.id.slice(0, 8) })}</p>
                      <p className="mt-1 font-semibold text-foreground">{order.service_centers?.name ?? t("orders.fromCenter")}</p>
                      <p className="text-xs text-muted-foreground">{order.service_centers?.service_type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={statusStyles[order.status]}>{t(statusKeys[order.status])}</Badge>
                      <span className="text-xs text-muted-foreground">{t("orders.placedAt", { date: formatDate(order.created_at) })}</span>
                    </div>
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
                    {cancellable && (confirmingId === order.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t("orders.confirmCancel")}</span>
                        <Button size="sm" variant="destructive" disabled={busyId === order.id} onClick={() => void cancelOrder(order)}>
                          {busyId === order.id ? <LoaderCircle className="me-1.5 h-4 w-4 animate-spin" /> : <X className="me-1.5 h-4 w-4" />}
                          {t("orders.cancel")}
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10" onClick={() => setConfirmingId(null)}>{t("common.cancel")}</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="border-red-500/20 text-red-300 hover:bg-red-500/10" onClick={() => setConfirmingId(order.id)}>
                        <X className="me-1.5 h-4 w-4" />{t("orders.cancel")}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserOrdersPage;