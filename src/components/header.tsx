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
  Inbox,
  Wrench,
} from "lucide-react";
import { useAuth } from "../context/auth-context";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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
        <h1 className="text-lg font-bold text-foreground hidden sm:block">
          Synly Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search requests..."
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
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm">
              {user?.businessName?.charAt(0).toUpperCase() || "V"}
            </div>
            <span className="hidden md:inline max-w-[140px] truncate">
              {user?.businessName || "Vendor"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl bg-card border border-border p-2 shadow-xl">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <NavLink
                  to="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile & Settings
                </NavLink>
                <NavLink
                  to="/dashboard/requests"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Inbox className="h-4 w-4" />
                  Requests
                </NavLink>
                <NavLink
                  to="/dashboard/catalog"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Wrench className="h-4 w-4" />
                  Catalog
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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