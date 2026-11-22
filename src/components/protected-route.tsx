import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth, Role, AppMode } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { toast } from "sonner";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  requiredMode?: AppMode;
}

export function ProtectedRoute({ allowedRoles, requiredMode }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role, activeMode, switchMode } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  // Keep active mode synchronized with route requirements when user is authorized
  useEffect(() => {
    if (isAuthenticated && requiredMode && activeMode !== requiredMode) {
      switchMode(requiredMode);
    }
  }, [isAuthenticated, requiredMode, activeMode, switchMode]);

  // 1. Zero-flicker hydration state: wait for localStorage session check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="ambient-glow float-slow -top-20 -start-20 h-80 w-80 bg-blue-600/20" />
        <div className="ambient-glow float-slower -bottom-20 -end-20 h-80 w-80 bg-orange-500/15" />

        <div className="z-10 flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center p-3 shadow-xl shadow-blue-600/30 border border-white/10 animate-pulse">
              <img src="/logo.png" alt="Synly" className="h-full w-full object-cover rounded-xl" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-blue-500/20 animate-ping pointer-events-none" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-base font-bold text-white tracking-wide">SYNLY</p>
            <p className="text-xs text-slate-400">{t("auth.restoringSession")}</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: redirect to login while preserving full target location & search params
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role-based access control: enforce role boundaries (e.g., non-vendor accessing vendor dashboard)
  if (allowedRoles && !allowedRoles.includes(role)) {
    toast.error(t("auth.roleAccessDenied"));
    const fallbackPath = role === "admin" ? "/admin/verification" : role === "vendor" ? "/dashboard" : "/user";
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
