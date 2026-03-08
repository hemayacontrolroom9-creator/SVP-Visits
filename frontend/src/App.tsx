import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAppSelector } from './store/hooks';
import { selectIsAuthenticated, selectCurrentUser } from './store/slices/authSlice';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const VisitsPage = lazy(() => import('./pages/visits/VisitsPage'));
const VisitDetailPage = lazy(() => import('./pages/visits/VisitDetailPage'));
const ScheduleVisitPage = lazy(() => import('./pages/visits/ScheduleVisitPage'));
const SitesPage = lazy(() => import('./pages/sites/SitesPage'));
const SiteDetailPage = lazy(() => import('./pages/sites/SiteDetailPage'));
const MapPage = lazy(() => import('./pages/maps/MapPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const AlertsPage = lazy(() => import('./pages/alerts/AlertsPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress size={60} />
  </Box>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/visits/schedule" element={<ScheduleVisitPage />} />
          <Route path="/visits/:id" element={<VisitDetailPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/sites/:id" element={<SiteDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'manager']}><AdminPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
