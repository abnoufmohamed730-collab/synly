import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Pencil, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";
import { getOwnCenter } from "../services/request-service";

type Item = {
  id: string;
  service_center_id: string;
  item_type: "service" | "part";
  name: string;
  description: string;
  price: number;
  stock: number | null;
  unit: string | null;
  is_active: boolean;
};

const emptyForm = { name: "", description: "", price: "", stock: "", unit: "pcs" };

export function CatalogPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [centerId, setCenterId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"service" | "part">("service");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!user) return;
    const center = await getOwnCenter(user.id);
    if (!center) {
      setCenterId(null);
      setItems([]);
      setLoading(false);
      return;
    }
    setCenterId(center.id);
    const { data, error } = await supabase
      .from("catalog_items")
      .select("id,service_center_id,item_type,name,description,price,stock,unit,is_active")
      .eq("service_center_id", center.id)
      .order("item_type")
      .order("name");
    if (error) toast.error(t("screens.catalogSaveFailed"));
    setItems((data ?? []) as Item[]);
    setLoading(false);
  }, [user?.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description ?? "", price: String(item.price), stock: String(item.stock ?? ""), unit: item.unit ?? "pcs" });
    setDialogOpen(true);
  };

  const save = async () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!centerId || !form.name.trim() || !Number.isFinite(price) || price < 0 || (tab === "part" && (!Number.isInteger(stock) || stock < 0))) {
      toast.error(t("ops.enterCatalogFields"));
      return;
    }
    setSaving(true);
    const values = {
      service_center_id: centerId,
      item_type: tab,
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      stock: tab === "part" ? stock : null,
      unit: tab === "part" ? form.unit.trim() || "pcs" : null,
    };
    const result = editing
      ? await supabase.from("catalog_items").update(values).eq("id", editing.id).eq("service_center_id", centerId)
      : await supabase.from("catalog_items").insert(values);
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message || t("screens.catalogSaveFailed"));
      return;
    }
    toast.success(editing ? t("ops.catalogUpdated") : t("ops.catalogAdded"));
    setDialogOpen(false);
    await load();
  };

  const toggleActive = async (item: Item) => {
    const { error } = await supabase
      .from("catalog_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id)
      .eq("service_center_id", centerId ?? "");
    if (error) {
      toast.error(error.message || t("screens.updateFailed"));
      return;
    }
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, is_active: !entry.is_active } : entry)));
    toast.success(item.is_active ? t("screens.itemArchived") : t("screens.itemRestored"));
  };

  const filtered = useMemo(() => items.filter((item) => item.item_type === tab), [items, tab]);
  const title = editing ? t("ops.edit") : tab === "service" ? t("ops.addService") : t("ops.addPart");

  if (!loading && !centerId) {
    return (
      <Card className="glass-card border-amber-500/20">
        <CardContent className="p-6 text-sm text-amber-200">{t("screens.notLinkedCenter")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t("ops.catalogTitle")}</h1>
        <p className="text-muted-foreground">{t("ops.catalogDesc")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as "service" | "part")}>
          <TabsList>
            <TabsTrigger value="service">{t("ops.services")}</TabsTrigger>
            <TabsTrigger value="part">{t("ops.parts")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openAdd} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600">
          <Plus className="me-2 h-4 w-4" />{tab === "service" ? t("ops.addService") : t("ops.addPart")}
        </Button>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">{t("ops.loadingCatalog")}</div>
      ) : filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-14 text-center">
            <Wrench className="mx-auto mb-4 h-11 w-11 text-muted-foreground" />
            <p className="font-semibold text-foreground">{tab === "service" ? t("ops.noServices") : t("ops.noParts")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("ops.createListing")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="glass-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={item.item_type === "service" ? "border-emerald-500/30 text-emerald-300" : "border-slate-500/30 text-slate-400"}>
                    {item.item_type === "service" ? t("screens.itemService") : t("screens.itemPart")}
                  </Badge>
                  <Badge variant="outline" className={item.is_active ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-slate-500/30 bg-slate-500/10 text-slate-300"}>
                    {item.is_active ? t("ops.active") : t("ops.archived")}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="min-h-10 text-sm text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-foreground">{t("common.egp")} {Number(item.price).toLocaleString()}</span>
                  {item.item_type === "part" && <span className="text-sm text-muted-foreground">{t("screens.stockAvailableShort", { stock: item.stock ?? 0, unit: item.unit ?? "" })}</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openEdit(item)}>
                    <Pencil className="me-2 h-4 w-4" />{t("ops.edit")}
                  </Button>
                  <Button variant="outline" onClick={() => void toggleActive(item)}>
                    {item.is_active ? t("ops.archive") : t("ops.restore")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{t("ops.catalogChanges")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catalogName">{t("ops.name")}</Label>
              <Input id="catalogName" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalogDescription">{t("ops.description")}</Label>
              <Textarea id="catalogDescription" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="catalogPrice">{t("ops.price")}</Label>
                <Input id="catalogPrice" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
              </div>
              {tab === "part" && (
                <div className="space-y-2">
                  <Label htmlFor="catalogStock">{t("ops.stock")}</Label>
                  <Input id="catalogStock" type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
                </div>
              )}
            </div>
            {tab === "part" && (
              <div className="space-y-2">
                <Label htmlFor="catalogUnit">{t("ops.unit")}</Label>
                <Input id="catalogUnit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("ops.cancel")}</Button>
            <Button disabled={saving} onClick={() => void save()} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              {saving ? t("screens.saving") : editing ? t("ops.saveChanges") : t("ops.addItem")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}