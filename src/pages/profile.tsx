import { useState } from "react";
import { useAuth } from "../context/auth-context";
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
import { Save, MapPin, Clock, Users, Plus, Pencil, Trash2, Phone, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [mechanics, setMechanics] = useState<Mechanic[]>(mockMechanics);
  const [radius, setRadius] = useState("10");
  const [notifications, setNotifications] = useState(true);
  const [mechanicDialog, setMechanicDialog] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
  const [mechanicForm, setMechanicForm] = useState({ name: "", specialization: "", phone: "", email: "" });

  const [businessForm, setBusinessForm] = useState({
    businessName: user?.businessName || "",
    serviceType: user?.serviceType || "",
    location: user?.location || "",
    operatingHours: user?.operatingHours || "",
    description: "",
  });

  const handleSaveBusiness = () => {
    updateUser({
      businessName: businessForm.businessName,
      serviceType: businessForm.serviceType,
      location: businessForm.location,
      operatingHours: businessForm.operatingHours,
    });
    toast.success("Business details updated");
  };

  const openAddMechanic = () => {
    setEditingMechanic(null);
    setMechanicForm({ name: "", specialization: "", phone: "", email: "" });
    setMechanicDialog(true);
  };

  const openEditMechanic = (mechanic: Mechanic) => {
    setEditingMechanic(mechanic);
    setMechanicForm({
      name: mechanic.name,
      specialization: mechanic.specialization,
      phone: mechanic.phone,
      email: mechanic.email,
    });
    setMechanicDialog(true);
  };

  const handleSaveMechanic = () => {
    if (!mechanicForm.name) {
      toast.error("Please enter a name");
      return;
    }
    const base: Mechanic = {
      id: editingMechanic?.id || `MEC-${Date.now()}`,
      name: mechanicForm.name,
      specialization: mechanicForm.specialization,
      phone: mechanicForm.phone,
      email: mechanicForm.email,
      active: editingMechanic?.active ?? true,
    };
    setMechanics((prev) =>
      editingMechanic
        ? prev.map((m) => (m.id === editingMechanic.id ? base : m))
        : [...prev, base]
    );
    toast.success(editingMechanic ? "Mechanic updated" : "Mechanic added");
    setMechanicDialog(false);
  };

  const handleDeleteMechanic = (id: string) => {
    setMechanics((prev) => prev.filter((m) => m.id !== id));
    toast.success("Mechanic removed");
  };

  const toggleMechanicActive = (id: string) => {
    setMechanics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your business details and team</p>
      </div>

      <Tabs defaultValue="business">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Business Details */}
        <TabsContent value="business" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Update your business profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Select
                      value={businessForm.serviceType}
                      onValueChange={(value) => setBusinessForm({ ...businessForm, serviceType: value })}
                    >
                      <SelectTrigger id="serviceType">
                        <SelectValue placeholder="Select service type" />
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
                  <Label htmlFor="location">Location / Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      className="pl-9"
                      value={businessForm.location}
                      onChange={(e) => setBusinessForm({ ...businessForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingHours">Operating Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="operatingHours"
                      className="pl-9"
                      value={businessForm.operatingHours}
                      onChange={(e) => setBusinessForm({ ...businessForm, operatingHours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell customers about your business..."
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSaveBusiness}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Verification Card */}
            <Card className="glass-card h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    className={
                      user?.verified
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }
                    variant="outline"
                  >
                    {user?.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Commercial Register</span>
                  <p className="text-sm font-medium text-foreground">CR-2024-XXXXX</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Tax ID</span>
                  <p className="text-sm font-medium text-foreground">TX-XXXX-XXXX</p>
                </div>
                {!user?.verified && (
                  <p className="text-xs text-muted-foreground">
                    Your account is under review. Verification usually takes 1-2 business days.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your mechanics and staff</CardDescription>
                </div>
                <Button
                  onClick={openAddMechanic}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mechanics.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No team members</h3>
                  <p className="text-muted-foreground mb-4">Add your first team member to get started.</p>
                  <Button onClick={openAddMechanic} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {mechanics.map((mechanic) => (
                    <div
                      key={mechanic.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
                          {mechanic.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{mechanic.name}</p>
                          <p className="text-sm text-muted-foreground">{mechanic.specialization}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {mechanic.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {mechanic.active ? "Active" : "Inactive"}
                          </span>
                          <Switch
                            checked={mechanic.active}
                            onCheckedChange={() => toggleMechanicActive(mechanic.id)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditMechanic(mechanic)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteMechanic(mechanic.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Alert Radius</CardTitle>
                <CardDescription>Set the radius for receiving nearby requests</CardDescription>
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
                  <p className="text-xs text-muted-foreground">
                    You'll receive requests from customers within {radius} km of your location.
                  </p>
                </div>
                <Button
                  onClick={() => toast.success("Alert radius updated")}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Radius
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
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">SMS Alerts</p>
                    <p className="text-xs text-muted-foreground">Emergency requests via SMS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button
                  onClick={() => toast.success("Notification preferences saved")}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mechanic Dialog */}
      <Dialog open={mechanicDialog} onOpenChange={setMechanicDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMechanic ? "Edit" : "Add"} Team Member</DialogTitle>
            <DialogDescription>
              {editingMechanic ? "Update team member details" : "Add a new mechanic or staff member"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mech-name">Full Name</Label>
              <Input
                id="mech-name"
                placeholder="e.g. Ahmed Hassan"
                value={mechanicForm.name}
                onChange={(e) => setMechanicForm({ ...mechanicForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mech-spec">Specialization</Label>
              <Input
                id="mech-spec"
                placeholder="e.g. Engine & Transmission"
                value={mechanicForm.specialization}
                onChange={(e) => setMechanicForm({ ...mechanicForm, specialization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mech-phone">Phone</Label>
              <Input
                id="mech-phone"
                placeholder="+20 100 123 4567"
                value={mechanicForm.phone}
                onChange={(e) => setMechanicForm({ ...mechanicForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mech-email">Email</Label>
              <Input
                id="mech-email"
                type="email"
                placeholder="name@autocare.com"
                value={mechanicForm.email}
                onChange={(e) => setMechanicForm({ ...mechanicForm, email: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMechanicDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveMechanic}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              {editingMechanic ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}