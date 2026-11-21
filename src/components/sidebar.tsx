import { NavLink, useNavigate, useSignOut } from "react-router-dom";
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
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  forceDrawer?: boolean;
}

export function Sidebar({ open, onClose, forceDrawer = false }: { open: boolean; onClose: () => void; forceDrawer?: boolean }) {
  const { user, logout, logoutAllSessions, mode, setMode, sessionExpiresAt, deviceSessions } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVendor = mode === "vendor";
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  const navItems = isVendor
    ? [
        { to: "/dashboard", label: t("common.dashboard"), icon: LayoutDashboard, end: true },
        { to: "/dashboard/requests", label: t("common.requests"), icon: Inbox, end: false },
        { to: "/dashboard/catalog", label: t("common.catalog"), icon: Wrench, end: false },
        { to: "/dashboard/profile", label: t("common.profile"), icon: Settings, end: false },
      ]
    : [
        { to: "/user", label: t("common.home"), icon: Home, end: true },
        { to: "/user/requests", label: t("sidebar.myRequests"), icon: ClipboardList, end: false },
        { to: "/user/shops", label: t("sidebar.nearbyCenters"), icon: MapPin, end: false },
        { to: "/user/profile", label: t("common.profile"), icon: Settings, end: false },
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
    <div className="flex h-full flex-col bg-slate-950/80 backdrop-blur-2xl border-r border-white/10 rtl:border-r-0 rtl:border-l">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Synly" className="h-9 w-9 rounded-xl object-cover" />
          <span className="text-xl font-black tracking-wider text-white">SYNLY</span>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "rounded-xl p-2 hover:bg-white/10 text-slate-400 hover:text-white transition-colors",
            !forceDrawer && "lg:hidden"
          )}
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mode badge */}
      <div className="px-4 pt-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold border backdrop-blur-xl transition-all shadow-md",
            isVendor
              ? "bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-orange-500/10"
              : "bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-blue-500/10"
          )}
        >
          {isVendor ? <Store className="h-4 w-4" /> : <Car className="h-4 w-4" />}
          <span>{isVendor ? t("common.vendorMode") : t("common.userMode")}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? isVendor
                    ? "bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10"
                    : "bg-gradient-to-r from-blue-500/20 to-sky-500/10 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mode switcher & User info */}
      <div className="border-t border-white/10 p-4 space-y-3 bg-black/20">
        <button
          onClick={handleSwitchMode}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 border shadow-lg group",
            isVendor
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 shadow-blue-500/10"
              : "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 shadow-orange-500/10"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
              isVendor ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"
            )}
          >
            {isVendor ? <Car className="h-5 w-5" /> : <Store className="h-5 w-5" />}
          </div>
          <div className="text-start flex-1 min-w-0">
            <p className="text-[11px] text-slate-400 font-normal">{t("common.switchTo")}</p>
            <p className="font-semibold text-xs truncate">
              {isVendor ? t("common.userMode") : t("common.vendorMode")}
            </p>
          </div>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-blue-500/30 text-blue-300">
            <span className="text-sm font-bold">
              {user?.businessName?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-start">
            <p className="text-sm font-semibold text-white truncate">{user?.businessName || "Synly User"}</p>
            <p className="text-xs text-slate-400 truncate">{user?.serviceType || user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-5 w-5 rtl:-scale-x-100" />
          <span>{t("common.logout")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar (only if not forceDrawer) */}
      {!forceDrawer && (
        <aside className="hidden lg:fixed lg:inset-y-0 lg:start-0 lg:z-40 lg:block lg:w-64">
          {sidebarContent}
        </aside>
      )}

      {/* Drawer overlay for mobile OR for full-screen map drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 start-0 z-50 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-start duration-300 ease-out">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}