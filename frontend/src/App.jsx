import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import SuspendedPage from '@/pages/SuspendedPage';
import { LevelUpModal, BadgeUnlockedModal, useGamificationModals } from '@/components/common/LevelUpModal';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import NavigationGuard from '@/components/common/NavigationGuard';

// ── Auth ──
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';

// ── Public ──
import LandingPage from '@/pages/LandingPage';
import AboutPage from '@/pages/AboutPage';
import ServicesPage from '@/pages/ServicesPage';
import ContactPage from '@/pages/ContactPage';
import BlogPage from '@/pages/BlogPage';

// ── Shared ──
import JobsPage from '@/pages/jobs/JobsPage';
import JobDetailPage from '@/pages/jobs/JobDetailPage';
import LabourerProfilePage from '@/pages/labour/LabourerProfilePage';
import SchemesPage from '@/pages/SchemesPage';
import LeaderboardPage from '@/pages/labour/LeaderboardPage';
import DisputeDetailPage from '@/pages/disputes/DisputeDetailPage';

// ✅ IMPORTANT: ADD THIS
import ClientPublicProfile from '@/pages/client/ClientPublicProfile';

// ── Labour ──
import LabourLayout from '@/components/layout/LabourLayout';
import LabourDashboard from '@/pages/labour/LabourDashboard';
import LabourProfileEdit from '@/pages/labour/LabourProfileEdit';
import MyApplicationsPage from '@/pages/labour/MyApplicationsPage';
import PointsHistoryPage from '@/pages/labour/PointsHistoryPage';
import LabourChatPage from '@/pages/labour/LabourChatPage';
import SavedJobsPage from '@/pages/labour/SavedJobsPage';

// ── Client ──
import ClientLayout from '@/components/layout/ClientLayout';
import ClientDashboard from '@/pages/client/ClientDashboard';
import PostJobPage from '@/pages/client/PostJobPage';
import ManageJobsPage from '@/pages/client/ManageJobsPage';
import JobApplicantsPage from '@/pages/client/JobApplicantsPage';
import BrowseLabourersPage from '@/pages/client/BrowseLabourersPage';
import ClientChatPage from '@/pages/client/ClientChatPage';
import ClientProfilePage from '@/pages/client/ClientProfilePage';
import SettingsPage from '@/pages/settings/SettingsPage';

// ── Admin ──
import AdminLayout from '@/components/layout/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminBadgePage from '@/pages/admin/AdminBadgePage';
import AdminFraudPage from '@/pages/admin/AdminFraudPage';
import AdminAuditPage from '@/pages/admin/AdminAuditPage';
import AdminDisputesPage from '@/pages/admin/AdminDisputesPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminInactiveUsersPage from '@/pages/admin/AdminInactiveUsersPage';
import AdminVerificationSLAPage from '@/pages/admin/AdminVerificationSLAPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminVerificationsPage from '@/pages/admin/AdminVerificationsPage';
import AdminJobsPage from '@/pages/admin/AdminJobsPage';
import AdminSchemesPage from '@/pages/admin/AdminSchemesPage';
import AdminSchemeFormPage from '@/pages/admin/AdminSchemeFormPage';
import AdminContactsPage from '@/pages/admin/AdminContactsPage';
import AdminEmployeesPage from '@/pages/admin/AdminEmployeesPage';

// ── Disputes ──
import RaiseDisputePage from '@/pages/disputes/RaiseDisputePage';
import MyDisputesPage from '@/pages/disputes/MyDisputesPage';

// ── Employee ──
import EmployeeLayout from '@/components/layout/EmployeeLayout';
const EmployeeDashboard = lazy(() => import('@/pages/employee/EmployeeDashboard'));
const EmployeeChatPage  = lazy(() => import('@/pages/employee/EmployeeChatPage'));
const EmployeeWorkersPage = lazy(() => import('@/pages/employee/EmployeeWorkersPage'));
const EmployeeClientsPage = lazy(() => import('@/pages/employee/EmployeeClientsPage'));
const EmployeeJobsPage    = lazy(() => import('@/pages/employee/EmployeeJobsPage'));

// ── Redirects ──
const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'labour') return <Navigate to="/labour" replace />;
  if (user?.role === 'client') return <Navigate to="/client" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'employee') return <Navigate to="/employee" replace />;
  return <Navigate to="/" replace />;
};

const SharedRedirect = ({ page }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (user?.role === 'labour') {
      navigate(`/labour/${page}`, { replace: true });
    } else if (user?.role === 'client') {
      navigate(`/client/${page}`, { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user?.role === 'employee') {
      navigate('/employee', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate, page]);

  return null;
};

const App = () => {
  const { loading } = useAuth(); 
  const { levelUpData, badgeData, closeLevelUp, closeBadge } = useGamificationModals();
  const { user, suspensionReason } = useAuth();

  if (user?.isSuspended || suspensionReason) {
    return <SuspendedPage reason={suspensionReason || user?.suspendReason} />;
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }


  return (
    <>
      {levelUpData && <LevelUpModal {...levelUpData} onClose={closeLevelUp} />}
      {badgeData && !levelUpData && <BadgeUnlockedModal {...badgeData} onClose={closeBadge} />}

      <NavigationGuard />

      <Routes>

        {/* ───────── PUBLIC ───────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />

        {/* ✅ FIX: CLIENT PUBLIC PROFILE (TOP PRIORITY) */}
        <Route path="/client/:id" element={<ClientPublicProfile />} />

        {/* ───────── AUTH ───────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* ───────── SHARED REDIRECTS ───────── */}
        <Route path="/jobs" element={<SharedRedirect page="jobs" />} />
        <Route path="/jobs/:id" element={<SharedRedirect page="jobs" />} />
        <Route path="/schemes" element={<SharedRedirect page="schemes" />} />
        <Route path="/leaderboard" element={<SharedRedirect page="leaderboard" />} />
        <Route path="/disputes/:id" element={<SharedRedirect page="disputes" />} />

        {/* ───────── DIRECT PROFILE ROUTES ───────── */}
        <Route path="/labourers/:id" element={<LabourerProfilePage />} />

        {/* ───────── LABOUR ───────── */}
        <Route
  path="/labour"
  element={
    <>
      <ProtectedRoute role="labour">
        <LabourLayout />
      </ProtectedRoute>
    </>
  }
>
          <Route index element={<LabourDashboard />} />
          <Route path="profile" element={<LabourProfileEdit />} />
          <Route path="applications" element={<MyApplicationsPage />} />
          <Route path="chat" element={<LabourChatPage />} />
          <Route path="chat/:convId" element={<LabourChatPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="points" element={<PointsHistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="disputes" element={<MyDisputesPage />} />
          <Route path="disputes/raise" element={<RaiseDisputePage />} />
          <Route path="disputes/:id" element={<DisputeDetailPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="schemes" element={<SchemesPage />} />
          <Route path="profile/:id" element={<LabourerProfilePage />} />
          <Route path="labourers/:id" element={<LabourerProfilePage />} />
          <Route path="saved-jobs" element={<SavedJobsPage />} />
          
        </Route>

        {/* ───────── CLIENT ───────── */}
        <Route
  path="/client"
  element={
    <>
      <ProtectedRoute role="client">
        <ClientLayout />
      </ProtectedRoute>
    </>
  }
>
          <Route index element={<ClientDashboard />} />
          <Route path="post-job" element={<PostJobPage />} />
          <Route path="jobs" element={<ManageJobsPage />} />
          <Route path="jobs/:id/applicants" element={<JobApplicantsPage />} />
          <Route path="labourers" element={<BrowseLabourersPage />} />
          <Route path="chat" element={<ClientChatPage />} />
          <Route path="chat/:convId" element={<ClientChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ClientProfilePage />} />
          <Route path="disputes" element={<MyDisputesPage />} />
          <Route path="disputes/raise" element={<RaiseDisputePage />} />
          <Route path="disputes/:id" element={<DisputeDetailPage />} />
          <Route path="schemes" element={<SchemesPage />} />
          <Route path="labourers/:id" element={<LabourerProfilePage />} />
          <Route path="browse-jobs" element={<JobsPage />} />
          <Route path="browse-jobs/:id" element={<JobDetailPage />} />
        </Route>

        {/* ───────── ADMIN ───────── */}
        <Route
  path="/admin"
  element={
    <>
      <ProtectedRoute role="admin">
        <AdminLayout />
      </ProtectedRoute>
    </>
  }
>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="verifications" element={<AdminVerificationsPage />} />
          <Route path="jobs" element={<AdminJobsPage />} />
          <Route path="badges" element={<AdminBadgePage />} />
          <Route path="fraud" element={<AdminFraudPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="disputes" element={<AdminDisputesPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="inactive-users" element={<AdminInactiveUsersPage />} />
          <Route path="verif-sla" element={<AdminVerificationSLAPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="schemes" element={<AdminSchemesPage />} />
          <Route path="schemes/new" element={<AdminSchemeFormPage />} />
          <Route path="schemes/:id/edit" element={<AdminSchemeFormPage />} />
          <Route path="contacts" element={<AdminContactsPage />} />
        </Route>

        {/* ───────── EMPLOYEE ───────── */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute role="employee">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route element={
            <Suspense fallback={<div className="p-10 text-center">Loading portal...</div>}>
              <Outlet />
            </Suspense>
          }>
            <Route index element={<EmployeeDashboard />} />
            <Route path="chat" element={<EmployeeChatPage />} />
            <Route path="chat/:convId" element={<EmployeeChatPage />} />
            <Route path="workers" element={<EmployeeWorkersPage />} />
            <Route path="clients" element={<EmployeeClientsPage />} />
            <Route path="jobs" element={<EmployeeJobsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />

      </Routes>
    </>
  );
};

export default App;