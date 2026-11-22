import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./context/auth-context";
import { LanguageProvider } from "./context/language-context";
import { DashboardLayout } from "./components/dashboard-layout";
import { ProtectedRoute } from "./components/protected-route";
import { WelcomePage } from "./pages/Welcome";
import { LoginPage } from "./pages/login";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { RegisterPage } from "./pages/register";
import { AuthCallbackPage } from "./pages/auth-callback";
import { DashboardPage } from "./pages/dashboard";
import { RequestsPage } from "./pages/requests";
import { CatalogPage } from "./pages/catalog";
import { ProfilePage } from "./pages/profile";
import { UserMapDashboardPage } from "./pages/user-map-dashboard";
import { UserRequestsPage } from "./pages/user-requests";
import { UserCatalogPage } from "./pages/user-catalog";
import { ShopsPage } from "./pages/shops";
import { PageTransition } from "./components/PageTransition";
import { VendorVerificationPage } from "./pages/vendor-verification";
import { AdminVerificationReviewPage } from "./pages/admin-verification-review";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              {/* Protected User Experience: accessible by car owners & vendors */}
              <Route element={<ProtectedRoute allowedRoles={["user", "vendor"]} requiredMode="user" />}>
                <Route element={<PageTransition />}>
                  <Route path="/user">
                    <Route index element={<UserMapDashboardPage />} />
                    <Route element={<DashboardLayout />}>
                      <Route path="requests" element={<UserRequestsPage />} />
                      <Route path="shops" element={<ShopsPage />} />
                      <Route path="catalog" element={<UserCatalogPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="verification" element={<VendorVerificationPage />} />
                    </Route>
                  </Route>
                </Route>
              </Route>

              {/* Protected Vendor Experience: strictly restricted to vendors; database policies gate unverified access */}
              <Route element={<ProtectedRoute allowedRoles={["vendor"]} requiredMode="vendor" />}>
                <Route element={<PageTransition />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="requests" element={<RequestsPage />} />
                    <Route path="catalog" element={<CatalogPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="verification" element={<VendorVerificationPage />} />
                  </Route>
                </Route>
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route element={<PageTransition />}>
                  <Route path="/admin/verification" element={<AdminVerificationReviewPage />} />
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors theme="dark" />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
