import { useState } from "react";
import { mockServices, mockParts, ServiceItem } from "../lib/mock-data";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Wrench, Package, Pencil, Trash2, Boxes } from "lucide-react";
import { toast } from "sonner";

export function CatalogPage() {
  const [services, setServices] = useState<ServiceItem[]>(mockServices);
  const [parts, setParts] = useState<ServiceItem[]>(mockParts);
  const [activeTab, setActiveTab] = useState("services");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "" });

  const isService = activeTab === "services";
  const items = isService ? services : parts;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", stock: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: ServiceItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      stock: item.stock !== undefined ? String(item.stock) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) {
      toast.error("Please fill in the name and price");
      return;
    }

    const base: ServiceItem = {
      id: editing?.id || `${isService ? "SVC" : "PRT"}-${Date.now()}`,
      name: form.name,
      category: isService ? "service" : "part",
      description: form.description,
      price: Number(form.price),
      active: true,
      ...(isService ? {} : { stock: Number(form.stock) || 0, unit: "pcs" }),
    };

    if (isService) {
      setServices((prev) =>
        editing ? prev.map((s) => (s.id === editing.id ? base : s)) : [...prev, base]
      );
    } else {
      setParts((prev) =>
        editing ? prev.map((p) => (p.id === editing.id ? base : p)) : [...prev, base]
      );
    }

    toast.success(editing ? "Item updated" : "Item added");
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (isService) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    } else {
      setParts((prev) => prev.filter((p) => p.id !== id));
    }
    toast.success("Item removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catalog & Inventory</h1>
          <p className="text-muted-foreground">Manage your services and spare parts</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {isService ? "Service" : "Part"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="services" className="gap-2">
            <Wrench className="h-4 w-4" />
            Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="parts" className="gap-2">
            <Package className="h-4 w-4" />
            Parts ({parts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {items.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Boxes className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first {isService ? "service" : "part"} to get started.
                </p>
                <Button onClick={openAdd} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add {isService ? "Service" : "Part"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="glass-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                          isService ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {isService ? <Wrench className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-foreground">
                        EGP {item.price.toLocaleString()}
                      </span>
                      {!isService && item.stock !== undefined && (
                        <Badge
                          variant="secondary"
                          className={item.stock < 10 ? "text-amber-500" : ""}
                        >
                          {item.stock} {item.unit}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} {isService ? "Service" : "Part"}
            </DialogTitle>
            <DialogDescription>
              {isService
                ? "Define a service you offer with its price."
                : "Add a spare part with stock quantity and price."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                placeholder={isService ? "e.g. Oil Change" : "e.g. Brake Pads Set"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Input
                id="item-desc"
                placeholder="Short description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price (EGP)</Label>
                <Input
                  id="item-price"
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              {!isService && (
                <div className="space-y-2">
                  <Label htmlFor="item-stock">Stock</Label>
                  <Input
                    id="item-stock"
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              {editing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}