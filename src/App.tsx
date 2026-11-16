import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./context/auth-context";
import { LanguageProvider } from "./context/language-context";
import { DashboardLayout } from "./components/dashboard-layout";
import { WelcomePage } from "./pages/Welcome";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { DashboardPage } from "./pages/dashboard";
import { RequestsPage } from "./pages/requests";
import { CatalogPage } from "./pages/catalog";
import { ProfilePage } from "./pages/profile";
import { UserMapDashboardPage } from "./pages/user-map-dashboard";
import { UserRequestsPage } from "./pages/user-requests";
import { ShopsPage } from "./pages/shops";

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
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Regular User Mode */}
              <Route path="/user">
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <UserMapDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="requests" element={<UserRequestsPage />} />
                  <Route path="shops" element={<ShopsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>

              {/* Service Center / Vendor Mode */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}