import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./context/auth-context";
import { DashboardLayout } from "./components/dashboard-layout";
import { WelcomePage } from "./pages/Welcome";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { DashboardPage } from "./pages/dashboard";
import { RequestsPage } from "./pages/requests";
import { CatalogPage } from "./pages/catalog";
import { ProfilePage } from "./pages/profile";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Welcome Page */}
            <Route path="/" element={<WelcomePage />} />

            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Dashboard */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
            >
              <Route index element={<DashboardPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}