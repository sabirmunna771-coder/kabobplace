import { Component, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PaletteProvider } from "@/context/PaletteContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MaintenanceGate from "@/components/MaintenanceGate";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Checkout from "./pages/Checkout.tsx";
import OrderSuccess from "./pages/OrderSuccess.tsx";
import Featured from "./pages/Featured.tsx";
import Menu from "./pages/Menu.tsx";
import Shop from "./pages/Shop.tsx";
import Contact from "./pages/Contact.tsx";
import CustomerDashboardPage from "./pages/CustomerDashboard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminProfile from "./pages/AdminProfile.tsx";
import SettingsPage from "./pages/admin/modules/SettingsPage.tsx";
import OverviewPage from "./pages/admin/modules/OverviewPage.tsx";
import OrdersPage from "./pages/admin/modules/OrdersPage.tsx";
import KitchenPage from "./pages/admin/modules/KitchenPage.tsx";
import RidersPage from "./pages/admin/modules/RidersPage.tsx";
import BranchStaffPage from "./pages/admin/modules/BranchStaffPage.tsx";
import CatalogPage from "./pages/admin/modules/CatalogPage.tsx";
import InventoryPage from "./pages/admin/modules/InventoryPage.tsx";
import AnalyticsPage from "./pages/admin/modules/AnalyticsPage.tsx";
import MarketingPage from "./pages/admin/modules/MarketingPage.tsx";
import PosPage from "./pages/admin/modules/PosPage.tsx";
import PosPageFullscreen from "./pages/admin/PosPageFullscreen.tsx";
import NotFound from "./pages/NotFound.tsx";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("App error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", color: "#fff", background: "#0a0a0f", minHeight: "100vh", fontFamily: "monospace" }}>
          <h2 style={{ color: "#f97316" }}>Runtime Error</h2>
          <pre style={{ color: "#ef4444", whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            {(this.state.error as Error).message}
            {"\n\n"}
            {(this.state.error as Error).stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <SiteSettingsProvider>
      <LanguageProvider>
        <PaletteProvider>
          <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Routes>
                    <Route path="/" element={<MaintenanceGate><Index /></MaintenanceGate>} />
                    <Route path="/featured" element={<MaintenanceGate><Featured /></MaintenanceGate>} />
                    <Route path="/menu" element={<MaintenanceGate><Menu /></MaintenanceGate>} />
                    <Route path="/shop" element={<MaintenanceGate><Shop /></MaintenanceGate>} />
                    <Route path="/contact" element={<MaintenanceGate><Contact /></MaintenanceGate>} />
                    <Route path="/checkout" element={<MaintenanceGate><Checkout /></MaintenanceGate>} />
                    <Route path="/order-success" element={<MaintenanceGate><OrderSuccess /></MaintenanceGate>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/account/dashboard"
                      element={(
                        <ProtectedRoute>
                          <CustomerDashboardPage />
                        </ProtectedRoute>
                      )}
                    />

                    {/* Full-screen POS route */}
                    <Route
                      path="/admin/pos-fullscreen"
                      element={(
                        <ProtectedRoute adminOnly>
                          <PosPageFullscreen />
                        </ProtectedRoute>
                      )}
                    />

                    <Route
                      path="/admin"
                      element={(
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      )}
                    >
                      <Route index element={<Navigate to="overview" replace />} />
                      <Route path="overview" element={<OverviewPage />} />
                      <Route path="orders" element={<OrdersPage />} />
                      <Route path="kitchen" element={<KitchenPage />} />
                      <Route path="riders" element={<RidersPage />} />
                      <Route path="branch-staff" element={<BranchStaffPage />} />
                      <Route path="catalog" element={<CatalogPage />} />
                      <Route path="inventory" element={<InventoryPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="marketing" element={<MarketingPage />} />
                      <Route path="pos" element={<PosPage />} />
                      <Route path="profile" element={<AdminProfile />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </PaletteProvider>
      </LanguageProvider>
    </SiteSettingsProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
