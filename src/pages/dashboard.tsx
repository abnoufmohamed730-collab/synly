import { useState } from "react";
import { useAuth } from "../context/auth-context";
import {
  mockRequests,
  urgencyLabels,
  urgencyColors,
  statusLabels,
  statusColors,
} from "../lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  Users,
  CheckCircle,
  DollarSign,
  Wifi,
  WifiOff,
  MapPin,
  Clock,
  Car,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

export function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(user?.status || "online");

  const activeRequests = mockRequests.filter(
    (r) => r.status === "pending" || r.status === "offered"
  ).length;
  const completedJobs = mockRequests.filter((r) => r.status === "completed").length;
  const totalEarnings = mockRequests
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.offerPrice || 0), 0);

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? "online" : "offline";
    setStatus(newStatus);
    updateUser({ status: newStatus });
  };

  const pendingRequests = mockRequests.filter(
    (r) => r.status === "pending" || r.status === "offered"
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.businessName?.split(" ")[0] || "Vendor"}! Here's your overview.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2">
            <Label className="text-sm font-medium text-foreground">
              {status === "online" ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
            </Label>
            <Switch
              checked={status === "online"}
              onCheckedChange={handleStatusChange}
              aria-label="Toggle online status"
            />
            <span className="text-sm font-medium text-foreground">
              {status === "online" ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Requests</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeRequests}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Jobs</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{completedJobs}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">EGP {totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  status === "online" ? "bg-green-500" : "bg-gray-500"
                }`}
              />
              <span className="text-lg font-bold text-foreground capitalize">{status}</span>
            </div>
            <p className="text-xs text-muted-foreground">Ready to receive requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Feed / Incoming Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Live Request Feed</h2>
          <Badge variant="secondary" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </Badge>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No incoming requests</h3>
              <p className="text-muted-foreground">
                You're all caught up! New requests will appear here in real-time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: typeof mockRequests[0] }) {
  return (
    <Card className="glass-card hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Car Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{request.userName}</p>
              <p className="text-sm text-muted-foreground">
                {request.carModel} {request.carYear}
              </p>
            </div>
          </div>

          {/* Issue Description */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-2">{request.issueDescription}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {request.distance}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {new Date(request.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Badge>
              <Badge
                className={urgencyColors[request.urgency]}
                variant="outline"
              >
                <AlertTriangle className="h-3 w-3" />
                {urgencyLabels[request.urgency]}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              Send Offer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}