import { useEffect, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { supabase } from "../../integrations/supabase/client";
import { fetchProfileSnapshot, savePreferences, saveVehicleAndContact } from "../../services/profile-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Home, Car, Save } from "lucide-react";
import { toast } from "sonner";

export function UserProfileForm() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", carModel: "", plate: "", emergencyName: "", emergencyPhone: "" });
  const [radius, setRadius] = useState("15");
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    fetchProfileSnapshot(user.id).then((snapshot) => {
      if (!active) return;
      const vehicle = snapshot.vehicles[0];
      const contact = snapshot.emergencyContacts[0];
      setForm({
        name: snapshot.profile.display_name ?? "",
        phone: snapshot.profile.phone_e164 ?? "",
        email: user.email,
        carModel: vehicle?.model ?? "",
        plate: vehicle?.plate_number ?? "",
        emergencyName: contact?.name ?? "",
        emergencyPhone: contact?.phone_e164 ?? "",
      });
      setRadius(String(snapshot.preferences?.alert_radius_km ?? 15));
      setNotifications(snapshot.preferences?.notifications_enabled ?? true);
    }).catch((error: Error) => {
      toast.error(error.message || "Could not load your profile.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser({ businessName: form.name, phone: form.phone });
      if (form.email.trim() !== user.email) {
        const callbackUrl = new URL("/auth/callback", window.location.origin).href;
        const { error } = await supabase.auth.updateUser({ email: form.email.trim() }, { emailRedirectTo: callbackUrl });
        if (error) throw error;
        toast.success("Confirm the email change using the message sent to your new address.");
      } else {
        toast.success("Profile updated successfully.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveVehicle = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveVehicleAndContact(user.id, {
        model: form.carModel,
        plateNumber: form.plate,
        emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone,
      });
      toast.success("Vehicle and emergency contact saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save vehicle details.");
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationPreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePreferences(user.id, { alertRadius: Number(radius), notificationsEnabled: notifications });
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal info and vehicle</p>
      </div>

      {loading ? <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">Loading your profile…</div> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5 text-primary" />Personal Information</CardTitle>
                <CardDescription>Update your contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <Button disabled={saving} onClick={saveProfile} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"><Save className="h-4 w-4 me-2" />{saving ? "Saving…" : "Save Changes"}</Button>
              </CardContent>
            </Card>

            <Card className="glass-card h-fit">
              <CardHeader><CardTitle className="flex items-center gap-2"><Car className="h-5 w-5 text-primary" />My Vehicle</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label htmlFor="vehicleModel">Car Model</Label><Input id="vehicleModel" value={form.carModel} onChange={(e) => setForm({ ...form, carModel: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="plateNumber">Plate Number</Label><Input id="plateNumber" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="emergencyContact">Emergency Contact</Label><Input id="emergencyContact" value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} placeholder="Contact name" /></div>
                <div className="space-y-2"><Label htmlFor="emergencyPhone">Emergency Phone</Label><Input id="emergencyPhone" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} /></div>
                <Button variant="outline" className="w-full" disabled={saving} onClick={saveVehicle}><Save className="h-4 w-4 me-2" />{saving ? "Saving…" : "Save Vehicle"}</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader><CardTitle>Alert Radius</CardTitle><CardDescription>Set the radius for nearby service alerts</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Distance Radius</Label><div className="flex items-center gap-3"><input type="range" min="1" max="50" value={radius} onChange={(e) => setRadius(e.target.value)} className="flex-1 accent-orange-500" /><span className="w-16 text-sm font-medium text-foreground">{radius} km</span></div><p className="text-xs text-muted-foreground">You'll receive alerts from centers within {radius} km.</p></div>
                <Button disabled={saving} onClick={saveNotificationPreferences} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"><Save className="h-4 w-4 me-2" />Save Radius</Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Manage your notification preferences</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-foreground">Push Notifications</p><p className="text-xs text-muted-foreground">Receive alerts for request updates</p></div><Switch checked={notifications} onCheckedChange={setNotifications} /></div>
                <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-foreground">Email Notifications</p><p className="text-xs text-muted-foreground">Get updates via email</p></div><Switch checked={notifications} onCheckedChange={setNotifications} /></div>
                <Button disabled={saving} onClick={saveNotificationPreferences} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"><Save className="h-4 w-4 me-2" />Save Preferences</Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
