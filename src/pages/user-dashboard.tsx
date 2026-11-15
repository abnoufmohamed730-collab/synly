import { useNavigate } from "react-router-dom";
import { mockNearbyCenters, mockUserRequests } from "../lib/mock-data";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Car,
  Battery,
  Fuel,
  Lock,
  Wrench,
  CircleDot,
  MapPin,
  Star,
  ArrowRight,
  Plus,
  Clock,
} from "lucide-react";

const quickActions = [
  { label: "Towing", icon: Car, desc: "24/7 emergency towing", color: "bg-blue-500/10 text-blue-500" },
  { label: "Battery", icon: Battery, desc: "Jump start or replacement", color: "bg-green-500/10 text-green-500" },
  { label: "Tire Change", icon: CircleDot, desc: "Flat tire on the road", color: "bg-amber-500/10 text-amber-500" },
  { label: "Fuel Delivery", icon: Fuel, desc: "Out of gas? We deliver", color: "bg-orange-500/10 text-orange-500" },
  { label: "Lockout", icon: Lock, desc: "Keys locked inside car", color: "bg-purple-500/10 text-purple-500" },
  { label: "Mechanical", icon: Wrench, desc: "On-site repair service", color: "bg-rose-500/10 text-rose-500" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <Badge className={map[status] || map.pending} variant="outline">
      {status}
    </Badge>
  );
}

export function UserDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, Ahmed 👋</h1>
          <p className="text-muted-foreground">How can we help you on the road today?</p>
        </div>
        <Button
          onClick={() => navigate("/user/requests")}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Request Assistance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate("/user/requests")}
              className="glass-card rounded-xl p-4 text-center hover:border-primary/40 transition-colors group"
            >
              <div
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg ${action.color} mb-2 group-hover:scale-105 transition-transform`}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nearby Centers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Nearby Service Centers</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/user/shops")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {mockNearbyCenters.slice(0, 3).map((center) => (
            <Card key={center.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{center.name}</p>
                    <p className="text-xs text-muted-foreground">{center.type}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      center.openNow
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {center.openNow ? "Open Now" : "Closed"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {center.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400" /> {center.rating} ({center.reviews})
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Requests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">My Recent Requests</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/user/requests")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {mockUserRequests.map((req) => (
            <Card key={req.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-foreground">{req.service}</p>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {req.center} • {req.date}
                </p>
                {req.price && <p className="text-sm font-semibold text-foreground mt-1">EGP {req.price}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Need help right now?</p>
            <p className="text-xs text-muted-foreground">
              Our roadside assistance team is available 24/7. Average response time: 15 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}