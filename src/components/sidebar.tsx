import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Inbox,
  Wrench,
  Settings,
  LogOut,
  X,
  Car,
  Store,
  MapPin,
  ClipboardList,
  Home,
} from "lucide-react";
import { useAuth } from "../context/auth-context";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout, mode, setMode } = useAuth();
  const navigate = useNavigate();
  const isVendor = mode === "vendor";

  const navItems = isVendor
    ? [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/dashboard/requests", label: "Requests", icon: Inbox, end: false },
        { to: "/dashboard/catalog", label: "Catalog", icon: Wrench, end: false },
        { to: "/dashboard/profile", label: "Profile", icon: Settings, end: false },
      ]
    : [
        { to: "/user", label: "Home", icon: Home, end: true },
        { to: "/user/requests", label: "My Requests", icon: ClipboardList, end: false },
        { to: "/user/shops", label: "Nearby Centers", icon: MapPin, end: false },
        { to: "/user/profile", label: "Profile", icon: Settings, end: false },
      ];

  const handleSwitchMode = () => {
    if (isVendor) {
      setMode("user");
      navigate("/user");
    } else {
      setMode("vendor");
      navigate("/dashboard");
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">Synly</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden rounded-md p-2 hover:bg-accent text-muted-foreground"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mode badge */}
      <div className="px-4 pt-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border",
            isVendor
              ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
          )}
        >
          {isVendor ? <Store className="h-4 w-4" /> : <Car className="h-4 w-4" />}
          {isVendor ? "Service Center Mode" : "User Mode"}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Mode switcher */}
      <div className="border-t border-border p-4 space-y-3">
        <button
          onClick={handleSwitchMode}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border",
            isVendor
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
              : "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
          )}
        >
          {isVendor ? <Car className="h-5 w-5" /> : <Store className="h-5 w-5" />}
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Switch to</p>
            <p className="font-medium">{isVendor ? "User Mode" : "Service Center Mode"}</p>
          </div>
        </button>

        {/* Business card */}
        <div className="flex items-center gap-3 rounded-lg bg-accent p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="text-sm font-semibold">
              {user?.businessName?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.businessName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.serviceType}</p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block">
        {sidebarContent}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}