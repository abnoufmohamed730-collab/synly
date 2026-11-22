import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./context/auth-context";
import { LanguageProvider } from "./context/language-context";
import { DashboardLayout } from "./components/dashboard-layout";
import { ProtectedRoute } from "./components/protected-route";
import { PageTransition } from "./components/PageTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";

const WelcomePage = lazy(() => import("./pages/Welcome").then((module) => ({ default: module.WelcomePage })));
const LoginPage = lazy(() => import("./pages/login").then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password").then((module) => ({ default: module.ForgotPasswordPage })));
const RegisterPage = lazy(() => import("./pages/register").then((module) => ({ default: module.RegisterPage })));
const AuthCallbackPage = lazy(() => import("./pages/auth-callback").then((module) => ({ default: module.AuthCallbackPage })));
const DashboardPage = lazy(() => import("./pages/dashboard").then((module) => ({ default: module.DashboardPage })));
const RequestsPage = lazy(() => import("./pages/requests").then((module) => ({ default: module.RequestsPage })));
const CatalogPage = lazy(() => import("./pages/catalog").then((module) => ({ default: module.CatalogPage })));
const ProfilePage = lazy(() => import("./pages/profile").then((module) => ({ default: module.ProfilePage })));
const UserMapDashboardPage = lazy(() => import("./pages/user-map-dashboard").then((module) => ({ default: module.UserMapDashboardPage })));
const UserRequestsPage = lazy(() => import("./pages/user-requests").then((module) => ({ default: module.UserRequestsPage })));
const UserCatalogPage = lazy(() => import("./pages/user-catalog").then((module) => ({ default: module.UserCatalogPage })));
const ShopsPage = lazy(() => import("./pages/shops").then((module) => ({ default: module.ShopsPage })));
const VendorVerificationPage = lazy(() => import("./pages/vendor-verification").then((module) => ({ default: module.VendorVerificationPage })));
const AdminVerificationReviewPage = lazy(() => import("./pages/admin-verification-review").then((module) => ({ default: module.AdminVerificationReviewPage })));
const CustomerOrdersPage = lazy(() => import("./pages/orders").then((module) => ({ default: module.CustomerOrdersPage })));
const VendorOrdersPage = lazy(() => import("./pages/orders").then((module) => ({ default: module.VendorOrdersPage })));

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#090A0F] text-slate-300">Loading…</div>}>
                <Routes>
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route element={<ProtectedRoute allowedRoles={["user", "vendor"]} requiredMode="user" />}>
                    <Route element={<PageTransition />}>
                      <Route path="/user">
                        <Route index element={<UserMapDashboardPage />} />
                        <Route element={<DashboardLayout />}>
                          <Route path="requests" element={<UserRequestsPage />} />
                          <Route path="shops" element={<ShopsPage />} />
                          <Route path="catalog" element={<UserCatalogPage />} />
                          <Route path="orders" element={<CustomerOrdersPage />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="verification" element={<VendorVerificationPage />} />
                        </Route>
                      </Route>
                    </Route>
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["vendor"]} requiredMode="vendor" />}>
                    <Route element={<PageTransition />}>
                      <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="requests" element={<RequestsPage />} />
                        <Route path="catalog" element={<CatalogPage />} />
                        <Route path="orders" element={<VendorOrdersPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="verification" element={<VendorVerificationPage />} />
                      </Route>
                    </Route>
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                    <Route element={<PageTransition />}><Route path="/admin/verification" element={<AdminVerificationReviewPage />} /></Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Toaster position="top-right" richColors theme="dark" />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
