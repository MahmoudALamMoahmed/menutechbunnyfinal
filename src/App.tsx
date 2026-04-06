import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Restaurant = lazy(() => import("./pages/Restaurant"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MenuManagement = lazy(() => import("./pages/MenuManagement"));
const FooterManagement = lazy(() => import("./pages/FooterManagement"));
const BranchesManagement = lazy(() => import("./pages/BranchesManagement"));
const DashboardOrders = lazy(() => import("./pages/DashboardOrders"));
const BranchOrders = lazy(() => import("./pages/BranchOrders"));
const Wallet = lazy(() => import("./pages/Wallet"));
const DashboardAnalytics = lazy(() => import("./pages/DashboardAnalytics"));
const WhatsAppOrders = lazy(() => import("./pages/WhatsAppOrders"));
const WhatsAppAnalytics = lazy(() => import("./pages/WhatsAppAnalytics"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const RestaurantInfo = lazy(() => import("./pages/RestaurantInfo"));
const StaffLeads = lazy(() => import("./pages/StaffLeads"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Helper to wrap route elements with RouteErrorBoundary
const withErrorBoundary = (element: React.ReactNode) => (
  <RouteErrorBoundary>{element}</RouteErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <Routes>
              {/* صفحات عامة */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={withErrorBoundary(<Auth />)} />
              <Route path="/forgot-password" element={withErrorBoundary(<ForgotPassword />)} />
              <Route path="/reset-password" element={withErrorBoundary(<ResetPassword />)} />
              <Route path="/:username" element={withErrorBoundary(<Restaurant />)} />

              {/* صفحات صاحب المطعم — محمية */}
              <Route path="/:username/dashboard" element={withErrorBoundary(<ProtectedRoute requireOwner><Dashboard /></ProtectedRoute>)} />
              <Route path="/:username/restaurant-info" element={withErrorBoundary(<ProtectedRoute requireOwner><RestaurantInfo /></ProtectedRoute>)} />
              <Route path="/:username/menu-management" element={withErrorBoundary(<ProtectedRoute requireOwner><MenuManagement /></ProtectedRoute>)} />
              <Route path="/:username/footer-management" element={withErrorBoundary(<ProtectedRoute requireOwner><FooterManagement /></ProtectedRoute>)} />
              <Route path="/:username/branches-management" element={withErrorBoundary(<ProtectedRoute requireOwner><BranchesManagement /></ProtectedRoute>)} />
              <Route path="/:username/dashboard-orders" element={withErrorBoundary(<ProtectedRoute requireOwner><DashboardOrders /></ProtectedRoute>)} />
              <Route path="/:username/wallet" element={withErrorBoundary(<ProtectedRoute requireOwner><Wallet /></ProtectedRoute>)} />
              <Route path="/:username/dashboard-analytics" element={withErrorBoundary(<ProtectedRoute requireOwner><DashboardAnalytics /></ProtectedRoute>)} />
              <Route path="/:username/whatsapp-orders" element={withErrorBoundary(<ProtectedRoute requireOwner><WhatsAppOrders /></ProtectedRoute>)} />
              <Route path="/:username/whatsapp-analytics" element={withErrorBoundary(<ProtectedRoute requireOwner><WhatsAppAnalytics /></ProtectedRoute>)} />
              <Route path="/:username/subscription" element={withErrorBoundary(<ProtectedRoute requireOwner><Subscription /></ProtectedRoute>)} />

              {/* صفحة موظف الفرع */}
              <Route path="/:username/branch-orders" element={withErrorBoundary(<ProtectedRoute requireBranchStaff><BranchOrders /></ProtectedRoute>)} />

              {/* صفحات الإدارة */}
              <Route path="/super-admin" element={withErrorBoundary(<ProtectedRoute requireSuperAdmin><SuperAdmin /></ProtectedRoute>)} />
              <Route path="/staff-leads" element={withErrorBoundary(<ProtectedRoute requireSales><StaffLeads /></ProtectedRoute>)} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
