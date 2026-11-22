import { useCallback, useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Package, Pencil, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/auth-context";
import { supabase } from "../integrations/supabase/client";

type CatalogItem = { id: string; service_center_id: string; item_type: "service" | "part"; name: string; description: string; price: number; stock: number | null; unit: string | null; is_active: boolean };
const emptyForm = { name: "", description: "", price: "", stock: "", unit: "pcs" };

export function CatalogPage() {
  const { user } = useAuth();
  const [centerId, setCenterId] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [activeTab, setActiveTab] = useState<"service" | "part">("service");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data: center, error: centerError } = await supabase.from("service_centers").select("id").eq("owner_id", user.id).single();
    if (centerError) throw new Error(centerError.message);
    setCenterId(center.id);
    const { data, error } = await supabase.from("catalog_items").select("*").eq("service_center_id", center.id).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    setItems(data ?? []);
  }, [user?.id]);

  useEffect(() => { void load().catch((error: Error) => toast.error(error.message)).finally(() => setLoading(false)); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: CatalogItem) => { setEditing(item); setForm({ name: item.name, description: item.description, price: String(item.price), stock: String(item.stock ?? ""), unit: item.unit ?? "pcs" }); setDialogOpen(true); };

  const save = async () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!centerId || !form.name.trim() || !Number.isFinite(price) || price < 0 || (activeTab === "part" && (!Number.isInteger(stock) || stock < 0))) {
      toast.error("Enter a name, valid price, and valid stock quantity for parts.");
      return;
    }
    setSaving(true);
    const values = { service_center_id: centerId, item_type: activeTab, name: form.name.trim(), description: form.description.trim(), price, stock: activeTab === "part" ? stock : null, unit: activeTab === "part" ? form.unit.trim() || "pcs" : null };
    const result = editing
      ? await supabase.from("catalog_items").update(values).eq("id", editing.id).eq("service_center_id", centerId)
      : await supabase.from("catalog_items").insert(values);
    setSaving(false);
    if (result.error) { toast.error(result.error.message); return; }
    toast.success(editing ? "Catalog item updated." : "Catalog item added.");
    setDialogOpen(false);
    await load();
  };

  const toggleActive = async (item: CatalogItem) => {
    const { error } = await supabase.from("catalog_items").update({ is_active: !item.is_active }).eq("id", item.id).eq("service_center_id", centerId);
    if (error) { toast.error(error.message); return; }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_active: !entry.is_active } : entry));
    toast.success(item.is_active ? "Item archived." : "Item restored.");
  };

  const visibleItems = items.filter((item) => item.item_type === activeTab);
  if (user && !user.verified) return <Card className="glass-card border-amber-500/20"><CardContent className="p-6"><h1 className="text-2xl font-bold text-amber-200">Pending Verification</h1><p className="mt-2 text-sm text-muted-foreground">Catalog editing and publishing unlock after your service center is approved.</p><Button className="mt-4" variant="outline" onClick={() => window.location.assign("/dashboard/verification")}>Upload documents</Button></CardContent></Card>;
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold text-foreground">Catalog & Inventory</h1><p className="text-muted-foreground">Manage services and spare parts from your live catalog.</p></div><Button onClick={openAdd} disabled={!centerId} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"><Plus className="me-2 h-4 w-4" />Add {activeTab === "service" ? "Service" : "Part"}</Button></div>
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "service" | "part")}><TabsList className="grid w-full grid-cols-2 sm:w-auto"><TabsTrigger value="service" className="gap-2"><Wrench className="h-4 w-4" />Services</TabsTrigger><TabsTrigger value="part" className="gap-2"><Package className="h-4 w-4" />Parts</TabsTrigger></TabsList><TabsContent value={activeTab} className="mt-6">
      {loading ? <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">Loading catalog…</div> : visibleItems.length === 0 ? <Card className="glass-card"><CardContent className="py-12 text-center"><Package className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h2 className="font-semibold text-foreground">No {activeTab === "service" ? "services" : "parts"} yet</h2><p className="mt-2 text-sm text-muted-foreground">Create a live catalog entry to offer it to customers.</p></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleItems.map((item) => <Card key={item.id} className="glass-card"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-foreground">{item.name}</h2><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><Badge variant="outline" className={item.is_active ? "border-emerald-500/30 text-emerald-300" : "border-slate-500/30 text-slate-400"}>{item.is_active ? "Active" : "Archived"}</Badge></div><div className="mt-5 flex items-center justify-between"><span className="text-xl font-bold text-foreground">EGP {Number(item.price).toLocaleString()}</span>{item.item_type === "part" && <span className="text-sm text-muted-foreground">{item.stock} {item.unit}</span>}</div><div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => openEdit(item)}><Pencil className="me-2 h-4 w-4" />Edit</Button><Button variant="outline" onClick={() => void toggleActive(item)}>{item.is_active ? "Archive" : "Restore"}</Button></div></CardContent></Card>)}</div>}
    </TabsContent></Tabs>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-lg border-white/10 bg-slate-950 text-white"><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {activeTab === "service" ? "Service" : "Part"}</DialogTitle><DialogDescription className="text-slate-400">Changes are saved to your service center catalog.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="catalog-name">Name</Label><Input id="catalog-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={120} /></div><div className="space-y-2"><Label htmlFor="catalog-description">Description</Label><Textarea id="catalog-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="catalog-price">Price (EGP)</Label><Input id="catalog-price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>{activeTab === "part" && <><div className="space-y-2"><Label htmlFor="catalog-stock">Stock</Label><Input id="catalog-stock" type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="catalog-unit">Unit</Label><Input id="catalog-unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} maxLength={24} /></div></>}</div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button disabled={saving} onClick={() => void save()} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">{saving ? "Saving…" : editing ? "Save changes" : "Add item"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
