import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "../context/auth-context";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { mode, setMode } = useAuth();

  // Keep mode in sync with the current route
  useEffect(() => {
    if (location.pathname.startsWith("/dashboard") && mode !== "vendor") {
      setMode("vendor");
    } else if (location.pathname.startsWith("/user") && mode !== "user") {
      setMode("user");
    }
  }, [location.pathname, mode, setMode]);

  return (
    <div className="min-h-screen bg-[#090A0F] text-foreground relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="ambient-glow float-slow -top-24 -start-24 h-96 w-96 bg-blue-600/10 pointer-events-none" />
      <div className="ambient-glow float-slower top-1/2 -end-24 h-96 w-96 bg-orange-500/10 pointer-events-none" />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:ps-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}