import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Minus, Package, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/language-context";
import { supabase } from "../integrations/supabase/client";

type Center = { id: string; name: string; service_type: string };
type Item = { id: string; service_center_id: string; item_type: "service" | "part"; name: string; description: string; price: number; stock: number | null; unit: string | null };

export function UserCatalogPage() {
  const { t } = useLanguage();
  const [centers, setCenters] = useState<Center[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [centerId, setCenterId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("service_centers").select("id,name,service_type").eq("verification_status", "approved").order("name").then(({ data, error }) => {
      if (error) toast.error(t("screens.centersLoadError"));
      const available = data ?? [];
      setCenters(available);
      if (available[0]) setCenterId(available[0].id);
    }).finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (!centerId) { setItems([]); return; }
    let active = true;
    void supabase.from("catalog_items").select("id,service_center_id,item_type,name,description,price,stock,unit").eq("service_center_id", centerId).eq("is_active", true).order("item_type").order("name").then(({ data, error }) => {
      if (!active) return;
      if (error) { toast.error(t("screens.catalogLoadError")); return; }
      setItems(data ?? []);
      setQuantities({});
    });
    return () => { active = false; };
  }, [centerId, t]);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * (quantities[item.id] ?? 0), 0), [items, quantities]);
  const setQuantity = (item: Item, value: number) => setQuantities((current) => ({ ...current, [item.id]: Math.max(0, Math.min(item.item_type === "part" ? item.stock ?? 0 : 99, value)) }));

  const submitOrder = async () => {
    const lines = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([item_id, quantity]) => ({ item_id, quantity }));
    if (!lines.length || !centerId) { toast.error(t("ops.chooseItem")); return; }
    setOrdering(true);
    const { data, error } = await supabase.rpc("create_catalog_order", { p_service_center_id: centerId, p_items: lines });
    setOrdering(false);
    if (error) { toast.error(error.message); return; }
    setLastOrderId(data);
    setQuantities({});
    toast.success(t("ops.orderPlaced"));
  };

  const services = items.filter((item) => item.item_type === "service");
  const parts = items.filter((item) => item.item_type === "part");
  const groups = [{ title: t("ops.services"), rows: services }, { title: t("ops.parts"), rows: parts }];

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">{t("ops.marketplace")}</p><h1 className="mt-2 text-3xl font-bold text-foreground">{t("ops.userCatalogTitle")}</h1><p className="mt-2 text-muted-foreground">{t("ops.userCatalogDesc")}</p></div>
    <div className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-foreground">{t("ops.chooseCenter")}</p><p className="text-sm text-muted-foreground">{t("ops.oneCenterOrder")}</p></div>
      <Select value={centerId} onValueChange={setCenterId}><SelectTrigger className="glass-input w-full sm:w-80"><SelectValue placeholder={t("ops.selectCenter")} /></SelectTrigger><SelectContent>{centers.map((center) => <SelectItem key={center.id} value={center.id}>{center.name} · {center.service_type}</SelectItem>)}</SelectContent></Select></div>
    {loading ? <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">{t("ops.loadingMarketplace")}</div> : centers.length === 0 ? <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">{t("ops.noApprovedCenters")}</CardContent></Card> : items.length === 0 ? <Card className="glass-card"><CardContent className="py-12 text-center"><Package className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><p className="font-semibold text-foreground">{t("ops.catalogComing")}</p><p className="mt-2 text-sm text-muted-foreground">{t("ops.noActiveListings")}</p></CardContent></Card> : <div className="space-y-7">{groups.map(({ title, rows }) => rows.length > 0 && <section key={title}><h2 className="mb-3 text-xl font-semibold text-foreground">{title}</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((item) => <Card key={item.id} className="glass-card"><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="border-blue-400/30 text-blue-300">{item.item_type === "service" ? t("screens.itemService") : t("screens.itemPart")}</Badge>{item.item_type === "part" && <span className="text-xs text-muted-foreground">{t("screens.stockAvailable", { stock: item.stock ?? 0, unit: item.unit ?? "" })}</span>}</div><h3 className="mt-3 font-semibold text-foreground">{item.name}</h3><p className="mt-1 min-h-10 text-sm text-muted-foreground">{item.description}</p><div className="mt-4 flex items-center justify-between"><span className="text-xl font-bold text-foreground">{t("common.egp")} {Number(item.price).toLocaleString()}</span>{item.item_type === "part" && <span className="text-sm text-muted-foreground">{t("screens.stockAvailable", { stock: item.stock ?? 0, unit: item.unit ?? "" })}</span>}</div><div className="mt-4 flex gap-2"><Button variant="outline" size="icon" aria-label={t("screens.removeOne", { name: item.name })} disabled={!quantities[item.id]} onClick={() => setQuantity(item, (quantities[item.id] ?? 0) - 1)}><Minus className="h-4 w-4" /></Button><span className="min-w-5 text-center text-sm text-white">{quantities[item.id] ?? 0}</span><Button variant="outline" size="icon" aria-label={t("screens.addOne", { name: item.name })} disabled={item.item_type === "part" && (quantities[item.id] ?? 0) >= (item.stock ?? 0)} onClick={() => setQuantity(item, (quantities[item.id] ?? 0) + 1)}><Plus className="h-4 w-4" /></Button></div></CardContent></Card>)}</div></section>)}</div>
    {total > 0 && <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[min(42rem,calc(100%-2rem))] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl"><div><p className="text-xs text-slate-400">{t("ops.serverChecks")}</p><p className="font-bold text-white">{t("ops.estimatedTotal", { total: total.toLocaleString() })}</p></div><Button disabled={ordering} onClick={() => void submitOrder()} className="bg-gradient-to-r from-blue-600 to-orange-500 text-white"><ShoppingBag className="me-2 h-4 w-4" />{ordering ? t("ops.placing") : t("ops.placeOrder")}</Button></div>}
    {lastOrderId && <p className="text-sm text-emerald-300">{t("screens.latestOrder", { id: lastOrderId.slice(0, 8) })}</p>}
  </div>;
}