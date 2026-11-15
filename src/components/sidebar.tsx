import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Inbox,
  Wrench,
  Package,
  Settings,
  LogOut,
  X,
  Car,
} from "lucide-react";
import { useAuth } from "../context/auth-context";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/requests", label: "Requests", icon: Inbox, end: false },
  { to: "/catalog", label: "Catalog", icon: Wrench, end: false },
  { to: "/profile", label: "Profile", icon: Settings, end: false },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border">
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

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-accent p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="text-sm font-semibold">
              {user?.businessName?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.businessName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.serviceType}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open && "block"
        )}
        aria-hidden={!open}
      >
        {open && (
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}