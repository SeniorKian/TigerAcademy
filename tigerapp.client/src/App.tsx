import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import AdminLayout from '@/components/Layout/AdminLayout';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PlanDetail from '@/pages/PlanDetail';
import ConsultationBooking from '@/pages/ConsultationBooking';
import UserProfilePage from '@/pages/UserProfilePage';
import Dashboard from '@/pages/Dashboard';
import PlansPage from '@/pages/PlansPage';
import ConsultationsPage from '@/pages/ConsultationsPage';
import OrdersPage from '@/pages/OrdersPage';
import UsersPage from '@/pages/UsersPage';
import ContentPage from '@/pages/ContentPage';
import FaqsPage from '@/pages/FaqsPage';
import CheckoutPage from '@/pages/CheckoutPage';
import MenuPage from '@/pages/MenuPage';
import SettingsPage from '@/pages/SettingsPage';
import DynamicPage from '@/pages/DynamicPage';
import PaymentResultPage from '@/pages/PaymentResultPage';
import PaymentsPage from '@/pages/PaymentsPage';
import InstallPage from '@/pages/InstallPage';
import { InstallationGate } from '@/installation/InstallationGate';
import { getSafeReturnTo } from '@/utils/navigation';
import PageTransitionLoader from '@/components/PageTransitionLoader';

// Loading spinner while auth state initializes from localStorage
const AuthLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
    <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1E3A5F', borderTopColor: 'transparent' }} />
  </div>
);

// Protected route wrapper — redirects to /login if not authenticated
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, canAccessAdmin, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return canAccessAdmin ? (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ) : (
    <Navigate to="/profile" replace />
  );
};

const RoleRoute: React.FC<{ roles: string[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? <>{children}</> : <Navigate to="/admin/dashboard" replace />;
};

// Public route wrapper — redirects to /admin/dashboard if already logged in
const PublicRoute: React.FC = () => {
  const { isAuthenticated, canAccessAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  const returnTo = getSafeReturnTo(new URLSearchParams(location.search).get('returnTo'));
  return isAuthenticated ? <Navigate to={returnTo || (canAccessAdmin ? '/admin/dashboard' : '/profile')} replace /> : <Outlet />;
};

// Profile route — requires auth but uses public layout
const ProfileRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return isAuthenticated ? <Outlet /> : <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PageTransitionLoader />
      <InstallationGate>
        <AuthProvider>
        <Routes>
          <Route path="/install" element={<InstallPage />} />
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/plans/:id" element={<PlanDetail />} />
          <Route path="/consultations" element={<ConsultationBooking />} />
          <Route path="/page/:slug" element={<DynamicPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />

          {/* Login & Register — redirects to admin if already logged in */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Profile — requires auth, public layout */}
          <Route element={<ProfileRoute />}>
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>

          {/* Admin routes — requires authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/plans" element={<RoleRoute roles={['Admin', 'ContentManager']}><PlansPage /></RoleRoute>} />
            <Route path="/admin/consultations" element={<RoleRoute roles={['Admin', 'Consultant']}><ConsultationsPage /></RoleRoute>} />
            <Route path="/admin/orders" element={<RoleRoute roles={['Admin', 'Consultant']}><OrdersPage /></RoleRoute>} />
            <Route path="/admin/payments" element={<RoleRoute roles={['Admin', 'Consultant']}><PaymentsPage /></RoleRoute>} />
            <Route path="/admin/users" element={<RoleRoute roles={['Admin', 'Consultant']}><UsersPage /></RoleRoute>} />
            <Route path="/admin/content" element={<RoleRoute roles={['Admin', 'ContentManager']}><ContentPage /></RoleRoute>} />
            <Route path="/admin/faqs" element={<RoleRoute roles={['Admin', 'ContentManager']}><FaqsPage /></RoleRoute>} />
            <Route path="/admin/menu" element={<RoleRoute roles={['Admin', 'ContentManager']}><MenuPage /></RoleRoute>} />
            <Route path="/admin/settings" element={<RoleRoute roles={['Admin']}><SettingsPage /></RoleRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Catch-all — go to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </InstallationGate>
    </BrowserRouter>
  );
};

export default App;
