import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layout/AppLayout'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequirePermission } from '@/auth/RequirePermission'
import { LoadingScreen } from '@/components/LoadingScreen'
import RouteErrorPage from '@/pages/Error/RouteError'
import NotFoundPage from '@/pages/Error/NotFound'

const LoginPage = lazy(() => import('@/pages/Login'))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const CafeListPage = lazy(() => import('@/pages/Cafes/CafeList'))
const CafeDetailPage = lazy(() => import('@/pages/Cafes/CafeDetail'))
const AuditPage = lazy(() => import('@/pages/Audit'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const SmtpSettingsPage = lazy(() => import('@/pages/Settings/Smtp'))
const EmailTemplatesPage = lazy(() => import('@/pages/Settings/EmailTemplates'))
const ProfilePage = lazy(() => import('@/pages/Profile'))

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: withSuspense(
              <RequirePermission permission="dashboard.view">
                <DashboardPage />
              </RequirePermission>,
            ),
          },
          {
            path: 'cafes',
            element: withSuspense(
              <RequirePermission permission="cafes.section">
                <CafeListPage />
              </RequirePermission>,
            ),
          },
          {
            path: 'cafes/:id',
            element: withSuspense(
              <RequirePermission permission="cafes.view">
                <CafeDetailPage />
              </RequirePermission>,
            ),
          },
          {
            path: 'audit',
            element: withSuspense(
              <RequirePermission permission="audit.read">
                <AuditPage />
              </RequirePermission>,
            ),
          },
          {
            path: 'settings',
            element: withSuspense(
              <RequirePermission permission="users.manage">
                <Navigate to="/settings/operators" replace />
              </RequirePermission>,
            ),
          },
          {
            path: 'settings/operators',
            element: withSuspense(
              <RequirePermission permission="users.manage">
                <SettingsPage />
              </RequirePermission>,
            ),
          },
          {
            path: 'settings/smtp',
            element: withSuspense(
              <RequirePermission permission="users.manage">
                <SmtpSettingsPage />
              </RequirePermission>,
            ),
          },
          {
            path: 'settings/email-templates',
            element: withSuspense(
              <RequirePermission permission="users.manage">
                <EmailTemplatesPage />
              </RequirePermission>,
            ),
          },
          {
            path: 'profile',
            element: withSuspense(<ProfilePage />),
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
