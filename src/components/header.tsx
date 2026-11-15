import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  User,
  LogOut,
  Search,
  ChevronDown,
  Menu,
  Car,
  Store,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, mode } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const isVendor = mode === "vendor";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between h-16 border-b border-border bg-card px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-md p-2 hover:bg-accent text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
          <span className="text-base font-bold text-white">S</span>
        </div>
        <h1 className="text-lg font-bold text-foreground hidden sm:block">Synly Dashboard</h1>
        {/* Mode badge */}
        <Badge
          variant="outline"
          className={cn(
            "hidden md:inline-flex gap-1.5",
            isVendor
              ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
          )}
        >
          {isVendor ? <Store className="h-3 w-3" /> : <Car className="h-3 w-3" />}
          {isVendor ? "Vendor Mode" : "User Mode"}
        </Badge>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder={isVendor ? "Search requests..." : "Search centers & services..."}
            className="pl-9 pr-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="h-5 w-5 hidden dark:block" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {user?.businessName || "User"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-20 py-1">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.businessName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <NavLink
                  to={isVendor ? "/dashboard/profile" : "/user/profile"}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}