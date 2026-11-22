import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, Package, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { supabase } from "../integrations/supabase/client";

type OrderItem = { id: string; name_snapshot: string; quantity: number; line_total: number };
type Order = { id: string; customer_id: string; service_center_id: string; status: string; total: number; created_at: string; service_centers?: { name: string } | null; order_items: OrderItem[] };

const statusClasses: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  accepted: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  rejected: "border-red-400/30 bg-red-400/10 text-red-300",
  fulfilled: "border-green-400/30 bg-green-400/10 text-green-300",
};

export function OrdersPage({ vendor = false }: { vendor?: boolean }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let centerId: string | null = null;
      if (vendor) {
        const { data: center, error: centerError } = await supabase.from("service_centers").select("id").eq("owner_id", user.id).maybeSingle();
        if (centerError) throw centerError;
        centerId = center?.id ?? null;
      }
      let query = supabase.from("orders").select("id,customer_id,service_center_id,status,total,created_at,service_centers(name),order_items(id,name_snapshot,quantity,line_total)").order("created_at", { ascending: false });
      if (vendor && centerId) query = query.eq("service_center_id", centerId);
      else if (!vendor) query = query.eq("customer_id", user.id);
      else { setOrders([]); return; }
      const { data, error } = await query;
      if (error) throw error;
      setOrders((data ?? []) as unknown as Order[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [user, vendor, t]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const transition = async (order: Order, status: "accepted" | "rejected" | "fulfilled") => {
    if (!window.confirm(t("orders.confirmStatus", { status: t(`orders.status.${status}`) }))) return;
    setBusy(order.id);
    try {
      const { error } = await supabase.rpc("transition_catalog_order", { p_order_id: order.id, p_to_status: status });
      if (error) throw error;
      toast.success(t("orders.statusUpdated"));
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.updateFailed"));
    } finally {
      setBusy(null);
    }
  };

  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">{t("orders.eyebrow")}</p><h1 className="mt-2 text-3xl font-bold text-foreground">{vendor ? t("orders.vendorTitle") : t("orders.customerTitle")}</h1><p className="mt-2 text-muted-foreground">{vendor ? t("orders.vendorDescription") : t("orders.customerDescription")}</p></header>
    {loading ? <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">{t("orders.loading")}</div> : orders.length === 0 ? <Card className="glass-card"><CardContent className="py-14 text-center"><Package className="mx-auto mb-4 h-10 w-10 text-blue-300" /><p className="font-semibold text-foreground">{t("orders.empty")}</p></CardContent></Card> : <div className="space-y-4">
      {orders.map((order) => <Card key={order.id} className="glass-card"><CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted-foreground">{t("orders.orderNumber", { id: order.id.slice(0, 8) })}</p><p className="mt-1 font-semibold text-foreground">{vendor ? t("orders.customerOrder") : order.service_centers?.name ?? t("screens.serviceCenter")}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p></div><Badge variant="outline" className={statusClasses[order.status] ?? statusClasses.pending}>{t(`orders.status.${order.status}`)}</Badge></div>
        <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] px-4">{order.order_items?.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="text-foreground">{item.name_snapshot} <span className="text-muted-foreground">× {item.quantity}</span></span><span className="shrink-0 text-muted-foreground">{t("common.egp")} {Number(item.line_total).toLocaleString()}</span></div>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><p className="text-sm text-muted-foreground">{t("orders.paymentOffline")}</p><p className="text-lg font-bold text-foreground">{t("common.egp")} {Number(order.total).toLocaleString()}</p></div>
        {vendor && order.status === "pending" && <div className="flex flex-wrap gap-2"><Button disabled={busy === order.id} onClick={() => void transition(order, "accepted")} className="bg-blue-600 text-white">{busy === order.id ? <LoaderCircle className="me-2 h-4 w-4 animate-spin" /> : <Check className="me-2 h-4 w-4" />}{t("orders.accept")}</Button><Button disabled={busy === order.id} variant="outline" onClick={() => void transition(order, "rejected")} className="border-red-400/30 text-red-300"><X className="me-2 h-4 w-4" />{t("orders.reject")}</Button></div>}
        {vendor && order.status === "accepted" && <Button disabled={busy === order.id} onClick={() => void transition(order, "fulfilled")} className="bg-green-600 text-white">{busy === order.id ? <LoaderCircle className="me-2 h-4 w-4 animate-spin" /> : <Check className="me-2 h-4 w-4" />}{t("orders.markFulfilled")}</Button>}
      </CardContent></Card>)}
    </div>}
  </div>;
}

export function CustomerOrdersPage() { return <OrdersPage />; }
export function VendorOrdersPage() { return <OrdersPage vendor />; }
export default OrdersPage;
