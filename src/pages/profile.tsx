import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { UserProfileForm } from "../components/profile/UserProfileForm";
import { fetchProfileSnapshot, savePreferences as savePreferencesToDatabase } from "../services/profile-service";
import { supabase } from "../integrations/supabase/client";
import { mockMechanics, Mechanic } from "../lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Save, MapPin, Clock, Users, Plus, Pencil, Trash2, Phone, Mail, ShieldCheck, Car, Home } from "lucide-react";
import { toast } from "sonner";

export function ProfilePage() {
  const { mode } = useAuth();
  return mode === "vendor" ? <VendorProfile /> : <UserProfile />;
}

function UserProfile() {
  return <UserProfileForm />;
}

function VendorProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    businessName: user?.businessName || "",
    serviceType: user?.serviceType || "",
    location: user?.location || "",
    operatingHours: user?.operatingHours || "",
    email: user?.email || "",
    phone: String(user?.phoneNumbers || ""),
    about: user?.description || "",
  });
  const [mechanics, setMechanics] = useState<Mechanic[]>(mockMechanics);
  const [radius, setRadius] = useState("25");
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMechanic, setEditMechanic] = useState<Mechanic | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newMechanic, setNewMechanic] = useState({ name: "", specialization: "", phone: "", email: "" });

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    fetchProfileSnapshot(user.id).then((snapshot) => {
      if (!active) return;
      const center = snapshot.serviceCenter;
      setForm({
        businessName: center?.name ?? "",
        serviceType: center?.service_type ?? "",
        location: center?.address ?? (center ? `${center.latitude}, ${center.longitude}` : ""),
        operatingHours: snapshot.hours[0]?.hours_text ?? "",
        email: user.email,
        phone: center?.phone_e164 ?? "",
        about: center?.description ?? "",
      });
      setRadius(String(snapshot.preferences?.alert_radius_km ?? 25));
      setNotifications(snapshot.preferences?.notifications_enabled ?? true);
    }).catch((error: Error) => {
      toast.error(error.message || "Could not load your business profile.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser({
        businessName: form.businessName,
        serviceType: form.serviceType,
        description: form.about,
        location: form.location,
        operatingHours: form.operatingHours,
        phoneNumbers: form.phone,
      });
      if (form.email.trim() !== user.email) {
        const callbackUrl = new URL("/auth/callback", window.location.origin).href;
        const { error } = await supabase.auth.updateUser({ email: form.email.trim() }, { emailRedirectTo: callbackUrl });
        if (error) throw error;
        toast.success("Confirm the email change using the message sent to your new address.");
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your business profile.");
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePreferencesToDatabase(user.id, { alertRadius: Number(radius), notificationsEnabled: notifications });
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMechanic = () => {
    if (!newMechanic.name || !newMechanic.phone) {
      toast.error("Name and phone are required");
      return;
    }
    const mechanic: Mechanic = {
      id: `MEC-${String(mechanics.length + 1).padStart(3, "0")}`,
      ...newMechanic,
      active: true,
    };
    setMechanics([...mechanics, mechanic]);
    setNewMechanic({ name: "", specialization: "", phone: "", email: "" });
    setAddOpen(false);
    toast.success("Team member added");
  };

  const handleEditMechanic = (mechanic: Mechanic) => {
    setEditMechanic(mechanic);
    setEditOpen(true);
  };

  const handleUpdateMechanic = () => {
    if (!editMechanic) return;
    setMechanics(mechanics.map((m) => (m.id === editMechanic.id ? editMechanic : m)));
    setEditOpen(false);
    setEditMechanic(null);
    toast.success("Team member updated");
  };

  const handleDeleteMechanic = (id: string) => {
    setMechanics(mechanics.filter((m) => m.id !== id));
    toast.success("Team member removed");
  };

  const handleToggleMechanic = (id: string) => {
    setMechanics(mechanics.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Business Profile</h1>
        <p className="text-muted-foreground">{loading ? "Loading your business profile…" : "Manage your service center information and team"}</p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your service center details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={form.serviceType} onValueChange={(v) => setForm({ ...form, serviceType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mechanical Repair">Mechanical Repair</SelectItem>
                      <SelectItem value="Auto Electric">Auto Electric</SelectItem>
                      <SelectItem value="Spare Parts Shop">Spare Parts Shop</SelectItem>
                      <SelectItem value="Towing/Roadside Assistance">Towing/Roadside Assistance</SelectItem>
                      <SelectItem value="Gas Station">Gas Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Operating Hours</Label>
                  <Input id="hours" value={form.operatingHours} onChange={(e) => setForm({ ...form, operatingHours: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea id="about" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} />
              </div>

              <Button
                disabled={loading || saving}
                onClick={handleSave}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Save className="h-4 w-4 me-2" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{user?.verified ? "Verified Business" : "Verification pending"}</p>
                  <p className="text-sm text-muted-foreground">{user?.verified ? "Your business has been verified by Synly" : "Your center is awaiting review by Synly"}</p>
                </div>
                <Badge className={`ml-auto border ${user?.verified ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`} variant="outline">
                  {user?.verified ? "Verified" : "Pending review"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your mechanics and staff</CardDescription>
              </div>
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Plus className="h-4 w-4 me-2" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mechanics.map((mechanic) => (
                  <div key={mechanic.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{mechanic.name}</p>
                        <p className="text-xs text-muted-foreground">{mechanic.specialization}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={mechanic.active} onCheckedChange={() => handleToggleMechanic(mechanic.id)} />
                      <Button variant="outline" size="icon" onClick={() => handleEditMechanic(mechanic)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteMechanic(mechanic.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Alert Radius</CardTitle>
              <CardDescription>Set the radius for incoming request alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Distance Radius</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="text-sm font-medium text-foreground w-16">{radius} km</span>
                </div>
                <p className="text-xs text-muted-foreground">You'll receive alerts from customers within {radius} km.</p>
              </div>
              <Button
                disabled={loading || saving}
                onClick={savePreferences}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Save className="h-4 w-4 me-2" />
                {saving ? "Saving…" : "Save Radius"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive alerts for new requests</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Get updates via email</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <Button
                disabled={loading || saving}
                onClick={savePreferences}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Save className="h-4 w-4 me-2" />
                {saving ? "Saving…" : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Mechanic Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new mechanic or staff member to your team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={newMechanic.name} onChange={(e) => setNewMechanic({ ...newMechanic, name: e.target.value })} placeholder="e.g. Ahmed Hassan" />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input value={newMechanic.specialization} onChange={(e) => setNewMechanic({ ...newMechanic, specialization: e.target.value })} placeholder="e.g. Engine Repair" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={newMechanic.phone} onChange={(e) => setNewMechanic({ ...newMechanic, phone: e.target.value })} placeholder="+20 100 123 4567" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newMechanic.email} onChange={(e) => setNewMechanic({ ...newMechanic, email: e.target.value })} placeholder="email@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMechanic} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mechanic Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update team member information.</DialogDescription>
          </DialogHeader>
          {editMechanic && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editMechanic.name} onChange={(e) => setEditMechanic({ ...editMechanic, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input value={editMechanic.specialization} onChange={(e) => setEditMechanic({ ...editMechanic, specialization: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editMechanic.phone} onChange={(e) => setEditMechanic({ ...editMechanic, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editMechanic.email} onChange={(e) => setEditMechanic({ ...editMechanic, email: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateMechanic} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}