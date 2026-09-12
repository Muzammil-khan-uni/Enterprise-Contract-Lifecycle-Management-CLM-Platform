import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { DashboardLayout } from '../shared/layouts/DashboardLayout';
import { Button } from '../shared/components/ui/Button';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import ContractListPage from '../features/contracts/pages/ContractListPage';
import ContractDetailPage from '../features/contracts/pages/ContractDetailPage';
import ContractCreatePage from '../features/contracts/pages/ContractCreatePage';
import ApprovalQueuePage from '../features/workflow/pages/ApprovalQueuePage';
import MyObligationsPage from '../features/obligations/pages/MyObligationsPage';
import MySignaturesPage from '../features/signature/pages/MySignaturesPage';
import RenewalsPage from '../features/contracts/pages/RenewalsPage';
import ProfilePage from '../features/users/pages/ProfilePage';

const ExecutiveDashboardPage = lazy(() => import('../features/dashboard/pages/ExecutiveDashboardPage'));
const AuditLogPage = lazy(() => import('../features/audit-logs/pages/AuditLogPage'));
const BusinessUnitsPage = lazy(() => import('../features/org-structure/pages/BusinessUnitsPage'));
const DepartmentsPage = lazy(() => import('../features/org-structure/pages/DepartmentsPage'));
const UsersPage = lazy(() => import('../features/users/pages/UsersPage'));
const VendorsPage = lazy(() => import('../features/vendors/pages/VendorsPage'));
const TemplatesPage = lazy(() => import('../features/templates/pages/TemplatesPage'));
const ClauseLibraryPage = lazy(() => import('../features/templates/pages/ClauseLibraryPage'));

const RouteFallback = () => (
  <div className="p-4 sm:p-8 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
    <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-brass-500 animate-spin dark:border-ink-700 dark:border-t-brass-400" />
    Loading…
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
      <FileQuestion size={28} />
    </span>
    <div>
      <h1 className="font-display text-xl font-semibold text-ink-950 dark:text-white">Page not found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The page you're looking for doesn't exist or may have moved.</p>
    </div>
    <Link to="/dashboard">
      <Button size="sm">Back to dashboard</Button>
    </Link>
  </div>
);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ExecutiveDashboardPage />
              </Suspense>
            }
          />
          <Route path="/contracts" element={<ContractListPage />} />
          <Route path="/contracts/new" element={<ContractCreatePage />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/approvals" element={<ApprovalQueuePage />} />
          <Route path="/obligations" element={<MyObligationsPage />} />
          {

}
          <Route path="/signatures" element={<MySignaturesPage />} />
          <Route path="/renewals" element={<RenewalsPage />} />
          {

}
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<RoleGuard allowedRoles={['Admin', 'LegalOfficer']} />}>
            <Route
              path="/audit-logs"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <AuditLogPage />
                </Suspense>
              }
            />
            <Route
              path="/settings/business-units"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <BusinessUnitsPage />
                </Suspense>
              }
            />
            <Route
              path="/settings/departments"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <DepartmentsPage />
                </Suspense>
              }
            />
            <Route
              path="/settings/vendors"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <VendorsPage />
                </Suspense>
              }
            />
            <Route
              path="/templates"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <TemplatesPage />
                </Suspense>
              }
            />
            <Route
              path="/templates/clauses"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <ClauseLibraryPage />
                </Suspense>
              }
            />
          </Route>

          {
}
          <Route element={<RoleGuard allowedRoles={['Admin']} />}>
            <Route
              path="/settings/users"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <UsersPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
