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
import { useLanguage } from "../context/language-context";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationBell } from "./NotificationBell";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, mode } = useAuth();
  const { t } = useLanguage();
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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 md:px-6 shadow-lg shadow-black/20">
      {/* Left side: Hamburger + Logo + Mode Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl p-2 hover:bg-white/10 text-slate-300 transition-colors interactive-scale"
          aria-label={t("screens.openMenu")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <img src="/logo.png" alt="Synly" className="h-9 w-9 rounded-xl object-cover" />

        <h1 className="text-base font-bold text-white hidden sm:block tracking-wide">
          SYNLY
        </h1>

        {/* Mode badge */}
        <Badge
          variant="outline"
          className={cn(
            "hidden md:inline-flex gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-xl",
            isVendor
              ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
              : "bg-blue-500/15 text-blue-400 border-blue-500/30"
          )}
        >
          {isVendor ? <Store className="h-3 w-3" /> : <Car className="h-3 w-3" />}
          {isVendor ? t("common.vendorMode") : t("common.userMode")}
        </Badge>
      </div>

      {/* Right side: Search + Language Switcher + Theme Toggle + User Menu */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder={isVendor ? t("header.searchRequests") : t("header.searchCenters")}
            className="ps-9 pe-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 w-52 lg:w-64 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Global Language Switcher */}
        <LanguageSwitcher />
        <NotificationBell />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl p-2 hover:bg-white/10 text-slate-300 transition-colors border border-white/5 flex items-center gap-1.5 interactive-scale"
                    aria-label={t("common.toggleTheme")}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span className="text-xs font-medium text-slate-300">{t("common.light")}</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span className="text-xs font-medium text-slate-300">{t("common.dark")}</span>
                      </>
                    )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-300">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-slate-200 hidden sm:block max-w-[120px] truncate">
              {user?.businessName || "User"}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute end-0 mt-2 w-52 rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-2xl shadow-2xl z-50 py-1.5">
                <div className="px-4 py-2.5 border-b border-white/10">
                  <p className="text-sm font-semibold text-white truncate">{user?.businessName || "User"}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <NavLink
                  to={isVendor ? "/dashboard/profile" : "/user/profile"}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4" />
                  {t("common.profile")}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 rtl:-scale-x-100" />
                  {t("common.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}